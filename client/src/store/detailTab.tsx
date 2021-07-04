import create, { GetState, SetState } from 'zustand';
import { eSystemObjectType } from '../types/server';
import {
    CaptureDataDetailFields,
    ProjectDocumentationDetailFields,
    StakeholderDetailFields,
    UnitDetailFields,
    ProjectDetailFields,
    SubjectDetailFields,
    AssetDetailFields,
    AssetVersionDetailFields,
    ActorDetailFields
} from '../types/graphql';

export interface ModelDetailsType {
    DateCreated: string | null;
    idVCreationMethod: number | null;
    idVModality: number | null;
    idVPurpose: number | null;
    idVUnits: number | null;
    idVFileType: number | null;
}

export interface ItemDetailsType extends SubjectDetailFields {
    EntireSubject?: boolean | null | undefined;
}

interface SceneDetailsType {
    HasBeenQCd: boolean;
    IsOriented: boolean;
    CountScene: number;
    CountNode: number;
    CountCamera: number;
    CountLight: number;
    CountModel: number;
    CountMeta: number;
    CountSetup: number;
    CountTour: number;
    ModelSceneXref: any[];
}

export type DetailsTabType =
    | CaptureDataDetailFields
    | ProjectDocumentationDetailFields
    | StakeholderDetailFields
    | UnitDetailFields
    | ProjectDetailFields
    | SubjectDetailFields
    | AssetDetailFields
    | AssetVersionDetailFields
    | ActorDetailFields
    | ModelDetailsType
    | ItemDetailsType
    | SceneDetailsType;

type DetailTabStore = {
    UnitDetails: UnitDetailFields;
    ProjectDetails: ProjectDetailFields;
    SubjectDetails: SubjectDetailFields;
    ItemDetails: ItemDetailsType;
    CaptureDataDetails: CaptureDataDetailFields;
    ModelDetails: ModelDetailsType;
    SceneDetails: SceneDetailsType;
    ProjectDocumentationDetails: ProjectDocumentationDetailFields;
    AssetVersionDetails: AssetVersionDetailFields;
    AssetDetails: AssetDetailFields;
    ActorDetails: ActorDetailFields;
    StakeholderDetails: StakeholderDetailFields;
    updateDetailField: (metadataType: eSystemObjectType, fieldName: string, value: number | string | boolean | Date | null) => void;
    getDetail: (type: eSystemObjectType) => DetailsTabType | void;
    initializeDetailFields: (data: any, type: eSystemObjectType) => void;
};

