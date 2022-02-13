/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types, no-constant-condition */
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as COMMON from '@dpo-packrat/common';

export type WorkflowUtilExtractAssetVersions = {
    success: boolean;
    error?: string;
    idAssetVersions: number[] | null;
    systemObjectAssetVersionMap?: Map<number, number>;
};

export class WorkflowUtil {
    static async extractAssetVersions(idSOs: number[] | undefined): Promise<WorkflowUtilExtractAssetVersions> {
        // confirm that idSystemObject are asset versions; ultimately, we will want to allow a model and/or capture data, depending on the recipe
        if (!idSOs)
            return { success: true, idAssetVersions: null }; // OK to call without objects to act on, at least at this point -- the job itself may complain once started

        const idAssetVersions: number[] | null = [];
        const systemObjectAssetVersionMap: Map<number, number> = new Map<number, number>();
        for (const idSystemObject of idSOs) {
            const OID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(idSystemObject);
            if (!OID) {
                const error: string = `WorkflowUtil.extractAssetVersions unable to compute system object type for ${idSystemObject}`;
                LOG.error(error, LOG.LS.eWF);
                return { success: false, error, idAssetVersions: null };
            } else if (OID.eObjectType != COMMON.eSystemObjectType.eAssetVersion) {
                const error: string = `WorkflowUtil.extractAssetVersions called with invalid system object type ${JSON.stringify(OID)} for ${idSystemObject}; expected eAssetVersion`;
                LOG.error(error, LOG.LS.eWF);
                return { success: false, error, idAssetVersions: null };
            }
            idAssetVersions.push(OID.idObject);
            systemObjectAssetVersionMap.set(idSystemObject, OID.idObject);
        }
        return { success: true, idAssetVersions, systemObjectAssetVersionMap };
    }
}