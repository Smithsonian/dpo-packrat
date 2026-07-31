import { AssignLicenseResult, MutationAssignLicenseArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { PublishScene, SceneUpdateResult } from '../../../../../collections/impl/PublishScene';
import * as COMMON from '@dpo-packrat/common';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { AuditFactory } from '../../../../../audit/interface/AuditFactory';
import { eAuditType } from '../../../../../db/api/ObjectType';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function assignLicense(_: Parent, args: MutationAssignLicenseArgs, context: Context): Promise<AssignLicenseResult> {
    const { input: { idSystemObject, idLicense } } = args;
    const { user } = context;

    // Authorization: check access to the target SystemObject (fail-closed)
    const ctx = Authorization.getContext();
    if (!ctx || !await Authorization.canAccessSystemObject(ctx, idSystemObject))
        return { success: false, message: AUTH_ERROR.ACCESS_DENIED };

    const LROld: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    const LicenseOld: DBAPI.License | undefined = LROld?.License ?? undefined;

    const LicenseNew = await DBAPI.License.fetch(idLicense);
    if (!LicenseNew)
        return { success: false, message: 'There was an error fetching the license for assignment. Please try again.' };

    // Wrap only the LicenseAssignment writes and the semantic audit row so they commit atomically.
    // The LicenseCache maintenance (a descendant-graph traversal that can be very large for a Subject
    // or higher object) is deliberately kept OUT of the transaction and run post-commit — inside the
    // tx it blew the statement timeout and, because the cache is not transactional, left a phantom
    // assignment behind after the rollback. PublishScene.handleSceneUpdates (Cook trigger) likewise
    // runs post-commit.
    let cacheResolver: DBAPI.LicenseResolver | undefined = undefined;
    let dbResult: { ok: boolean; message?: string };
    try {
        dbResult = await withAuditTransaction(async () => {
            const dbWrite = await DBAPI.LicenseManager.setAssignmentDBWrites(idSystemObject, LicenseNew);
            if (!dbWrite.success)
                return { ok: false, message: 'Error assigning license' };
            cacheResolver = dbWrite.resolver;

            await AuditFactory.emitSemantic({
                action: eAuditType.eActionAssignLicense,
                idSystemObject,
                payload: {
                    before: LicenseOld ? { idLicense: LicenseOld.idLicense, Name: LicenseOld.Name, RestrictLevel: LicenseOld.RestrictLevel } : null,
                    after:  { idLicense: LicenseNew.idLicense, Name: LicenseNew.Name, RestrictLevel: LicenseNew.RestrictLevel },
                },
            });
            return { ok: true };
        });
    } catch (error) {
        // The transaction threw and rolled back: nothing was persisted. The cache was not mutated in
        // the tx, but drop this object's entry defensively so no stale value can be read. Raw error
        // text is kept server-side only.
        RK.logError(RK.LogSection.eGQL,'assign license failed','transaction failed',{ ...args.input, error: error instanceof Error ? error.message : String(error) },'GraphQL.License');
        await CACHE.LicenseCache.invalidateResolver(idSystemObject);
        return { success: false, message: 'There was an error assigning the license. Please try again.' };
    }

    if (!dbResult.ok) {
        await CACHE.LicenseCache.invalidateResolver(idSystemObject);
        return { success: false, message: dbResult.message ?? 'Error assigning license' };
    }

    // Post-commit: maintain the license cache now that the assignment is durably persisted. The
    // descendant traversal runs outside the lock window; a failure here is non-fatal (the cache is
    // rebuildable) and drops to a targeted invalidation.
    if (!await DBAPI.LicenseManager.maintainCacheAfterSet(idSystemObject, cacheResolver))
        await CACHE.LicenseCache.invalidateResolver(idSystemObject);

    // If this is a scene, handle license changes (post-commit):
    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    if (!oID) {
        RK.logError(RK.LogSection.eGQL,'assign license failed',`unable to load object info for idSystemObject ${idSystemObject}`,{ ...args.input },'GraphQL.License');
        return { success: false, message: 'Unable to handle impact of license update' };
    }

    if (oID.eObjectType === COMMON.eSystemObjectType.eScene) {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
        if (!scene) {
            RK.logError(RK.LogSection.eGQL,'assign license failed',`unable to load scene with id ${oID.idObject}`,{ ...args.input },'GraphQL.License');
            return { success: false, message: 'Unable to handle impact of license update' };
        }
        const res: SceneUpdateResult = await PublishScene.handleSceneUpdates(oID.idObject, idSystemObject, user?.idUser,
            scene.PosedAndQCd, scene.PosedAndQCd, LicenseOld, LicenseNew);
        if (!res.success) {
            RK.logError(RK.LogSection.eGQL,'assign license failed',res.error,{ ...args.input },'GraphQL.License');
            return { success: false, message: res.error };
        }

        const message: string = res.downloadsGenerated ? 'Scene downloads are being generated' : res.downloadsRemoved ? 'Scene downloads were removed' : '';
        RK.logInfo(RK.LogSection.eGQL,'assign license',message,{},'GraphQL.License');
        return { success: true, message };
    }

    RK.logInfo(RK.LogSection.eGQL,'assign license success',undefined,{ ...args.input },'GraphQL.License');
    return { success: true, message: '' };
}