export const useDetailTabStore = create<DetailTabStore>((set: SetState<DetailTabStore>, get: GetState<DetailTabStore>) => ({
    UnitDetails: {
        Abbreviation: '',
        ARKPrefix: ''
    },
    ProjectDetails: {
        Description: ''
    },
    SubjectDetails: {
        Latitude: null,
        Longitude: null,
        Altitude: null,
        TS0: null,
        TS1: null,
        TS2: null,
        R0: null,
        R1: null,
        R2: null,
        R3: null
    },
    ItemDetails: {
        Latitude: null,
        Longitude: null,
        Altitude: null,
        TS0: null,
        TS1: null,
        TS2: null,
        R0: null,
        R1: null,
        R2: null,
        R3: null,
        EntireSubject: null
    },
    ModelDetails: {
        DateCreated: null,
        idVCreationMethod: null,
        idVModality: null,
        idVPurpose: null,
        idVUnits: null,
        idVFileType: null
    },
    CaptureDataDetails: {
        captureMethod: null,
        dateCaptured: null,
        datasetType: null,
        systemCreated: null,
        description: null,
        cameraSettingUniform: null,
        datasetFieldId: null,
        itemPositionType: null,
        itemPositionFieldId: null,
        itemArrangementFieldId: null,
        focusType: null,
        lightsourceType: null,
        backgroundRemovalMethod: null,
        clusterType: null,
        clusterGeometryFieldId: null,
        folders: [],
        isValidData: null
    },
    SceneDetails: {
        HasBeenQCd: false,
        IsOriented: false,
        CountScene: 0,
        CountNode: 0,
        CountCamera: 0,
        CountLight: 0,
        CountModel: 0,
        CountMeta: 0,
        CountSetup: 0,
        CountTour: 0,
        ModelSceneXref: [
            {
                BoundingBoxP1X: 0,
                BoundingBoxP1Y: 0,
                BoundingBoxP1Z: 0,
                BoundingBoxP2X: 0,
                BoundingBoxP2Y: 0,
                BoundingBoxP2Z: 0,
                FileSize: 0,
                Model: null,
                Name: '',
                Quality: '',
                UVResolution: 0,
                Usage: '',
                idModel: -1,
                idModelSceneXref: 0,
                idScene: 0
            }
        ]
    },
    ProjectDocumentationDetails: {
        Description: ''
    },
    AssetDetails: {
        AssetType: null,
        FilePath: ''
    },
    AssetVersionDetails: {
        Version: null,
        Creator: '',
        DateCreated: '',
        StorageSize: 0,
        Ingested: false
    },
    ActorDetails: {
        OrganizationName: ''
    },
    StakeholderDetails: {
        OrganizationName: '',
        MailingAddress: '',
        EmailAddress: '',
        PhoneNumberMobile: '',
        PhoneNumberOffice: ''
    },
    updateDetailField(assetType, fieldName, value) {
        const { getDetail } = get();
        // console.log('assetType', assetType, 'fieldName', fieldName, 'value', value);

        if (assetType === eSystemObjectType.eUnit) {
            const UnitDetails = getDetail(eSystemObjectType.eUnit) as UnitDetailFields;
            const updatedDetails = { ...UnitDetails, [fieldName]: value };
            set({
                UnitDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eProject) {
            const ProjectDetails = getDetail(eSystemObjectType.eProject) as ProjectDetailFields;
            const updatedDetails = { ...ProjectDetails, [fieldName]: value };
            set({
                ProjectDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eSubject) {
            const SubjectDetails = getDetail(eSystemObjectType.eSubject) as SubjectDetailFields;
            const updatedDetails = { ...SubjectDetails, [fieldName]: value };
            set({
                SubjectDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eItem) {
            const ItemDetails = getDetail(eSystemObjectType.eItem) as ItemDetailsType;
            const updatedDetails = { ...ItemDetails, [fieldName]: value };
            set({
                ItemDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eModel) {
            const ModelDetails = getDetail(eSystemObjectType.eModel) as ModelDetailsType;
            const updatedDetails = { ...ModelDetails, [fieldName]: value };
            set({
                ModelDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eCaptureData) {
            const CaptureDataDetails = getDetail(eSystemObjectType.eCaptureData) as CaptureDataDetailFields;
            const updatedDetails = { ...CaptureDataDetails, [fieldName]: value };
            set({
                CaptureDataDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eScene) {
            const SceneDetails = getDetail(eSystemObjectType.eScene) as SceneDetailsType;
            const updatedDetails = { ...SceneDetails, [fieldName]: value };
            set({
                SceneDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eProjectDocumentation) {
            const ProjectDocumentationDetails = getDetail(eSystemObjectType.eProjectDocumentation) as ProjectDocumentationDetailFields;
            const updatedDetails = { ...ProjectDocumentationDetails, [fieldName]: value };
            set({
                ProjectDocumentationDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eAsset) {
            const AssetDetails = getDetail(eSystemObjectType.eAsset) as AssetDetailFields;
            const updatedDetails = { ...AssetDetails, [fieldName]: value };
            set({
                AssetDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eAssetVersion) {
            const AssetVersionDetails = getDetail(eSystemObjectType.eAssetVersion) as AssetVersionDetailFields;
            const updatedDetails = { ...AssetVersionDetails, [fieldName]: value };
            set({
                AssetVersionDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eActor) {
            const ActorDetails = getDetail(eSystemObjectType.eActor) as ActorDetailFields;
            const updatedDetails = { ...ActorDetails, [fieldName]: value };
            set({
                ActorDetails: updatedDetails
            });
        }

        if (assetType === eSystemObjectType.eStakeholder) {
            const StakeholderDetails = getDetail(eSystemObjectType.eStakeholder) as StakeholderDetailFields;
            const updatedDetails = { ...StakeholderDetails, [fieldName]: value };
            set({
                StakeholderDetails: updatedDetails
            });
        }
    },
    getDetail(assetType) {
        if (assetType === eSystemObjectType.eUnit) {
            const { UnitDetails } = get();
            return UnitDetails;
        }
        if (assetType === eSystemObjectType.eProject) {
            const { ProjectDetails } = get();
            return ProjectDetails;
        }
        if (assetType === eSystemObjectType.eSubject) {
            const { SubjectDetails } = get();
            return SubjectDetails;
        }
        if (assetType === eSystemObjectType.eItem) {
            const { ItemDetails } = get();
            return ItemDetails;
        }
        if (assetType === eSystemObjectType.eModel) {
            const { ModelDetails } = get();
            return ModelDetails;
        }
        if (assetType === eSystemObjectType.eCaptureData) {
            const { CaptureDataDetails } = get();
            return CaptureDataDetails;
        }
        if (assetType === eSystemObjectType.eScene) {
            const { SceneDetails } = get();
            return SceneDetails;
        }
        if (assetType === eSystemObjectType.eProjectDocumentation) {
            const { ProjectDocumentationDetails } = get();
            return ProjectDocumentationDetails;
        }
        if (assetType === eSystemObjectType.eAsset) {
            const { AssetDetails } = get();
            return AssetDetails;
        }
        if (assetType === eSystemObjectType.eAssetVersion) {
            const { AssetVersionDetails } = get();
            return AssetVersionDetails;
        }
        if (assetType === eSystemObjectType.eActor) {
            const { ActorDetails } = get();
            return ActorDetails;
        }
        if (assetType === eSystemObjectType.eStakeholder) {
            const { StakeholderDetails } = get();
            return StakeholderDetails;
        }
        return;
    },
    initializeDetailFields(fetchedQuery, objectType) {
        const { updateDetailField } = get();
        const {
            data: { getDetailsTabDataForObject }
        } = fetchedQuery;
        // console.log('initializeDetailsFields', getDetailsTabDataForObject);
        if (!getDetailsTabDataForObject) return;

        if (objectType === eSystemObjectType.eUnit) {
            const {
                Unit: { Abbreviation, ARKPrefix }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eUnit, 'Abbreviation', Abbreviation);
            updateDetailField(eSystemObjectType.eUnit, 'ARKPrefix', ARKPrefix);
        }

        if (objectType === eSystemObjectType.eProject) {
            const {
                Project: { Description }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eProject, 'Description', Description);
        }

        if (objectType === eSystemObjectType.eSubject) {
            const {
                Subject: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eSubject, 'Latitude', Latitude);
            updateDetailField(eSystemObjectType.eSubject, 'Altitude', Altitude);
            updateDetailField(eSystemObjectType.eSubject, 'Longitude', Longitude);
            updateDetailField(eSystemObjectType.eSubject, 'TS0', TS0);
            updateDetailField(eSystemObjectType.eSubject, 'TS1', TS1);
            updateDetailField(eSystemObjectType.eSubject, 'TS2', TS2);
            updateDetailField(eSystemObjectType.eSubject, 'R0', R0);
            updateDetailField(eSystemObjectType.eSubject, 'R1', R1);
            updateDetailField(eSystemObjectType.eSubject, 'R2', R2);
            updateDetailField(eSystemObjectType.eSubject, 'R3', R3);
        }

        if (objectType === eSystemObjectType.eItem) {
            const {
                Item: { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3, EntireSubject }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eItem, 'Latitude', Latitude);
            updateDetailField(eSystemObjectType.eItem, 'Altitude', Altitude);
            updateDetailField(eSystemObjectType.eItem, 'Longitude', Longitude);
            updateDetailField(eSystemObjectType.eItem, 'TS0', TS0);
            updateDetailField(eSystemObjectType.eItem, 'TS1', TS1);
            updateDetailField(eSystemObjectType.eItem, 'TS2', TS2);
            updateDetailField(eSystemObjectType.eItem, 'R0', R0);
            updateDetailField(eSystemObjectType.eItem, 'R1', R1);
            updateDetailField(eSystemObjectType.eItem, 'R2', R2);
            updateDetailField(eSystemObjectType.eItem, 'R3', R3);
            updateDetailField(eSystemObjectType.eItem, 'EntireSubject', EntireSubject);
        }

        if (objectType === eSystemObjectType.eModel) {
            const {
                Model: {
                    Model: { DateCreated, idVModality, idVPurpose, idVUnits, idVFileType, idVCreationMethod }
                }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eModel, 'DateCreated', DateCreated);
            updateDetailField(eSystemObjectType.eModel, 'idVModality', idVModality);
            updateDetailField(eSystemObjectType.eModel, 'idVPurpose', idVPurpose);
            updateDetailField(eSystemObjectType.eModel, 'idVUnits', idVUnits);
            updateDetailField(eSystemObjectType.eModel, 'idVFileType', idVFileType);
            updateDetailField(eSystemObjectType.eModel, 'idVCreationMethod', idVCreationMethod);
        }

        if (objectType === eSystemObjectType.eCaptureData) {
            const {
                CaptureData: {
                    backgroundRemovalMethod,
                    cameraSettingUniform,
                    captureMethod,
                    clusterGeometryFieldId,
                    clusterType,
                    datasetFieldId,
                    datasetType,
                    dateCaptured,
                    description,
                    focusType,
                    folders,
                    isValidData,
                    itemArrangementFieldId,
                    itemPositionFieldId,
                    itemPositionType,
                    lightsourceType
                }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eCaptureData, 'backgroundRemovalMethod', backgroundRemovalMethod);
            updateDetailField(eSystemObjectType.eCaptureData, 'cameraSettingUniform', cameraSettingUniform);
            updateDetailField(eSystemObjectType.eCaptureData, 'captureMethod', captureMethod);
            updateDetailField(eSystemObjectType.eCaptureData, 'clusterGeometryFieldId', clusterGeometryFieldId);
            updateDetailField(eSystemObjectType.eCaptureData, 'clusterType', clusterType);
            updateDetailField(eSystemObjectType.eCaptureData, 'datasetFieldId', datasetFieldId);
            updateDetailField(eSystemObjectType.eCaptureData, 'datasetType', datasetType);
            updateDetailField(eSystemObjectType.eCaptureData, 'dateCaptured', dateCaptured);
            updateDetailField(eSystemObjectType.eCaptureData, 'description', description);
            updateDetailField(eSystemObjectType.eCaptureData, 'focusType', focusType);
            updateDetailField(eSystemObjectType.eCaptureData, 'folders', folders);
            updateDetailField(eSystemObjectType.eCaptureData, 'isValidData', isValidData);
            updateDetailField(eSystemObjectType.eCaptureData, 'itemArrangementFieldId', itemArrangementFieldId);
            updateDetailField(eSystemObjectType.eCaptureData, 'itemPositionFieldId', itemPositionFieldId);
            updateDetailField(eSystemObjectType.eCaptureData, 'itemPositionType', itemPositionType);
            updateDetailField(eSystemObjectType.eCaptureData, 'lightsourceType', lightsourceType);
        }

        if (objectType === eSystemObjectType.eScene) {
            const {
                Scene: { HasBeenQCd, IsOriented }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eScene, 'HasBeenQCd', HasBeenQCd);
            updateDetailField(eSystemObjectType.eScene, 'IsOriented', IsOriented);
        }

        if (objectType === eSystemObjectType.eProjectDocumentation) {
            const {
                ProjectDocumentation: { Description }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eProjectDocumentation, 'Description', Description);
        }

        if (objectType === eSystemObjectType.eAsset) {
            const {
                Asset: { FilePath, AssetType }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eAsset, 'AssetType', AssetType);
            updateDetailField(eSystemObjectType.eAsset, 'FilePath', FilePath);
        }

        if (objectType === eSystemObjectType.eAssetVersion) {
            const {
                AssetVersion: { Version, Creator, DateCreated, StorageSize, Ingested }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eAssetVersion, 'Version', Version);
            updateDetailField(eSystemObjectType.eAssetVersion, 'Creator', Creator);
            updateDetailField(eSystemObjectType.eAssetVersion, 'DateCreated', DateCreated);
            updateDetailField(eSystemObjectType.eAssetVersion, 'StorageSize', StorageSize);
            updateDetailField(eSystemObjectType.eAssetVersion, 'Ingested', Ingested);
        }

        if (objectType === eSystemObjectType.eActor) {
            const {
                Actor: { OrganizationName }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eActor, 'OrganizationName', OrganizationName);
        }

        if (objectType === eSystemObjectType.eStakeholder) {
            const {
                Stakeholder: { OrganizationName, EmailAddress, PhoneNumberMobile, PhoneNumberOffice, MailingAddress }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eStakeholder, 'OrganizationName', OrganizationName);
            updateDetailField(eSystemObjectType.eStakeholder, 'EmailAddress', EmailAddress);
            updateDetailField(eSystemObjectType.eStakeholder, 'PhoneNumberMobile', PhoneNumberMobile);
            updateDetailField(eSystemObjectType.eStakeholder, 'PhoneNumberOffice', PhoneNumberOffice);
            updateDetailField(eSystemObjectType.eStakeholder, 'MailingAddress', MailingAddress);
        }
    }
}));
