import { AssignLicenseResult, MutationAssignLicenseArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import * as LOG from '../../../../../utils/logger';
import { PublishScene, SceneUpdateResult } from '../../../../../collections/impl/PublishScene';
import * as COMMON from '@dpo-packrat/common';

export default async function assignLicense(_: Parent, args: MutationAssignLicenseArgs, context: Context): Promise<AssignLicenseResult> {
    const { input: { idSystemObject, idLicense } } = args;
    const { user } = context;

    const LROld: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    const LicenseOld: DBAPI.License | undefined = LROld?.License ?? undefined;

    const LicenseNew = await DBAPI.License.fetch(idLicense);
    if (!LicenseNew)
        return { success: false, message: 'There was an error fetching the license for assignment. Please try again.' };

    const assignmentSuccess = await DBAPI.LicenseManager.setAssignment(idSystemObject, LicenseNew);
    if (!assignmentSuccess)
        return { success: false, message: 'Error assigning license' };

    // If this is a scene, handle license changes:
    const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
    if (!oID) {
        LOG.error(`assignLicense unable to load object info for idSystemObject ${idSystemObject}`, LOG.LS.eGQL);
        return { success: false, message: 'Unable to handle impact of license update' };
    }

    if (oID.eObjectType === COMMON.eSystemObjectType.eScene) {
        const scene: DBAPI.Scene | null = await DBAPI.Scene.fetch(oID.idObject);
        if (!scene) {
            LOG.error(`assignLicense unable to load scene with id ${oID.idObject}`, LOG.LS.eGQL);
            return { success: false, message: 'Unable to handle impact of license update' };
        }
        const res: SceneUpdateResult = await PublishScene.handleSceneUpdates(oID.idObject, idSystemObject, user?.idUser,
            scene.PosedAndQCd, scene.PosedAndQCd, LicenseOld, LicenseNew);
        if (!res.success)
            return { success: false, message: res.error };
        return { success: true, message: res.downloadsGenerated ? 'Scene downloads are being generated' : res.downloadsRemoved ? 'Scene downloads were removed' : '' };
    }

    return { success: true, message: '' };
}
