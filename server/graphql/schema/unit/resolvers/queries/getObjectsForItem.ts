import { QueryGetObjectsForItemArgs, GetObjectsForItemResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

async function getObjectsForItem(_: Parent, args: QueryGetObjectsForItemArgs): Promise<GetObjectsForItemResult> {
    const { idItem } = args.input;
    const SystemObject = await DBAPI.SystemObject.fetchFromItemID(idItem);

    if (SystemObject) {
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(SystemObject.idSystemObject, DBAPI.eObjectGraphMode.eDescendents);

        if (OG) {
            return {
                CaptureData: OG.captureData || [],
                Model: OG.model || [],
                Scene: OG.scene || [],
                IntermediaryFile: OG.intermediaryFile || [],
                ProjectDocumentation: OG.projectDocumentation || []
            };
        }
    }

    return {
        CaptureData: [],
        Model: [],
        Scene: [],
        IntermediaryFile: [],
        ProjectDocumentation: []
    };
}

export default getObjectsForItem;
