/* eslint-disable @typescript-eslint/no-explicit-any */
import create, { GetState, SetState } from 'zustand';
import { eSystemObjectType } from '@dpo-packrat/common';
import {
    CaptureDataDetailFields,
    ProjectDocumentationDetailFields,
    StakeholderDetailFields,
    UnitDetailFields,
    ProjectDetailFields,
    SubjectDetailFields,
    AssetDetailFields,
    AssetVersionDetailFields,
    ActorDetailFields,
    UpdateObjectDetailsDataInput,
    IngestFolder
} from '../types/graphql';
import * as yup from 'yup';
import { nullableSelectFields } from '../utils/controls';

export interface ModelDetailsType {
    DateCreated: string | null;
    idVCreationMethod: number | null;
    idVModality: number | null;
    idVPurpose: number | null;
    idVUnits: number | null;
    idVFileType: number | null;
    Variant: string;
}

export interface ItemDetailsType {
    EntireSubject?: boolean | null | undefined;
}

export type DetailsViewFieldErrors = {
    model: {
        name: boolean;
        dateCreated: boolean;
    };
    captureData: {
        name: boolean;
        datasetFieldId: boolean;
        itemPositionFieldId: boolean;
        itemArrangementFieldId: boolean;
        clusterGeometryFieldId: boolean;
    };
};

export interface SceneDetailsType {
    CountScene: number;
    CountNode: number;
    CountCamera: number;
    CountLight: number;
    CountModel: number;
    CountMeta: number;
    CountSetup: number;
    CountTour: number;
    EdanUUID: string | null;
    ApprovedForPublication: boolean;
    PublicationApprover: string | null;
    PosedAndQCd: boolean;
    CanBeQCd: boolean;
    ModelSceneXref: any[];
    Links: string[];
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
    updateDetailField: (metadataType: eSystemObjectType, fieldName: string, value: number | string | string[] | boolean | Date | null | IngestFolder[]) => void;
    getDetail: (type: eSystemObjectType) => DetailsTabType | void;
    initializeDetailFields: (data: any, type: eSystemObjectType) => void;
    getDetailsViewFieldErrors: (metadata: UpdateObjectDetailsDataInput, objectType: eSystemObjectType) => string[];
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
        EntireSubject: null
    },
    ModelDetails: {
        DateCreated: null,
        idVCreationMethod: null,
        idVModality: null,
        idVPurpose: null,
        idVUnits: null,
        idVFileType: null,
        Variant: '[]', // indices into Vocabulary: raw_clean, presentation
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
        isValidData: null,
        datasetUse: '[207,208,209]', // indices into Vocabulary: alignment, reconstruction, texture generation
    },
    SceneDetails: {
        CountScene: 0,
        CountNode: 0,
        CountCamera: 0,
        CountLight: 0,
        CountModel: 0,
        CountMeta: 0,
        CountSetup: 0,
        CountTour: 0,
        EdanUUID: null,
        ApprovedForPublication: false,
        PublicationApprover: null,
        PosedAndQCd: false,
        CanBeQCd: false,
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
        ],
        Links: []
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
        if (value === -1 && nullableSelectFields.has(fieldName)) value = null;

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
                Item: { EntireSubject }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eItem, 'EntireSubject', EntireSubject);
        }

        if (objectType === eSystemObjectType.eModel) {
            const {
                Model: {
                    Model: { DateCreated, idVModality, idVPurpose, idVUnits, idVFileType, idVCreationMethod, Variant }
                }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eModel, 'DateCreated', DateCreated);
            updateDetailField(eSystemObjectType.eModel, 'idVModality', idVModality);
            updateDetailField(eSystemObjectType.eModel, 'idVPurpose', idVPurpose);
            updateDetailField(eSystemObjectType.eModel, 'idVUnits', idVUnits);
            updateDetailField(eSystemObjectType.eModel, 'idVFileType', idVFileType);
            updateDetailField(eSystemObjectType.eModel, 'idVCreationMethod', idVCreationMethod);
            updateDetailField(eSystemObjectType.eModel, 'Variant', Variant);
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
                    lightsourceType,
                    datasetUse
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
            const sanitizedFolders = folders.map((folder) => {
                return {
                    name: folder.name,
                    variantType: folder.variantType
                };
            });
            updateDetailField(eSystemObjectType.eCaptureData, 'folders', sanitizedFolders);
            updateDetailField(eSystemObjectType.eCaptureData, 'isValidData', isValidData);
            updateDetailField(eSystemObjectType.eCaptureData, 'itemArrangementFieldId', itemArrangementFieldId);
            updateDetailField(eSystemObjectType.eCaptureData, 'itemPositionFieldId', itemPositionFieldId);
            updateDetailField(eSystemObjectType.eCaptureData, 'itemPositionType', itemPositionType);
            updateDetailField(eSystemObjectType.eCaptureData, 'lightsourceType', lightsourceType);
            updateDetailField(eSystemObjectType.eCaptureData, 'datasetUse', datasetUse);
        }

        if (objectType === eSystemObjectType.eScene) {
            const {
                Scene: { ApprovedForPublication, PublicationApprover, PosedAndQCd, CanBeQCd, EdanUUID, Links }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eScene, 'ApprovedForPublication', ApprovedForPublication);
            updateDetailField(eSystemObjectType.eScene, 'PublicationApprover', PublicationApprover);
            updateDetailField(eSystemObjectType.eScene, 'PosedAndQCd', PosedAndQCd);
            updateDetailField(eSystemObjectType.eScene, 'CanBeQCd', CanBeQCd);
            updateDetailField(eSystemObjectType.eScene, 'EdanUUID', EdanUUID);
            updateDetailField(eSystemObjectType.eScene, 'Links', Links);
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
                AssetVersion: { Version, Creator, DateCreated, StorageHash, StorageSize, Ingested, FilePath }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eAssetVersion, 'Version', Version);
            updateDetailField(eSystemObjectType.eAssetVersion, 'Creator', Creator);
            updateDetailField(eSystemObjectType.eAssetVersion, 'DateCreated', DateCreated);
            updateDetailField(eSystemObjectType.eAssetVersion, 'StorageSize', StorageSize);
            updateDetailField(eSystemObjectType.eAssetVersion, 'Ingested', Ingested);
            updateDetailField(eSystemObjectType.eAssetVersion, 'StorageHash', StorageHash);
            updateDetailField(eSystemObjectType.eAssetVersion, 'FilePath', FilePath);
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
    },
    getDetailsViewFieldErrors: (metadata: UpdateObjectDetailsDataInput, objectType: eSystemObjectType): string[] => {
        // UPDATE these error fields as we include more validation for details tab
        // errors should be responsible for rendering error version of the input
        // const errors: DetailsViewFieldErrors = {
        //     model: {
        //         name: false,
        //         dateCreated: false
        //     },
        //     captureData: {
        //         name: false,
        //         datasetFieldId: false,
        //         itemPositionFieldId: false,
        //         itemArrangementFieldId: false,
        //         clusterGeometryFieldId: false
        //     }
        // };

        const option = {
            abortEarly: false
        };
        const errorMessages: string[] = [];
        if (!metadata.Name?.trim().length) errorMessages.push('Please input a valid Name');
        if (objectType === eSystemObjectType.eModel) {
            const { Model } = metadata;

            try {
                schemaModel.validateSync(
                    {
                        dateCreated: Model?.DateCreated
                    },
                    option
                );
            } catch (error) {
                if (error instanceof Error)
                    errorMessages.push(error.message);
            }
        }

        if (objectType === eSystemObjectType.eCaptureData) {
            const { CaptureData } = metadata;

            try {
                schemaCD.validateSync(
                    {
                        datasetFieldId: CaptureData?.datasetFieldId,
                        itemArrangementFieldId: CaptureData?.itemArrangementFieldId,
                        itemPositionFieldId: CaptureData?.itemPositionFieldId,
                        clusterGeometryFieldId: CaptureData?.clusterGeometryFieldId
                    },
                    option
                );
            } catch (error) {
                if (error instanceof Error)
                    errorMessages.push(error.message);
            }
        }

        if (objectType === eSystemObjectType.eSubject) {
            const { Subject } = metadata;
            try {
                schemaSubject.validateSync(
                    {
                        Latitude: Number(Subject?.Latitude),
                        Longitude: Number(Subject?.Longitude),
                        Altitude: Number(Subject?.Altitude),
                        TS0: Number(Subject?.TS0),
                        TS1: Number(Subject?.TS1),
                        TS2: Number(Subject?.TS2),
                        R0: Number(Subject?.R0),
                        R1: Number(Subject?.R1),
                        R2: Number(Subject?.R2),
                        R3: Number(Subject?.R3)
                    },
                    option
                );
            } catch (error) {
                if (error instanceof Error)
                    errorMessages.push(error.message);
            }
        }
        // if (objectType === eSystemObjectType.eItem) {}

        return errorMessages;
    }
}));

