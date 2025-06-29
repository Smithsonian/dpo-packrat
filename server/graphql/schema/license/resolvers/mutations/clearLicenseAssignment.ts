import { ClearLicenseAssignmentResult, MutationClearLicenseAssignmentArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';
import { PublishScene, SceneUpdateResult } from '../../../../../collections/impl/PublishScene';
import * as COMMON from '@dpo-packrat/common';

export default async function clearLicenseAssignment(_: Parent, args: MutationClearLicenseAssignmentArgs, context: Context): Promise<ClearLicenseAssignmentResult> {
    const { input: { idSystemObject, clearAll } } = args;
    const { user } = context;

    const LROld: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    const LicenseOld: DBAPI.License | undefined = LROld?.License ?? undefined;

    const clearAssignmentSuccess = await DBAPI.LicenseManager.clearAssignment(idSystemObject, clearAll ?? undefined);
    if (!clearAssignmentSuccess)
        return { success: false, message: 'There was an error clearing the assigned license. Please try again.' };

    const LRNew: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    const LicenseNew: DBAPI.License | undefined = LRNew?.License ?? undefined;

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
