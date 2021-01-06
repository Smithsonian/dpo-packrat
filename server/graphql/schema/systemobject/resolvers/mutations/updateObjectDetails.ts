import { eSystemObjectType } from '../../../../../db';
import { UpdateObjectDetailsResult, MutationUpdateObjectDetailsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils';

export default async function updateObjectDetails(_: Parent, args: MutationUpdateObjectDetailsArgs): Promise<UpdateObjectDetailsResult> {
    const { input } = args;
    const { objectType, data } = input;

    // TODO: KARAN: update {data} for {idSystemObject}
    LOG.logger.info(data);

    switch (objectType) {
        case eSystemObjectType.eUnit:
            break;
        case eSystemObjectType.eProject:
            break;
        case eSystemObjectType.eSubject:
            break;
        case eSystemObjectType.eItem:
            break;
        case eSystemObjectType.eCaptureData:
            break;
        case eSystemObjectType.eModel:
            break;
        case eSystemObjectType.eScene:
            break;
        case eSystemObjectType.eIntermediaryFile:
            break;
        case eSystemObjectType.eProjectDocumentation:
            break;
        case eSystemObjectType.eAsset:
            break;
        case eSystemObjectType.eAssetVersion:
            break;
        case eSystemObjectType.eActor:
            break;
        case eSystemObjectType.eStakeholder:
            break;
        default:
            break;
    }

    return { success: true };
}

