import { ClearLicenseAssignmentResult, MutationClearLicenseAssignmentArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { PublishScene, SceneUpdateResult } from '../../../../../collections/impl/PublishScene';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import * as COMMON from '@dpo-packrat/common';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eAuditType } from '../../../../../db/api/ObjectType';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function clearLicenseAssignment(_: Parent, args: MutationClearLicenseAssignmentArgs, context: Context): Promise<ClearLicenseAssignmentResult> {
    const { input: { idSystemObject, clearAll } } = args;
    const { user } = context;

    // Authorization: check access to the target SystemObject
    const ctx = Authorization.getContext();
    if (!ctx || !await Authorization.canAccessSystemObject(ctx, idSystemObject))
        return { success: false, message: AUTH_ERROR.ACCESS_DENIED };

    const LROld: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    const LicenseOld: DBAPI.License | undefined = LROld?.License ?? undefined;

    // Wrap only the LicenseAssignment writes and the audit row. The LicenseCache maintenance (a
    // potentially large descendant traversal) is kept OUT of the tx and run post-commit — inside it
    // blew the statement timeout and left the cache inconsistent after a rollback. The Cook trigger
    // via PublishScene.handleSceneUpdates likewise runs post-commit.
    let LicenseNew: DBAPI.License | undefined = undefined;
    let dbResult: { ok: boolean; message?: string };
    try {
        dbResult = await withAuditTransaction(async () => {
            const clearAssignmentSuccess = await DBAPI.LicenseManager.clearAssignmentDBWrites(idSystemObject, clearAll ?? undefined);
            if (!clearAssignmentSuccess)
                return { ok: false, message: 'There was an error clearing the assigned license. Please try again.' };

            // Resolve the post-clear inherited license directly from the DB (reflecting this tx's
            // termination writes) rather than the cache, which still holds the pre-clear value until
            // the post-commit maintenance runs.
            const LRNewInner: DBAPI.LicenseResolver | null = await DBAPI.LicenseResolver.fetch(idSystemObject);
            LicenseNew = LRNewInner?.License ?? undefined;

            await AuditFactory.emitSemantic({
                action: eAuditType.eActionClearLicense,
                idSystemObject,
                payload: {
                    clearAll: Boolean(clearAll),
                    before: LicenseOld ? { idLicense: LicenseOld.idLicense, Name: LicenseOld.Name, RestrictLevel: LicenseOld.RestrictLevel } : null,
                    after:  LicenseNew ? { idLicense: LicenseNew.idLicense, Name: LicenseNew.Name, RestrictLevel: LicenseNew.RestrictLevel } : null,
                },
            });
            return { ok: true };
        });
    } catch (error) {
        RK.logError(RK.LogSection.eGQL,'clear license assignment failed','transaction failed',{ idSystemObject, error: error instanceof Error ? error.message : String(error) },'GraphQL.License.Assignment');
        await CACHE.LicenseCache.invalidateResolver(idSystemObject);
        return { success: false, message: 'There was an error clearing the assigned license. Please try again.' };
    }

    if (!dbResult.ok) {
        await CACHE.LicenseCache.invalidateResolver(idSystemObject);
        return { success: false, message: dbResult.message ?? 'There was an error clearing the assigned license. Please try again.' };
    }

    // Post-commit: maintain the license cache now that the clear is durably persisted.
    if (!await DBAPI.LicenseManager.maintainCacheAfterClear(idSystemObject))
        await CACHE.LicenseCache.invalidateResolver(idSystemObject);

    // If this is a scene, handle license changes:
    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    if (!oID) {
        RK.logError(RK.LogSection.eGQL,'clear license assignment failed',`unable to load object info for idSystemObject ${idSystemObject}`,{},'GraphQL.License.Assignment');
        return { success: false, message: 'Unable to handle impact of license update' };
    }

    if (oID.eObjectType === COMMON.eSystemObjectType.eScene) {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
        if (!scene) {
            RK.logError(RK.LogSection.eGQL,'clear license assignment failed',`unable to load scene with id ${oID.idObject}`,{},'GraphQL.License.Assignment');
            return { success: false, message: 'Unable to handle impact of license update' };
        }
        const res: SceneUpdateResult = await PublishScene.handleSceneUpdates(oID.idObject, idSystemObject, user?.idUser,
            scene.PosedAndQCd, scene.PosedAndQCd, LicenseOld, LicenseNew);
        if (!res.success) {
            RK.logError(RK.LogSection.eGQL,'clear license assignment failed',res.error,{ ...oID },'GraphQL.License.Assignment');
            return { success: false, message: res.error };
        }
        return { success: true, message: res.downloadsGenerated ? 'Scene downloads are being generated' : res.downloadsRemoved ? 'Scene downloads were removed' : '' };
    }

    return { success: true, message: '' };
}
