import * as DBAPI from '../../../../../db';
import { eSystemObjectType } from '../../../../../db';
import { GetDetailsTabDataForObjectResult, QueryGetDetailsTabDataForObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getDetailsTabDataForObject(_: Parent, args: QueryGetDetailsTabDataForObjectArgs): Promise<GetDetailsTabDataForObjectResult> {
    const { input } = args;
    const { idSystemObject, objectType } = input;

    const result: GetDetailsTabDataForObjectResult = {
        Unit: null,
        Project: null,
        Subject: null,
        Item: null,
        CaptureData: null,
        Model: null,
        Scene: null,
        IntermediaryFile: null,
        ProjectDocumentation: null,
        Asset: null,
        AssetVersion: null,
        Actor: null,
        Stakeholder: null,
    };

    const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);

    switch (objectType) {
        case eSystemObjectType.eUnit:
            if (systemObject?.idUnit) result.Unit = await DBAPI.Unit.fetch(systemObject.idUnit);
            break;
        case eSystemObjectType.eProject:
            if (systemObject?.idProject) result.Project = await DBAPI.Project.fetch(systemObject.idProject);
            break;
        case eSystemObjectType.eSubject:
            if (systemObject?.idSubject) result.Subject = await DBAPI.Subject.fetch(systemObject.idSubject);
            break;
        case eSystemObjectType.eItem:
            if (systemObject?.idItem) result.Item = await DBAPI.Item.fetch(systemObject.idItem);
            break;
        case eSystemObjectType.eCaptureData:
            // TODO: KARAN: fetch IngestPhotogrammetry
            break;
        case eSystemObjectType.eModel:
            // TODO: KARAN: fetch IngestModel
            break;
        case eSystemObjectType.eScene:
            if (systemObject?.idScene) result.Scene = await DBAPI.Scene.fetch(systemObject.idScene);
            break;
        case eSystemObjectType.eIntermediaryFile:
            if (systemObject?.idIntermediaryFile) result.IntermediaryFile = await DBAPI.IntermediaryFile.fetch(systemObject.idIntermediaryFile);
            break;
        case eSystemObjectType.eProjectDocumentation:
            if (systemObject?.idProjectDocumentation) result.ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(systemObject.idProjectDocumentation);
            break;
        case eSystemObjectType.eAsset:
            if (systemObject?.idAsset) result.Asset = await DBAPI.Asset.fetch(systemObject.idAsset);
            break;
        case eSystemObjectType.eAssetVersion:
            if (systemObject?.idAssetVersion) result.AssetVersion = await DBAPI.AssetVersion.fetch(systemObject.idAssetVersion);
            break;
        case eSystemObjectType.eActor:
            if (systemObject?.idActor) result.Actor = await DBAPI.Actor.fetch(systemObject.idActor);
            break;
        case eSystemObjectType.eStakeholder:
            if (systemObject?.idStakeholder) result.Stakeholder = await DBAPI.Stakeholder.fetch(systemObject.idStakeholder);
            break;
        default:
            break;
    }

    return result;
}