const schemaCD = yup.object().shape({
    datasetFieldId: yup.number().positive('Dataset Field ID must be positive').max(2147483647, 'Dataset Field ID is too large').nullable(),
    itemPositionFieldId: yup.number().positive('Position Field ID must be positive').max(2147483647, 'Position Field ID is too large').nullable(),
    itemArrangementFieldId: yup.number().positive('Arrangement Field ID must be positive').max(2147483647, 'Arrangement Field ID is too large').nullable(),
    clusterGeometryFieldId: yup.number().positive('Cluster Geometry Field ID must be positive').max(2147483647, 'Cluster Geometry Field ID is too large').nullable()
});

const schemaModel = yup.object().shape({
    // ignore time from date comparison to avoid timezone issues
    dateCreated: yup.date().max(new Date(new Date().setHours(0, 0, 0, 0)), 'Date Created cannot be set in the future')
});

const schemaSubject = yup.object().shape({
    Latitude: yup.number().typeError('Number must be in standard or scientific notation'),
    Longitude: yup.number().typeError('Number must be in standard or scientific notation'),
    Altitude: yup.number().typeError('Number must be in standard or scientific notation'),
    TS0: yup.number().typeError('Number must be in standard or scientific notation'),
    TS1: yup.number().typeError('Number must be in standard or scientific notation'),
    TS2: yup.number().typeError('Number must be in standard or scientific notation'),
    R0: yup.number().typeError('Number must be in standard or scientific notation'),
    R1: yup.number().typeError('Number must be in standard or scientific notation'),
    R2: yup.number().typeError('Number must be in standard or scientific notation'),
    R3: yup.number().typeError('Number must be in standard or scientific notation')
});