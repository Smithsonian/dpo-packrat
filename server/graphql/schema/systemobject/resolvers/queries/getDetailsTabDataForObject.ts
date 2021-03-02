import * as DBAPI from '../../../../../db';
import { eSystemObjectType } from '../../../../../db';
import {
    AssetVersionDetailFields,
    AssetDetailFields,
    SubjectDetailFields,
    ItemDetailFields,
    GetDetailsTabDataForObjectResult,
    QueryGetDetailsTabDataForObjectArgs,
    CaptureDataDetailFields,
    ModelDetailFields,
    SceneDetailFields
} from '../../../../../types/graphql';
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
        Stakeholder: null
    };

    const systemObject: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);

    switch (objectType) {
        case eSystemObjectType.eUnit:
            if (systemObject?.idUnit) result.Unit = await DBAPI.Unit.fetch(systemObject.idUnit);
            break;
        case eSystemObjectType.eProject:
            if (systemObject?.idProject) result.Project = await DBAPI.Project.fetch(systemObject.idProject);
            break;
        case eSystemObjectType.eSubject: {
            if (systemObject?.idSubject) {
                let fields: SubjectDetailFields = {};

                const Subject = await DBAPI.Subject.fetch(systemObject.idSubject);

                if (Subject?.idGeoLocation) {
                    const GeoLocation = await DBAPI.GeoLocation.fetch(Subject.idGeoLocation);
                    fields = { ...fields, ...GeoLocation };
                }

                result.Subject = fields;
            }
            break;
        }
        case eSystemObjectType.eItem: {
            if (systemObject?.idItem) {
                let fields: ItemDetailFields = {};

                const Item = await DBAPI.Item.fetch(systemObject.idItem);
                fields = { ...Item };

                if (Item?.idGeoLocation) {
                    const GeoLocation = await DBAPI.GeoLocation.fetch(Item.idGeoLocation);
                    fields = { ...fields, ...GeoLocation };
                }

                result.Item = fields;
            }
            break;
        }
        case eSystemObjectType.eCaptureData:
            if (systemObject?.idCaptureData) {
                result.CaptureData = await getCaptureDataDetailFields(systemObject.idCaptureData);
            }
            break;
        case eSystemObjectType.eModel:
            if (systemObject?.idModel) {
                result.Model = await getModelDetailFields(systemObject.idModel);
            }
            break;
        case eSystemObjectType.eScene:
            if (systemObject?.idScene) {
                // TODO: KARAN: resolve Links, AssetType, Tours, Annotation when SceneDetailFields is finalized?
                let fields: SceneDetailFields = {
                    Links: []
                };
                const Scene = await DBAPI.Scene.fetch(systemObject.idScene);
                fields = {
                    ...fields,
                    HasBeenQCd: Scene?.HasBeenQCd,
                    IsOriented: Scene?.IsOriented
                };
                result.Scene = fields;
            }
            break;
        case eSystemObjectType.eIntermediaryFile:
            if (systemObject?.idIntermediaryFile) result.IntermediaryFile = await DBAPI.IntermediaryFile.fetch(systemObject.idIntermediaryFile);
            break;
        case eSystemObjectType.eProjectDocumentation:
            if (systemObject?.idProjectDocumentation) result.ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(systemObject.idProjectDocumentation);
            break;
        case eSystemObjectType.eAsset: {
            if (systemObject?.idAsset) {
                let fields: AssetDetailFields = {};

                const Asset = await DBAPI.Asset.fetch(systemObject.idAsset);
                fields = { ...Asset };

                if (Asset?.idVAssetType) {
                    const Vocabulary = await DBAPI.Vocabulary.fetch(Asset.idVAssetType);
                    fields = { ...fields, AssetType: Vocabulary?.idVocabulary };
                }
                result.Asset = fields;
            }
            break;
        }
        case eSystemObjectType.eAssetVersion: {
            if (systemObject?.idAssetVersion) {
                let fields: AssetVersionDetailFields = {};

                const AssetVersion = await DBAPI.AssetVersion.fetch(systemObject.idAssetVersion);
                fields = { ...AssetVersion };

                if (AssetVersion?.idUserCreator) {
                    const User = await DBAPI.User.fetch(AssetVersion.idUserCreator);
                    fields = { ...fields, Creator: User?.Name };
                }
                result.AssetVersion = fields;
            }

            break;
        }
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

async function getCaptureDataDetailFields(idCaptureData: number): Promise<CaptureDataDetailFields> {
    let fields: CaptureDataDetailFields = {
        folders: []
    };

    // TODO: KARAN resolve folders, systemCreated from where?
    const CaptureData = await DBAPI.CaptureData.fetch(idCaptureData);
    fields = {
        ...fields,
        systemCreated: true,
        dateCaptured: CaptureData?.DateCaptured.toISOString(),
        description: CaptureData?.Description,
        captureMethod: CaptureData?.idVCaptureMethod
    };

    const CaptureDataPhoto = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(idCaptureData);

    if (CaptureDataPhoto && CaptureDataPhoto[0]) {
        const [CD] = CaptureDataPhoto;

        fields = {
            ...fields,
            cameraSettingUniform: CD.CameraSettingsUniform,
            datasetType: CD.idVCaptureDatasetType,
            datasetFieldId: CD.CaptureDatasetFieldID,
            itemPositionType: CD.idVItemPositionType,
            itemPositionFieldId: CD.idVItemPositionType,
            itemArrangementFieldId: CD.ItemArrangementFieldID,
            focusType: CD.idVFocusType,
            lightsourceType: CD.idVLightSourceType,
            backgroundRemovalMethod: CD.idVBackgroundRemovalMethod,
            clusterType: CD.idVClusterType,
            clusterGeometryFieldId: CD.ClusterGeometryFieldID,
        };
    }


    return fields;
}

async function getModelDetailFields(idModel: number): Promise<ModelDetailFields> {
    let fields: ModelDetailFields = {
        uvMaps: []
    };

    // TODO: KARAN resolve uvMaps, systemCreated?
    const modelConstellation = await DBAPI.ModelConstellation.fetch(idModel);
    if (!modelConstellation)
        return fields;

    const model = modelConstellation.model;
    fields = {
        ...fields,
        master: model?.Master,
        authoritative: model?.Authoritative,
        creationMethod: model?.idVCreationMethod,
        modality: model?.idVModality,
        purpose: model?.idVPurpose,
        units: model?.idVUnits,
        dateCaptured: model?.DateCreated.toISOString(),
        modelFileType: model?.idVFileType,
    };

    // TODO: fetch all assets associated with Model and ModelMaterialUVMap's; add up storage size
    if (model?.idAssetThumbnail) {
        const AssetVersion = await DBAPI.AssetVersion.fetchFromAsset(model.idAssetThumbnail);
        if (AssetVersion && AssetVersion[0]) {
            const [AV] = AssetVersion;
            fields = {
                ...fields,
                size: AV.StorageSize
            };
        }
    }

    // TODO: fetch Material Channels, etc.
    const modelMetrics = modelConstellation.modelMetric;
    if (modelMetrics) {
        fields = {
            ...fields,
            boundingBoxP1X: modelMetrics.BoundingBoxP1X,
            boundingBoxP1Y: modelMetrics.BoundingBoxP1Y,
            boundingBoxP1Z: modelMetrics.BoundingBoxP1Z,
            boundingBoxP2X: modelMetrics.BoundingBoxP2X,
            boundingBoxP2Y: modelMetrics.BoundingBoxP2Y,
            boundingBoxP2Z: modelMetrics.BoundingBoxP2Z,
            countPoint: modelMetrics.CountPoint,
            countFace: modelMetrics.CountFace,
            countColorChannel: modelMetrics.CountColorChannel,
            countTextureCoorinateChannel: modelMetrics.CountTextureCoorinateChannel,
            hasBones: modelMetrics.HasBones,
            hasFaceNormals: modelMetrics.HasFaceNormals,
            hasTangents: modelMetrics.HasTangents,
            hasTextureCoordinates: modelMetrics.HasTextureCoordinates,
            hasVertexNormals: modelMetrics.HasVertexNormals,
            hasVertexColor: modelMetrics.HasVertexColor,
            isManifold: modelMetrics.IsManifold,
            isWatertight: modelMetrics.IsWatertight,
        };
    }

    return fields;
}