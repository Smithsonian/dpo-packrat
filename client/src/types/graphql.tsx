/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';

export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    DateTime: any;
    Upload: any;
};


export type AccessAction = {
    __typename?: 'AccessAction';
    idAccessAction: Scalars['Int'];
    Name: Scalars['String'];
    SortOrder: Scalars['Int'];
    AccessRole?: Maybe<Array<Maybe<AccessRole>>>;
};

export type AccessContext = {
    __typename?: 'AccessContext';
    idAccessContext: Scalars['Int'];
    Authoritative: Scalars['Boolean'];
    CaptureData: Scalars['Boolean'];
    Global: Scalars['Boolean'];
    IntermediaryFile: Scalars['Boolean'];
    Model: Scalars['Boolean'];
    Scene: Scalars['Boolean'];
    AccessContextObject?: Maybe<Array<Maybe<AccessContextObject>>>;
    AccessPolicy?: Maybe<Array<Maybe<AccessPolicy>>>;
};

export type AccessContextObject = {
    __typename?: 'AccessContextObject';
    idAccessContextObject: Scalars['Int'];
    idAccessContext: Scalars['Int'];
    idSystemObject: Scalars['Int'];
    AccessContext?: Maybe<AccessContext>;
    SystemObject?: Maybe<SystemObject>;
};

export type AccessPolicy = {
    __typename?: 'AccessPolicy';
    idAccessPolicy: Scalars['Int'];
    idAccessContext: Scalars['Int'];
    idAccessRole: Scalars['Int'];
    idUser: Scalars['Int'];
    AccessContext?: Maybe<AccessContext>;
    AccessRole?: Maybe<AccessRole>;
    User?: Maybe<User>;
};

export type AccessRole = {
    __typename?: 'AccessRole';
    idAccessRole: Scalars['Int'];
    Name: Scalars['String'];
    AccessAction?: Maybe<Array<Maybe<AccessAction>>>;
};

export type Asset = {
    __typename?: 'Asset';
    idAsset: Scalars['Int'];
    FileName: Scalars['String'];
    FilePath: Scalars['String'];
    idAssetGroup?: Maybe<Scalars['Int']>;
    idSystemObject?: Maybe<Scalars['Int']>;
    StorageKey: Scalars['String'];
    AssetGroup?: Maybe<AssetGroup>;
    SystemObjectSource?: Maybe<SystemObject>;
    AssetVersion?: Maybe<Array<Maybe<AssetVersion>>>;
    VAssetType?: Maybe<Vocabulary>;
    SystemObject?: Maybe<SystemObject>;
};

export type AssetVersion = {
    __typename?: 'AssetVersion';
    idAssetVersion: Scalars['Int'];
    DateCreated: Scalars['DateTime'];
    idAsset: Scalars['Int'];
    idUserCreator: Scalars['Int'];
    StorageHash: Scalars['String'];
    StorageSize: Scalars['Int'];
    StorageKeyStaging: Scalars['String'];
    FileName: Scalars['String'];
    Ingested: Scalars['Boolean'];
    Version: Scalars['Int'];
    Asset?: Maybe<Asset>;
    User?: Maybe<User>;
    SystemObject?: Maybe<SystemObject>;
};

export type AssetGroup = {
    __typename?: 'AssetGroup';
    idAssetGroup: Scalars['Int'];
    Asset?: Maybe<Array<Maybe<Asset>>>;
};

export type CaptureData = {
    __typename?: 'CaptureData';
    idCaptureData: Scalars['Int'];
    DateCaptured: Scalars['DateTime'];
    Description: Scalars['String'];
    idVCaptureMethod: Scalars['Int'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    AssetThumbnail?: Maybe<Asset>;
    VCaptureMethod?: Maybe<Vocabulary>;
    CaptureDataFile?: Maybe<Array<Maybe<CaptureDataFile>>>;
    CaptureDataGroup?: Maybe<Array<Maybe<CaptureDataGroup>>>;
    SystemObject?: Maybe<SystemObject>;
};

export type CaptureDataFile = {
    __typename?: 'CaptureDataFile';
    idCaptureDataFile: Scalars['Int'];
    CompressedMultipleFiles: Scalars['Boolean'];
    idAsset: Scalars['Int'];
    idCaptureData: Scalars['Int'];
    idVVariantType: Scalars['Int'];
    Asset?: Maybe<Asset>;
    CaptureData?: Maybe<CaptureData>;
    VVariantType?: Maybe<Vocabulary>;
};

export type CaptureDataGroup = {
    __typename?: 'CaptureDataGroup';
    idCaptureDataGroup: Scalars['Int'];
    CaptureData?: Maybe<Array<Maybe<CaptureData>>>;
};

export type CaptureDataPhoto = {
    __typename?: 'CaptureDataPhoto';
    idCaptureDataPhoto: Scalars['Int'];
    idCaptureData: Scalars['Int'];
    idVCaptureDatasetType: Scalars['Int'];
    CameraSettingsUniform?: Maybe<Scalars['Boolean']>;
    CaptureDatasetFieldID?: Maybe<Scalars['Int']>;
    ClusterGeometryFieldID?: Maybe<Scalars['Int']>;
    idVBackgroundRemovalMethod?: Maybe<Scalars['Int']>;
    idVClusterType?: Maybe<Scalars['Int']>;
    idVFocusType?: Maybe<Scalars['Int']>;
    idVItemPositionType?: Maybe<Scalars['Int']>;
    idVLightSourceType?: Maybe<Scalars['Int']>;
    ItemArrangementFieldID?: Maybe<Scalars['Int']>;
    ItemPositionFieldID?: Maybe<Scalars['Int']>;
    CaptureData?: Maybe<CaptureData>;
    VBackgroundRemovalMethod?: Maybe<Vocabulary>;
    VCaptureDatasetType?: Maybe<Vocabulary>;
    VClusterType?: Maybe<Vocabulary>;
    VFocusType?: Maybe<Vocabulary>;
    VItemPositionType?: Maybe<Vocabulary>;
    VLightSourceType?: Maybe<Vocabulary>;
};

export type License = {
    __typename?: 'License';
    idLicense: Scalars['Int'];
    Description: Scalars['String'];
    Name: Scalars['String'];
    LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
};

export type LicenseAssignment = {
    __typename?: 'LicenseAssignment';
    idLicenseAssignment: Scalars['Int'];
    idLicense: Scalars['Int'];
    DateEnd?: Maybe<Scalars['DateTime']>;
    DateStart?: Maybe<Scalars['DateTime']>;
    idSystemObject?: Maybe<Scalars['Int']>;
    idUserCreator?: Maybe<Scalars['Int']>;
    License?: Maybe<License>;
    SystemObject?: Maybe<SystemObject>;
    UserCreator?: Maybe<User>;
};

export type Model = {
    __typename?: 'Model';
    idModel: Scalars['Int'];
    Authoritative: Scalars['Boolean'];
    DateCreated: Scalars['DateTime'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    idVCreationMethod: Scalars['Int'];
    idVModality: Scalars['Int'];
    idVPurpose: Scalars['Int'];
    idVUnits: Scalars['Int'];
    Master: Scalars['Boolean'];
    AssetThumbnail?: Maybe<Asset>;
    VCreationMethod?: Maybe<Vocabulary>;
    VModality?: Maybe<Vocabulary>;
    VPurpose?: Maybe<Vocabulary>;
    VUnits?: Maybe<Vocabulary>;
    ModelGeometryFile?: Maybe<Array<Maybe<ModelGeometryFile>>>;
    ModelProcessingAction?: Maybe<Array<Maybe<ModelProcessingAction>>>;
    ModelSceneXref?: Maybe<Array<Maybe<ModelSceneXref>>>;
    SystemObject?: Maybe<SystemObject>;
};

export type ModelGeometryFile = {
    __typename?: 'ModelGeometryFile';
    idModelGeometryFile: Scalars['Int'];
    idAsset: Scalars['Int'];
    idModel: Scalars['Int'];
    idVModelFileType: Scalars['Int'];
    BoundingBoxP1X?: Maybe<Scalars['Float']>;
    BoundingBoxP1Y?: Maybe<Scalars['Float']>;
    BoundingBoxP1Z?: Maybe<Scalars['Float']>;
    BoundingBoxP2X?: Maybe<Scalars['Float']>;
    BoundingBoxP2Y?: Maybe<Scalars['Float']>;
    BoundingBoxP2Z?: Maybe<Scalars['Float']>;
    FaceCount?: Maybe<Scalars['Int']>;
    HasNormals?: Maybe<Scalars['Boolean']>;
    HasUVSpace?: Maybe<Scalars['Boolean']>;
    HasVertexColor?: Maybe<Scalars['Boolean']>;
    IsWatertight?: Maybe<Scalars['Boolean']>;
    Metalness?: Maybe<Scalars['Float']>;
    PointCount?: Maybe<Scalars['Int']>;
    Roughness?: Maybe<Scalars['Float']>;
    Asset?: Maybe<Asset>;
    Model?: Maybe<Model>;
    VModelFileType?: Maybe<Vocabulary>;
    ModelUVMapFile?: Maybe<Array<Maybe<ModelUvMapFile>>>;
};

export type ModelProcessingAction = {
    __typename?: 'ModelProcessingAction';
    idModelProcessingAction: Scalars['Int'];
    DateProcessed: Scalars['DateTime'];
    Description: Scalars['String'];
    idActor: Scalars['Int'];
    idModel: Scalars['Int'];
    ToolsUsed: Scalars['String'];
    Actor?: Maybe<Actor>;
    Model?: Maybe<Model>;
    ModelProcessingActionStep: Array<Maybe<ModelProcessingActionStep>>;
};

export type ModelProcessingActionStep = {
    __typename?: 'ModelProcessingActionStep';
    idModelProcessingActionStep: Scalars['Int'];
    Description: Scalars['String'];
    idModelProcessingAction: Scalars['Int'];
    idVActionMethod: Scalars['Int'];
    ModelProcessingAction?: Maybe<ModelProcessingAction>;
    VActionMethod?: Maybe<Vocabulary>;
};

export type ModelSceneXref = {
    __typename?: 'ModelSceneXref';
    idModelSceneXref: Scalars['Int'];
    idModel: Scalars['Int'];
    idScene: Scalars['Int'];
    R0?: Maybe<Scalars['Float']>;
    R1?: Maybe<Scalars['Float']>;
    R2?: Maybe<Scalars['Float']>;
    R3?: Maybe<Scalars['Float']>;
    TS0?: Maybe<Scalars['Float']>;
    TS1?: Maybe<Scalars['Float']>;
    TS2?: Maybe<Scalars['Float']>;
    Model?: Maybe<Model>;
    Scene?: Maybe<Scene>;
};

export type ModelUvMapChannel = {
    __typename?: 'ModelUVMapChannel';
    idModelUVMapChannel: Scalars['Int'];
    ChannelPosition: Scalars['Int'];
    ChannelWidth: Scalars['Int'];
    idModelUVMapFile: Scalars['Int'];
    idVUVMapType: Scalars['Int'];
    ModelUVMapFile?: Maybe<ModelUvMapFile>;
    VUVMapType?: Maybe<Vocabulary>;
};

export type ModelUvMapFile = {
    __typename?: 'ModelUVMapFile';
    idModelUVMapFile: Scalars['Int'];
    idAsset: Scalars['Int'];
    idModelGeometryFile: Scalars['Int'];
    UVMapEdgeLength: Scalars['Int'];
    Asset?: Maybe<Asset>;
    ModelGeometryFile?: Maybe<ModelGeometryFile>;
    ModelUVMapChannel?: Maybe<Array<Maybe<ModelUvMapChannel>>>;
};

export type PaginationInput = {
    first?: Maybe<Scalars['Int']>;
    skip?: Maybe<Scalars['Int']>;
    offset?: Maybe<Scalars['Int']>;
    size?: Maybe<Scalars['Int']>;
};

export type Scene = {
    __typename?: 'Scene';
    idScene: Scalars['Int'];
    HasBeenQCd: Scalars['Boolean'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    IsOriented: Scalars['Boolean'];
    Name: Scalars['String'];
    AssetThumbnail?: Maybe<Asset>;
    ModelSceneXref?: Maybe<Array<Maybe<ModelSceneXref>>>;
    SystemObject?: Maybe<SystemObject>;
};

export type Actor = {
    __typename?: 'Actor';
    idActor: Scalars['Int'];
    idUnit?: Maybe<Scalars['Int']>;
    IndividualName?: Maybe<Scalars['String']>;
    OrganizationName?: Maybe<Scalars['String']>;
    Unit?: Maybe<Unit>;
    SystemObject?: Maybe<SystemObject>;
};

export type IntermediaryFile = {
    __typename?: 'IntermediaryFile';
    idIntermediaryFile: Scalars['Int'];
    DateCreated: Scalars['DateTime'];
    idAsset: Scalars['Int'];
    Asset?: Maybe<Asset>;
    SystemObject?: Maybe<SystemObject>;
};

export type SystemObject = {
    __typename?: 'SystemObject';
    idSystemObject: Scalars['Int'];
    Retired: Scalars['Boolean'];
    idActor?: Maybe<Scalars['Int']>;
    idAsset?: Maybe<Scalars['Int']>;
    idAssetVersion?: Maybe<Scalars['Int']>;
    idCaptureData?: Maybe<Scalars['Int']>;
    idIntermediaryFile?: Maybe<Scalars['Int']>;
    idItem?: Maybe<Scalars['Int']>;
    idModel?: Maybe<Scalars['Int']>;
    idProject?: Maybe<Scalars['Int']>;
    idProjectDocumentation?: Maybe<Scalars['Int']>;
    idScene?: Maybe<Scalars['Int']>;
    idStakeholder?: Maybe<Scalars['Int']>;
    idSubject?: Maybe<Scalars['Int']>;
    idUnit?: Maybe<Scalars['Int']>;
    idWorkflow?: Maybe<Scalars['Int']>;
    idWorkflowStep?: Maybe<Scalars['Int']>;
    Actor?: Maybe<Actor>;
    Asset?: Maybe<Asset>;
    AssetVersion?: Maybe<AssetVersion>;
    CaptureData?: Maybe<CaptureData>;
    IntermediaryFile?: Maybe<IntermediaryFile>;
    Item?: Maybe<Item>;
    Model?: Maybe<Model>;
    Project?: Maybe<Project>;
    ProjectDocumentation?: Maybe<ProjectDocumentation>;
    Scene?: Maybe<Scene>;
    Stakeholder?: Maybe<Stakeholder>;
    Subject?: Maybe<Subject>;
    Unit?: Maybe<Unit>;
    Workflow?: Maybe<Workflow>;
    WorkflowStep?: Maybe<WorkflowStep>;
    AccessContextObject?: Maybe<Array<Maybe<AccessContextObject>>>;
    Identifier?: Maybe<Array<Maybe<Identifier>>>;
    LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
    Metadata?: Maybe<Array<Maybe<Metadata>>>;
    SystemObjectVersion?: Maybe<Array<Maybe<SystemObjectVersion>>>;
    SystemObjectDerived?: Maybe<Array<Maybe<SystemObject>>>;
    SystemObjectMaster?: Maybe<Array<Maybe<SystemObject>>>;
    UserPersonalizationSystemObject?: Maybe<Array<Maybe<UserPersonalizationSystemObject>>>;
    WorkflowStepXref?: Maybe<Array<Maybe<WorkflowStep>>>;
};

export type SystemObjectVersion = {
    __typename?: 'SystemObjectVersion';
    idSystemObjectVersion: Scalars['Int'];
    idSystemObject: Scalars['Int'];
    PublishedState: Scalars['Int'];
    SystemObject?: Maybe<SystemObject>;
};

export type Identifier = {
    __typename?: 'Identifier';
    idIdentifier: Scalars['Int'];
    IdentifierValue: Scalars['String'];
    idSystemObject?: Maybe<Scalars['Int']>;
    idVIdentifierType?: Maybe<Scalars['Int']>;
    SystemObject?: Maybe<SystemObject>;
    VIdentifierType?: Maybe<Vocabulary>;
};

export type Metadata = {
    __typename?: 'Metadata';
    idMetadata: Scalars['Int'];
    Name: Scalars['String'];
    idAssetValue?: Maybe<Scalars['Int']>;
    idSystemObject?: Maybe<Scalars['Int']>;
    idUser?: Maybe<Scalars['Int']>;
    idVMetadataSource?: Maybe<Scalars['Int']>;
    ValueExtended?: Maybe<Scalars['String']>;
    ValueShort?: Maybe<Scalars['String']>;
    AssetValue?: Maybe<Asset>;
    SystemObject?: Maybe<SystemObject>;
    User?: Maybe<User>;
    VMetadataSource?: Maybe<Vocabulary>;
};

export type Unit = {
    __typename?: 'Unit';
    idUnit: Scalars['Int'];
    Abbreviation?: Maybe<Scalars['String']>;
    ARKPrefix?: Maybe<Scalars['String']>;
    Name: Scalars['String'];
    Actor?: Maybe<Array<Maybe<Actor>>>;
    Subject?: Maybe<Array<Maybe<Subject>>>;
    SystemObject?: Maybe<SystemObject>;
};

export type Project = {
    __typename?: 'Project';
    idProject: Scalars['Int'];
    Name: Scalars['String'];
    Description?: Maybe<Scalars['String']>;
    ProjectDocumentation?: Maybe<Array<Maybe<ProjectDocumentation>>>;
    SystemObject?: Maybe<SystemObject>;
    Workflow?: Maybe<Array<Maybe<Workflow>>>;
};

export type ProjectDocumentation = {
    __typename?: 'ProjectDocumentation';
    idProjectDocumentation: Scalars['Int'];
    Description: Scalars['String'];
    idProject: Scalars['Int'];
    Name: Scalars['String'];
    Project?: Maybe<Project>;
    SystemObject?: Maybe<SystemObject>;
};

export type Stakeholder = {
    __typename?: 'Stakeholder';
    idStakeholder: Scalars['Int'];
    IndividualName: Scalars['String'];
    OrganizationName: Scalars['String'];
    MailingAddress?: Maybe<Scalars['String']>;
    EmailAddress?: Maybe<Scalars['String']>;
    PhoneNumberMobile?: Maybe<Scalars['String']>;
    PhoneNumberOffice?: Maybe<Scalars['String']>;
    SystemObject?: Maybe<SystemObject>;
};

export type GeoLocation = {
    __typename?: 'GeoLocation';
    idGeoLocation: Scalars['Int'];
    Altitude?: Maybe<Scalars['Float']>;
    Latitude?: Maybe<Scalars['Float']>;
    Longitude?: Maybe<Scalars['Float']>;
    R0?: Maybe<Scalars['Float']>;
    R1?: Maybe<Scalars['Float']>;
    R2?: Maybe<Scalars['Float']>;
    R3?: Maybe<Scalars['Float']>;
    TS0?: Maybe<Scalars['Float']>;
    TS1?: Maybe<Scalars['Float']>;
    TS2?: Maybe<Scalars['Float']>;
};

export type Subject = {
    __typename?: 'Subject';
    idSubject: Scalars['Int'];
    idUnit: Scalars['Int'];
    Name: Scalars['String'];
    AssetThumbnail?: Maybe<Asset>;
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    idGeoLocation?: Maybe<Scalars['Int']>;
    idIdentifierPreferred?: Maybe<Scalars['Int']>;
    GeoLocation?: Maybe<GeoLocation>;
    Unit?: Maybe<Unit>;
    IdentifierPreferred?: Maybe<Identifier>;
    Item?: Maybe<Array<Maybe<Item>>>;
    SystemObject?: Maybe<SystemObject>;
};

export type Item = {
    __typename?: 'Item';
    idItem: Scalars['Int'];
    EntireSubject: Scalars['Boolean'];
    Name: Scalars['String'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    idGeoLocation?: Maybe<Scalars['Int']>;
    AssetThumbnail?: Maybe<Asset>;
    GeoLocation?: Maybe<GeoLocation>;
    Subject?: Maybe<Subject>;
    SystemObject?: Maybe<SystemObject>;
};

export type User = {
    __typename?: 'User';
    idUser: Scalars['Int'];
    Active: Scalars['Boolean'];
    DateActivated: Scalars['DateTime'];
    EmailAddress: Scalars['String'];
    Name: Scalars['String'];
    SecurityID: Scalars['String'];
    DateDisabled?: Maybe<Scalars['DateTime']>;
    EmailSettings?: Maybe<Scalars['Int']>;
    WorkflowNotificationTime?: Maybe<Scalars['DateTime']>;
    AccessPolicy?: Maybe<Array<Maybe<AccessPolicy>>>;
    AssetVersion?: Maybe<Array<Maybe<AssetVersion>>>;
    LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
    Metadata?: Maybe<Array<Maybe<Metadata>>>;
    UserPersonalizationSystemObject?: Maybe<Array<Maybe<UserPersonalizationSystemObject>>>;
    UserPersonalizationUrl?: Maybe<Array<Maybe<UserPersonalizationUrl>>>;
    Workflow?: Maybe<Array<Maybe<Workflow>>>;
    WorkflowStep?: Maybe<Array<Maybe<WorkflowStep>>>;
};

export type UserPersonalizationSystemObject = {
    __typename?: 'UserPersonalizationSystemObject';
    idUserPersonalizationSystemObject: Scalars['Int'];
    idSystemObject: Scalars['Int'];
    idUser: Scalars['Int'];
    Personalization?: Maybe<Scalars['String']>;
    SystemObject?: Maybe<SystemObject>;
    User?: Maybe<User>;
};

export type UserPersonalizationUrl = {
    __typename?: 'UserPersonalizationUrl';
    idUserPersonalizationUrl: Scalars['Int'];
    idUser: Scalars['Int'];
    Personalization: Scalars['String'];
    URL: Scalars['String'];
    User?: Maybe<User>;
};

export type Vocabulary = {
    __typename?: 'Vocabulary';
    idVocabulary: Scalars['Int'];
    idVocabularySet: Scalars['Int'];
    SortOrder: Scalars['Int'];
    Term: Scalars['String'];
    VocabularySet?: Maybe<VocabularySet>;
};

export type VocabularySet = {
    __typename?: 'VocabularySet';
    idVocabularySet: Scalars['Int'];
    Name: Scalars['String'];
    SystemMaintained: Scalars['Boolean'];
    Vocabulary?: Maybe<Array<Maybe<Vocabulary>>>;
};

export type Workflow = {
    __typename?: 'Workflow';
    idWorkflow: Scalars['Int'];
    DateInitiated: Scalars['DateTime'];
    DateUpdated: Scalars['DateTime'];
    idWorkflowTemplate: Scalars['Int'];
    idProject?: Maybe<Scalars['Int']>;
    idUserInitiator?: Maybe<Scalars['Int']>;
    Project?: Maybe<Project>;
    UserInitiator?: Maybe<User>;
    WorkflowTemplate?: Maybe<WorkflowTemplate>;
    WorkflowStep?: Maybe<Array<Maybe<WorkflowStep>>>;
};

export type WorkflowStep = {
    __typename?: 'WorkflowStep';
    idWorkflowStep: Scalars['Int'];
    DateCreated: Scalars['DateTime'];
    idUserOwner: Scalars['Int'];
    idVWorkflowStepType: Scalars['Int'];
    idWorkflow: Scalars['Int'];
    State: Scalars['Int'];
    DateCompleted?: Maybe<Scalars['DateTime']>;
    User?: Maybe<User>;
    VWorkflowStepType?: Maybe<Vocabulary>;
    Workflow?: Maybe<Workflow>;
    WorkflowStepSystemObjectXref?: Maybe<Array<Maybe<WorkflowStepSystemObjectXref>>>;
};

export type WorkflowStepSystemObjectXref = {
    __typename?: 'WorkflowStepSystemObjectXref';
    idWorkflowStepSystemObjectXref: Scalars['Int'];
    idSystemObject: Scalars['Int'];
    idWorkflowStep: Scalars['Int'];
    Input: Scalars['Boolean'];
    SystemObject?: Maybe<SystemObject>;
    WorkflowStep?: Maybe<WorkflowStep>;
};

export type WorkflowTemplate = {
    __typename?: 'WorkflowTemplate';
    idWorkflowTemplate: Scalars['Int'];
    Name: Scalars['String'];
    Workflow?: Maybe<Array<Maybe<Workflow>>>;
};

export type Query = {
    __typename?: 'Query';
    getAccessPolicy: GetAccessPolicyResult;
    getAsset: GetAssetResult;
    getUploadedAssetVersion: GetUploadedAssetVersionResult;
    getContentsForAssetVersions: GetContentsForAssetVersionsResult;
    getAssetVersionsDetails: GetAssetVersionsDetailsResult;
    getCaptureData: GetCaptureDataResult;
    getCaptureDataPhoto: GetCaptureDataPhotoResult;
    areCameraSettingsUniform: AreCameraSettingsUniformResult;
    getLicense: GetLicenseResult;
    getModel: GetModelResult;
    getScene: GetSceneResult;
    getSubjectsForUnit: GetSubjectsForUnitResult;
    getItemsForSubject: GetItemsForSubjectResult;
    getObjectsForItem: GetObjectsForItemResult;
    searchIngestionSubjects: SearchIngestionSubjectsResult;
    getIngestionItemsForSubjects: GetIngestionItemsForSubjectsResult;
    getIngestionProjectsForSubjects: GetIngestionProjectsForSubjectsResult;
    getUnit: GetUnitResult;
    getProject: GetProjectResult;
    getSubject: GetSubjectResult;
    getItem: GetItemResult;
    getCurrentUser: GetCurrentUserResult;
    getUser: GetUserResult;
    getVocabulary: GetVocabularyResult;
    getVocabularyEntries: GetVocabularyEntriesResult;
    getWorkflow: GetWorkflowResult;
};


export type QueryGetAccessPolicyArgs = {
    input: GetAccessPolicyInput;
};


export type QueryGetAssetArgs = {
    input: GetAssetInput;
};


export type QueryGetContentsForAssetVersionsArgs = {
    input: GetContentsForAssetVersionsInput;
};


export type QueryGetAssetVersionsDetailsArgs = {
    input: GetAssetVersionsDetailsInput;
};


export type QueryGetCaptureDataArgs = {
    input: GetCaptureDataInput;
};


export type QueryGetCaptureDataPhotoArgs = {
    input: GetCaptureDataPhotoInput;
};


export type QueryAreCameraSettingsUniformArgs = {
    input: AreCameraSettingsUniformInput;
};


export type QueryGetLicenseArgs = {
    input: GetLicenseInput;
};


export type QueryGetModelArgs = {
    input: GetModelInput;
};


export type QueryGetSceneArgs = {
    input: GetSceneInput;
};


export type QueryGetSubjectsForUnitArgs = {
    input: GetSubjectsForUnitInput;
};


export type QueryGetItemsForSubjectArgs = {
    input: GetItemsForSubjectInput;
};


export type QueryGetObjectsForItemArgs = {
    input: GetObjectsForItemInput;
};


export type QuerySearchIngestionSubjectsArgs = {
    input: SearchIngestionSubjectsInput;
};


export type QueryGetIngestionItemsForSubjectsArgs = {
    input: GetIngestionItemsForSubjectsInput;
};


export type QueryGetIngestionProjectsForSubjectsArgs = {
    input: GetIngestionProjectsForSubjectsInput;
};


export type QueryGetUnitArgs = {
    input: GetUnitInput;
};


export type QueryGetProjectArgs = {
    input: GetProjectInput;
};


export type QueryGetSubjectArgs = {
    input: GetSubjectInput;
};


export type QueryGetItemArgs = {
    input: GetItemInput;
};


export type QueryGetUserArgs = {
    input: GetUserInput;
};


export type QueryGetVocabularyArgs = {
    input: GetVocabularyInput;
};


export type QueryGetVocabularyEntriesArgs = {
    input: GetVocabularyEntriesInput;
};


export type QueryGetWorkflowArgs = {
    input: GetWorkflowInput;
};

export type GetAccessPolicyInput = {
    idAccessPolicy: Scalars['Int'];
};

export type GetAccessPolicyResult = {
    __typename?: 'GetAccessPolicyResult';
    AccessPolicy?: Maybe<AccessPolicy>;
};

export type GetAssetVersionsDetailsInput = {
    idAssetVersions: Array<Scalars['Int']>;
};

export type GetAssetVersionsDetailsResult = {
    __typename?: 'GetAssetVersionsDetailsResult';
    valid: Scalars['Boolean'];
    SubjectUnitIdentifier: Array<SubjectUnitIdentifier>;
    Project: Array<Project>;
    Item: Array<Item>;
};

export type GetAssetInput = {
    idAsset: Scalars['Int'];
};

export type GetAssetResult = {
    __typename?: 'GetAssetResult';
    Asset?: Maybe<Asset>;
};

export type GetUploadedAssetVersionResult = {
    __typename?: 'GetUploadedAssetVersionResult';
    AssetVersion: Array<Maybe<AssetVersion>>;
};

export type GetContentsForAssetVersionsInput = {
    idAssetVersions: Array<Scalars['Int']>;
};

export type AssetVersionContent = {
    __typename?: 'AssetVersionContent';
    idAssetVersion: Scalars['Int'];
    folders: Array<Scalars['String']>;
    all: Array<Scalars['String']>;
};

export type GetContentsForAssetVersionsResult = {
    __typename?: 'GetContentsForAssetVersionsResult';
    AssetVersionContent: Array<AssetVersionContent>;
};

export type GetCaptureDataInput = {
    idCaptureData: Scalars['Int'];
};

export type GetCaptureDataResult = {
    __typename?: 'GetCaptureDataResult';
    CaptureData?: Maybe<CaptureData>;
};

export type GetCaptureDataPhotoInput = {
    idCaptureDataPhoto: Scalars['Int'];
};

export type GetCaptureDataPhotoResult = {
    __typename?: 'GetCaptureDataPhotoResult';
    CaptureDataPhoto?: Maybe<CaptureDataPhoto>;
};

export type AreCameraSettingsUniformInput = {
    idAssetVersion: Scalars['Int'];
};

export type AreCameraSettingsUniformResult = {
    __typename?: 'AreCameraSettingsUniformResult';
    isUniform: Scalars['Boolean'];
};

export type GetLicenseInput = {
    idLicense: Scalars['Int'];
};

export type GetLicenseResult = {
    __typename?: 'GetLicenseResult';
    License?: Maybe<License>;
};

export type GetModelInput = {
    idModel: Scalars['Int'];
};

export type GetModelResult = {
    __typename?: 'GetModelResult';
    Model?: Maybe<Model>;
};

export type GetSceneInput = {
    idScene: Scalars['Int'];
};

export type GetSceneResult = {
    __typename?: 'GetSceneResult';
    Scene?: Maybe<Scene>;
};

export type GetSubjectsForUnitInput = {
    idUnit: Scalars['Int'];
    pagination?: Maybe<PaginationInput>;
};

export type GetSubjectsForUnitResult = {
    __typename?: 'GetSubjectsForUnitResult';
    Subject: Array<Subject>;
};

export type GetItemsForSubjectInput = {
    idSubject: Scalars['Int'];
    pagination?: Maybe<PaginationInput>;
};

export type GetItemsForSubjectResult = {
    __typename?: 'GetItemsForSubjectResult';
    Item: Array<Item>;
};

export type SubjectUnitIdentifier = {
    __typename?: 'SubjectUnitIdentifier';
    idSubject: Scalars['Int'];
    SubjectName: Scalars['String'];
    UnitAbbreviation: Scalars['String'];
    IdentifierPublic?: Maybe<Scalars['String']>;
    IdentifierCollection?: Maybe<Scalars['String']>;
};

export type GetObjectsForItemInput = {
    idItem: Scalars['Int'];
};

export type GetObjectsForItemResult = {
    __typename?: 'GetObjectsForItemResult';
    CaptureData: Array<CaptureData>;
    Model: Array<Model>;
    Scene: Array<Scene>;
    IntermediaryFile: Array<IntermediaryFile>;
    ProjectDocumentation: Array<ProjectDocumentation>;
};

export type SearchIngestionSubjectsInput = {
    query: Scalars['String'];
};

export type SearchIngestionSubjectsResult = {
    __typename?: 'SearchIngestionSubjectsResult';
    SubjectUnitIdentifier: Array<SubjectUnitIdentifier>;
};

export type GetIngestionItemsForSubjectsInput = {
    idSubjects: Array<Scalars['Int']>;
};

export type GetIngestionItemsForSubjectsResult = {
    __typename?: 'GetIngestionItemsForSubjectsResult';
    Item: Array<Item>;
};

export type GetIngestionProjectsForSubjectsInput = {
    idSubjects: Array<Scalars['Int']>;
};

export type GetIngestionProjectsForSubjectsResult = {
    __typename?: 'GetIngestionProjectsForSubjectsResult';
    Project: Array<Project>;
};

export type GetUnitInput = {
    idUnit: Scalars['Int'];
};

export type GetUnitResult = {
    __typename?: 'GetUnitResult';
    Unit?: Maybe<Unit>;
};

export type GetProjectInput = {
    idProject: Scalars['Int'];
};

export type GetProjectResult = {
    __typename?: 'GetProjectResult';
    Project?: Maybe<Project>;
};

export type GetSubjectInput = {
    idSubject: Scalars['Int'];
};

export type GetSubjectResult = {
    __typename?: 'GetSubjectResult';
    Subject?: Maybe<Subject>;
};

export type GetItemInput = {
    idItem: Scalars['Int'];
};

export type GetItemResult = {
    __typename?: 'GetItemResult';
    Item?: Maybe<Item>;
};

export type GetCurrentUserResult = {
    __typename?: 'GetCurrentUserResult';
    User?: Maybe<User>;
};

export type GetUserInput = {
    idUser: Scalars['Int'];
};

export type GetUserResult = {
    __typename?: 'GetUserResult';
    User?: Maybe<User>;
};

export type GetVocabularyInput = {
    idVocabulary: Scalars['Int'];
};

export type GetVocabularyResult = {
    __typename?: 'GetVocabularyResult';
    Vocabulary?: Maybe<Vocabulary>;
};

export type GetVocabularyEntriesInput = {
    eVocabSetIDs: Array<Scalars['Int']>;
};

export type VocabularyEntry = {
    __typename?: 'VocabularyEntry';
    eVocabSetID: Scalars['Int'];
    Vocabulary: Array<Vocabulary>;
};

export type GetVocabularyEntriesResult = {
    __typename?: 'GetVocabularyEntriesResult';
    VocabularyEntries: Array<VocabularyEntry>;
};

export type GetWorkflowInput = {
    idWorkflow: Scalars['Int'];
};

export type GetWorkflowResult = {
    __typename?: 'GetWorkflowResult';
    Workflow?: Maybe<Workflow>;
};


export type Mutation = {
    __typename?: 'Mutation';
    uploadAsset: UploadAssetResult;
    createCaptureData: CreateCaptureDataResult;
    createCaptureDataPhoto: CreateCaptureDataPhotoResult;
    ingestData: IngestDataResult;
    createModel: CreateModelResult;
    createScene: CreateSceneResult;
    createUnit: CreateUnitResult;
    createProject: CreateProjectResult;
    createSubject: CreateSubjectResult;
    createItem: CreateItemResult;
    createUser: CreateUserResult;
    createVocabulary: CreateVocabularyResult;
    createVocabularySet: CreateVocabularySetResult;
};


export type MutationUploadAssetArgs = {
    file: Scalars['Upload'];
    type: Scalars['Int'];
};


export type MutationCreateCaptureDataArgs = {
    input: CreateCaptureDataInput;
};


export type MutationCreateCaptureDataPhotoArgs = {
    input: CreateCaptureDataPhotoInput;
};


export type MutationIngestDataArgs = {
    input: IngestDataInput;
};


export type MutationCreateModelArgs = {
    input: CreateModelInput;
};


export type MutationCreateSceneArgs = {
    input: CreateSceneInput;
};


export type MutationCreateUnitArgs = {
    input: CreateUnitInput;
};


export type MutationCreateProjectArgs = {
    input: CreateProjectInput;
};


export type MutationCreateSubjectArgs = {
    input: CreateSubjectInput;
};


export type MutationCreateItemArgs = {
    input: CreateItemInput;
};


export type MutationCreateUserArgs = {
    input: CreateUserInput;
};


export type MutationCreateVocabularyArgs = {
    input: CreateVocabularyInput;
};


export type MutationCreateVocabularySetArgs = {
    input: CreateVocabularySetInput;
};

export type UploadAssetInput = {
    __typename?: 'UploadAssetInput';
    file: Scalars['Upload'];
    type: Scalars['Int'];
};

export enum UploadStatus {
    Complete = 'COMPLETE',
    Failed = 'FAILED'
}

export type UploadAssetResult = {
    __typename?: 'UploadAssetResult';
    status: UploadStatus;
};

export type CreateCaptureDataInput = {
    idVCaptureMethod: Scalars['Int'];
    DateCaptured: Scalars['DateTime'];
    Description: Scalars['String'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
};

export type CreateCaptureDataResult = {
    __typename?: 'CreateCaptureDataResult';
    CaptureData?: Maybe<CaptureData>;
};

export type CreateCaptureDataPhotoInput = {
    idCaptureData: Scalars['Int'];
    idVCaptureDatasetType: Scalars['Int'];
    CaptureDatasetFieldID: Scalars['Int'];
    ItemPositionFieldID: Scalars['Int'];
    ItemArrangementFieldID: Scalars['Int'];
    idVBackgroundRemovalMethod: Scalars['Int'];
    ClusterGeometryFieldID: Scalars['Int'];
    CameraSettingsUniform: Scalars['Boolean'];
    idVItemPositionType?: Maybe<Scalars['Int']>;
    idVFocusType?: Maybe<Scalars['Int']>;
    idVLightSourceType?: Maybe<Scalars['Int']>;
    idVClusterType?: Maybe<Scalars['Int']>;
};

export type CreateCaptureDataPhotoResult = {
    __typename?: 'CreateCaptureDataPhotoResult';
    CaptureDataPhoto?: Maybe<CaptureDataPhoto>;
};

export type IngestSubject = {
    id: Scalars['Int'];
    name: Scalars['String'];
    arkId: Scalars['String'];
    unit: Scalars['String'];
};

export type IngestProject = {
    id: Scalars['Int'];
    name: Scalars['String'];
};

export type IngestItem = {
    id?: Maybe<Scalars['Int']>;
    name: Scalars['String'];
    entireSubject: Scalars['Boolean'];
};

export type IngestIdentifier = {
    id?: Maybe<Scalars['Int']>;
    identifier: Scalars['String'];
    identifierType: Scalars['Int'];
};

export type IngestFolder = {
    name: Scalars['String'];
    variantType: Scalars['Int'];
};

export type PhotogrammetryIngest = {
    idAssetVersion: Scalars['Int'];
    dateCaptured: Scalars['String'];
    datasetType: Scalars['Int'];
    systemCreated: Scalars['Boolean'];
    description: Scalars['String'];
    cameraSettingUniform: Scalars['Boolean'];
    identifiers: Array<IngestIdentifier>;
    folders: Array<IngestFolder>;
    datasetFieldId?: Maybe<Scalars['Int']>;
    itemPositionType?: Maybe<Scalars['Int']>;
    itemPositionFieldId?: Maybe<Scalars['Int']>;
    itemArrangementFieldId?: Maybe<Scalars['Int']>;
    focusType?: Maybe<Scalars['Int']>;
    lightsourceType?: Maybe<Scalars['Int']>;
    backgroundRemovalMethod?: Maybe<Scalars['Int']>;
    clusterType?: Maybe<Scalars['Int']>;
    clusterGeometryFieldId?: Maybe<Scalars['Int']>;
};

export type IngestDataInput = {
    subjects: Array<IngestSubject>;
    project: IngestProject;
    item: IngestItem;
    photogrammetry: Array<PhotogrammetryIngest>;
};

export type IngestDataResult = {
    __typename?: 'IngestDataResult';
    success: Scalars['Boolean'];
};

export type CreateModelInput = {
    Authoritative: Scalars['Boolean'];
    idVCreationMethod: Scalars['Int'];
    idVModality: Scalars['Int'];
    idVPurpose: Scalars['Int'];
    idVUnits: Scalars['Int'];
    Master: Scalars['Boolean'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
};

export type CreateModelResult = {
    __typename?: 'CreateModelResult';
    Model?: Maybe<Model>;
};

export type CreateSceneInput = {
    Name: Scalars['String'];
    HasBeenQCd: Scalars['Boolean'];
    IsOriented: Scalars['Boolean'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
};

export type CreateSceneResult = {
    __typename?: 'CreateSceneResult';
    Scene?: Maybe<Scene>;
};

export type CreateUnitInput = {
    Name: Scalars['String'];
    Abbreviation: Scalars['String'];
    ARKPrefix: Scalars['String'];
};

export type CreateUnitResult = {
    __typename?: 'CreateUnitResult';
    Unit?: Maybe<Unit>;
};

export type CreateProjectInput = {
    Name: Scalars['String'];
    Description: Scalars['String'];
};

export type CreateProjectResult = {
    __typename?: 'CreateProjectResult';
    Project?: Maybe<Project>;
};

export type CreateSubjectInput = {
    idUnit: Scalars['Int'];
    Name: Scalars['String'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    idGeoLocation?: Maybe<Scalars['Int']>;
    idIdentifierPreferred?: Maybe<Scalars['Int']>;
};

export type CreateSubjectResult = {
    __typename?: 'CreateSubjectResult';
    Subject?: Maybe<Subject>;
};

export type CreateItemInput = {
    Name: Scalars['String'];
    EntireSubject: Scalars['Boolean'];
    idAssetThumbnail?: Maybe<Scalars['Int']>;
    idGeoLocation?: Maybe<Scalars['Int']>;
};

export type CreateItemResult = {
    __typename?: 'CreateItemResult';
    Item?: Maybe<Item>;
};

export type CreateUserInput = {
    Name: Scalars['String'];
    EmailAddress: Scalars['String'];
    SecurityID: Scalars['String'];
};

export type CreateUserResult = {
    __typename?: 'CreateUserResult';
    User?: Maybe<User>;
};

export type CreateVocabularyInput = {
    idVocabularySet: Scalars['Int'];
    SortOrder: Scalars['Int'];
    Term: Scalars['String'];
};

export type CreateVocabularyResult = {
    __typename?: 'CreateVocabularyResult';
    Vocabulary?: Maybe<Vocabulary>;
};

export type CreateVocabularySetInput = {
    Name: Scalars['String'];
    SystemMaintained: Scalars['Boolean'];
};

export type CreateVocabularySetResult = {
    __typename?: 'CreateVocabularySetResult';
    VocabularySet?: Maybe<VocabularySet>;
};

export type UploadAssetMutationVariables = Exact<{
    file: Scalars['Upload'];
    type: Scalars['Int'];
}>;


export type UploadAssetMutation = (
    { __typename?: 'Mutation' }
    & {
        uploadAsset: (
            { __typename?: 'UploadAssetResult' }
            & Pick<UploadAssetResult, 'status'>
        )
    }
);

export type CreateCaptureDataMutationVariables = Exact<{
    input: CreateCaptureDataInput;
}>;


export type CreateCaptureDataMutation = (
    { __typename?: 'Mutation' }
    & {
        createCaptureData: (
            { __typename?: 'CreateCaptureDataResult' }
            & {
                CaptureData?: Maybe<(
                    { __typename?: 'CaptureData' }
                    & Pick<CaptureData, 'idCaptureData'>
                )>
            }
        )
    }
);

export type CreateCaptureDataPhotoMutationVariables = Exact<{
    input: CreateCaptureDataPhotoInput;
}>;


export type CreateCaptureDataPhotoMutation = (
    { __typename?: 'Mutation' }
    & {
        createCaptureDataPhoto: (
            { __typename?: 'CreateCaptureDataPhotoResult' }
            & {
                CaptureDataPhoto?: Maybe<(
                    { __typename?: 'CaptureDataPhoto' }
                    & Pick<CaptureDataPhoto, 'idCaptureDataPhoto'>
                )>
            }
        )
    }
);

export type IngestDataMutationVariables = Exact<{
    input: IngestDataInput;
}>;


export type IngestDataMutation = (
    { __typename?: 'Mutation' }
    & {
        ingestData: (
            { __typename?: 'IngestDataResult' }
            & Pick<IngestDataResult, 'success'>
        )
    }
);

export type CreateModelMutationVariables = Exact<{
    input: CreateModelInput;
}>;


export type CreateModelMutation = (
    { __typename?: 'Mutation' }
    & {
        createModel: (
            { __typename?: 'CreateModelResult' }
            & {
                Model?: Maybe<(
                    { __typename?: 'Model' }
                    & Pick<Model, 'idModel'>
                )>
            }
        )
    }
);

export type CreateSceneMutationVariables = Exact<{
    input: CreateSceneInput;
}>;


export type CreateSceneMutation = (
    { __typename?: 'Mutation' }
    & {
        createScene: (
            { __typename?: 'CreateSceneResult' }
            & {
                Scene?: Maybe<(
                    { __typename?: 'Scene' }
                    & Pick<Scene, 'idScene'>
                )>
            }
        )
    }
);

export type CreateItemMutationVariables = Exact<{
    input: CreateItemInput;
}>;


export type CreateItemMutation = (
    { __typename?: 'Mutation' }
    & {
        createItem: (
            { __typename?: 'CreateItemResult' }
            & {
                Item?: Maybe<(
                    { __typename?: 'Item' }
                    & Pick<Item, 'idItem'>
                )>
            }
        )
    }
);

export type CreateProjectMutationVariables = Exact<{
    input: CreateProjectInput;
}>;


export type CreateProjectMutation = (
    { __typename?: 'Mutation' }
    & {
        createProject: (
            { __typename?: 'CreateProjectResult' }
            & {
                Project?: Maybe<(
                    { __typename?: 'Project' }
                    & Pick<Project, 'idProject'>
                )>
            }
        )
    }
);

export type CreateSubjectMutationVariables = Exact<{
    input: CreateSubjectInput;
}>;


export type CreateSubjectMutation = (
    { __typename?: 'Mutation' }
    & {
        createSubject: (
            { __typename?: 'CreateSubjectResult' }
            & {
                Subject?: Maybe<(
                    { __typename?: 'Subject' }
                    & Pick<Subject, 'idSubject'>
                )>
            }
        )
    }
);

export type CreateUnitMutationVariables = Exact<{
    input: CreateUnitInput;
}>;


export type CreateUnitMutation = (
    { __typename?: 'Mutation' }
    & {
        createUnit: (
            { __typename?: 'CreateUnitResult' }
            & {
                Unit?: Maybe<(
                    { __typename?: 'Unit' }
                    & Pick<Unit, 'idUnit'>
                )>
            }
        )
    }
);

export type CreateUserMutationVariables = Exact<{
    input: CreateUserInput;
}>;


export type CreateUserMutation = (
    { __typename?: 'Mutation' }
    & {
        createUser: (
            { __typename?: 'CreateUserResult' }
            & {
                User?: Maybe<(
                    { __typename?: 'User' }
                    & Pick<User, 'idUser' | 'Name' | 'Active' | 'DateActivated'>
                )>
            }
        )
    }
);

export type CreateVocabularyMutationVariables = Exact<{
    input: CreateVocabularyInput;
}>;


export type CreateVocabularyMutation = (
    { __typename?: 'Mutation' }
    & {
        createVocabulary: (
            { __typename?: 'CreateVocabularyResult' }
            & {
                Vocabulary?: Maybe<(
                    { __typename?: 'Vocabulary' }
                    & Pick<Vocabulary, 'idVocabulary'>
                )>
            }
        )
    }
);

export type CreateVocabularySetMutationVariables = Exact<{
    input: CreateVocabularySetInput;
}>;


export type CreateVocabularySetMutation = (
    { __typename?: 'Mutation' }
    & {
        createVocabularySet: (
            { __typename?: 'CreateVocabularySetResult' }
            & {
                VocabularySet?: Maybe<(
                    { __typename?: 'VocabularySet' }
                    & Pick<VocabularySet, 'idVocabularySet'>
                )>
            }
        )
    }
);

export type GetAccessPolicyQueryVariables = Exact<{
    input: GetAccessPolicyInput;
}>;


export type GetAccessPolicyQuery = (
    { __typename?: 'Query' }
    & {
        getAccessPolicy: (
            { __typename?: 'GetAccessPolicyResult' }
            & {
                AccessPolicy?: Maybe<(
                    { __typename?: 'AccessPolicy' }
                    & Pick<AccessPolicy, 'idAccessPolicy'>
                )>
            }
        )
    }
);

export type GetAssetQueryVariables = Exact<{
    input: GetAssetInput;
}>;


export type GetAssetQuery = (
    { __typename?: 'Query' }
    & {
        getAsset: (
            { __typename?: 'GetAssetResult' }
            & {
                Asset?: Maybe<(
                    { __typename?: 'Asset' }
                    & Pick<Asset, 'idAsset'>
                )>
            }
        )
    }
);

export type GetAssetVersionsDetailsQueryVariables = Exact<{
    input: GetAssetVersionsDetailsInput;
}>;


export type GetAssetVersionsDetailsQuery = (
    { __typename?: 'Query' }
    & {
        getAssetVersionsDetails: (
            { __typename?: 'GetAssetVersionsDetailsResult' }
            & Pick<GetAssetVersionsDetailsResult, 'valid'>
            & {
                SubjectUnitIdentifier: Array<(
                    { __typename?: 'SubjectUnitIdentifier' }
                    & Pick<SubjectUnitIdentifier, 'idSubject' | 'SubjectName' | 'UnitAbbreviation' | 'IdentifierPublic' | 'IdentifierCollection'>
                )>, Project: Array<(
                    { __typename?: 'Project' }
                    & Pick<Project, 'idProject' | 'Name'>
                )>, Item: Array<(
                    { __typename?: 'Item' }
                    & Pick<Item, 'idItem' | 'Name' | 'EntireSubject'>
                )>
            }
        )
    }
);

export type GetContentsForAssetVersionsQueryVariables = Exact<{
    input: GetContentsForAssetVersionsInput;
}>;


export type GetContentsForAssetVersionsQuery = (
    { __typename?: 'Query' }
    & {
        getContentsForAssetVersions: (
            { __typename?: 'GetContentsForAssetVersionsResult' }
            & {
                AssetVersionContent: Array<(
                    { __typename?: 'AssetVersionContent' }
                    & Pick<AssetVersionContent, 'idAssetVersion' | 'folders' | 'all'>
                )>
            }
        )
    }
);

export type GetUploadedAssetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUploadedAssetVersionQuery = (
    { __typename?: 'Query' }
    & {
        getUploadedAssetVersion: (
            { __typename?: 'GetUploadedAssetVersionResult' }
            & {
                AssetVersion: Array<Maybe<(
                    { __typename?: 'AssetVersion' }
                    & Pick<AssetVersion, 'idAssetVersion' | 'StorageSize'>
                    & {
                        Asset?: Maybe<(
                            { __typename?: 'Asset' }
                            & Pick<Asset, 'idAsset' | 'FileName'>
                            & {
                                VAssetType?: Maybe<(
                                    { __typename?: 'Vocabulary' }
                                    & Pick<Vocabulary, 'idVocabulary' | 'Term'>
                                )>
                            }
                        )>
                    }
                )>>
            }
        )
    }
);

export type GetCaptureDataQueryVariables = Exact<{
    input: GetCaptureDataInput;
}>;


export type GetCaptureDataQuery = (
    { __typename?: 'Query' }
    & {
        getCaptureData: (
            { __typename?: 'GetCaptureDataResult' }
            & {
                CaptureData?: Maybe<(
                    { __typename?: 'CaptureData' }
                    & Pick<CaptureData, 'idCaptureData'>
                )>
            }
        )
    }
);

export type GetCaptureDataPhotoQueryVariables = Exact<{
    input: GetCaptureDataPhotoInput;
}>;


export type GetCaptureDataPhotoQuery = (
    { __typename?: 'Query' }
    & {
        getCaptureDataPhoto: (
            { __typename?: 'GetCaptureDataPhotoResult' }
            & {
                CaptureDataPhoto?: Maybe<(
                    { __typename?: 'CaptureDataPhoto' }
                    & Pick<CaptureDataPhoto, 'idCaptureDataPhoto'>
                )>
            }
        )
    }
);

export type AreCameraSettingsUniformQueryVariables = Exact<{
    input: AreCameraSettingsUniformInput;
}>;


export type AreCameraSettingsUniformQuery = (
    { __typename?: 'Query' }
    & {
        areCameraSettingsUniform: (
            { __typename?: 'AreCameraSettingsUniformResult' }
            & Pick<AreCameraSettingsUniformResult, 'isUniform'>
        )
    }
);

export type GetLicenseQueryVariables = Exact<{
    input: GetLicenseInput;
}>;


export type GetLicenseQuery = (
    { __typename?: 'Query' }
    & {
        getLicense: (
            { __typename?: 'GetLicenseResult' }
            & {
                License?: Maybe<(
                    { __typename?: 'License' }
                    & Pick<License, 'idLicense'>
                )>
            }
        )
    }
);

export type GetModelQueryVariables = Exact<{
    input: GetModelInput;
}>;


export type GetModelQuery = (
    { __typename?: 'Query' }
    & {
        getModel: (
            { __typename?: 'GetModelResult' }
            & {
                Model?: Maybe<(
                    { __typename?: 'Model' }
                    & Pick<Model, 'idModel'>
                )>
            }
        )
    }
);

export type GetSceneQueryVariables = Exact<{
    input: GetSceneInput;
}>;


export type GetSceneQuery = (
    { __typename?: 'Query' }
    & {
        getScene: (
            { __typename?: 'GetSceneResult' }
            & {
                Scene?: Maybe<(
                    { __typename?: 'Scene' }
                    & Pick<Scene, 'idScene'>
                )>
            }
        )
    }
);

export type GetIngestionItemsForSubjectsQueryVariables = Exact<{
    input: GetIngestionItemsForSubjectsInput;
}>;


export type GetIngestionItemsForSubjectsQuery = (
    { __typename?: 'Query' }
    & {
        getIngestionItemsForSubjects: (
            { __typename?: 'GetIngestionItemsForSubjectsResult' }
            & {
                Item: Array<(
                    { __typename?: 'Item' }
                    & Pick<Item, 'idItem' | 'EntireSubject' | 'Name'>
                )>
            }
        )
    }
);

export type GetIngestionProjectsForSubjectsQueryVariables = Exact<{
    input: GetIngestionProjectsForSubjectsInput;
}>;


export type GetIngestionProjectsForSubjectsQuery = (
    { __typename?: 'Query' }
    & {
        getIngestionProjectsForSubjects: (
            { __typename?: 'GetIngestionProjectsForSubjectsResult' }
            & {
                Project: Array<(
                    { __typename?: 'Project' }
                    & Pick<Project, 'idProject' | 'Name'>
                )>
            }
        )
    }
);

export type GetItemQueryVariables = Exact<{
    input: GetItemInput;
}>;


export type GetItemQuery = (
    { __typename?: 'Query' }
    & {
        getItem: (
            { __typename?: 'GetItemResult' }
            & {
                Item?: Maybe<(
                    { __typename?: 'Item' }
                    & Pick<Item, 'idItem'>
                )>
            }
        )
    }
);

export type GetItemsForSubjectQueryVariables = Exact<{
    input: GetItemsForSubjectInput;
}>;


export type GetItemsForSubjectQuery = (
    { __typename?: 'Query' }
    & {
        getItemsForSubject: (
            { __typename?: 'GetItemsForSubjectResult' }
            & {
                Item: Array<(
                    { __typename?: 'Item' }
                    & Pick<Item, 'idItem' | 'Name'>
                )>
            }
        )
    }
);

export type GetObjectsForItemQueryVariables = Exact<{
    input: GetObjectsForItemInput;
}>;


export type GetObjectsForItemQuery = (
    { __typename?: 'Query' }
    & {
        getObjectsForItem: (
            { __typename?: 'GetObjectsForItemResult' }
            & {
                CaptureData: Array<(
                    { __typename?: 'CaptureData' }
                    & Pick<CaptureData, 'idCaptureData' | 'DateCaptured' | 'Description'>
                )>, Model: Array<(
                    { __typename?: 'Model' }
                    & Pick<Model, 'idModel' | 'Authoritative' | 'DateCreated'>
                )>, Scene: Array<(
                    { __typename?: 'Scene' }
                    & Pick<Scene, 'idScene' | 'HasBeenQCd' | 'IsOriented' | 'Name'>
                )>, IntermediaryFile: Array<(
                    { __typename?: 'IntermediaryFile' }
                    & Pick<IntermediaryFile, 'idIntermediaryFile' | 'DateCreated'>
                )>, ProjectDocumentation: Array<(
                    { __typename?: 'ProjectDocumentation' }
                    & Pick<ProjectDocumentation, 'idProjectDocumentation' | 'Description' | 'Name'>
                )>
            }
        )
    }
);

export type GetProjectQueryVariables = Exact<{
    input: GetProjectInput;
}>;


export type GetProjectQuery = (
    { __typename?: 'Query' }
    & {
        getProject: (
            { __typename?: 'GetProjectResult' }
            & {
                Project?: Maybe<(
                    { __typename?: 'Project' }
                    & Pick<Project, 'idProject'>
                )>
            }
        )
    }
);

export type GetSubjectQueryVariables = Exact<{
    input: GetSubjectInput;
}>;


export type GetSubjectQuery = (
    { __typename?: 'Query' }
    & {
        getSubject: (
            { __typename?: 'GetSubjectResult' }
            & {
                Subject?: Maybe<(
                    { __typename?: 'Subject' }
                    & Pick<Subject, 'idSubject'>
                )>
            }
        )
    }
);

export type GetSubjectsForUnitQueryVariables = Exact<{
    input: GetSubjectsForUnitInput;
}>;


export type GetSubjectsForUnitQuery = (
    { __typename?: 'Query' }
    & {
        getSubjectsForUnit: (
            { __typename?: 'GetSubjectsForUnitResult' }
            & {
                Subject: Array<(
                    { __typename?: 'Subject' }
                    & Pick<Subject, 'idSubject' | 'Name'>
                )>
            }
        )
    }
);

export type GetUnitQueryVariables = Exact<{
    input: GetUnitInput;
}>;


export type GetUnitQuery = (
    { __typename?: 'Query' }
    & {
        getUnit: (
            { __typename?: 'GetUnitResult' }
            & {
                Unit?: Maybe<(
                    { __typename?: 'Unit' }
                    & Pick<Unit, 'idUnit'>
                )>
            }
        )
    }
);

export type SearchIngestionSubjectsQueryVariables = Exact<{
    input: SearchIngestionSubjectsInput;
}>;


export type SearchIngestionSubjectsQuery = (
    { __typename?: 'Query' }
    & {
        searchIngestionSubjects: (
            { __typename?: 'SearchIngestionSubjectsResult' }
            & {
                SubjectUnitIdentifier: Array<(
                    { __typename?: 'SubjectUnitIdentifier' }
                    & Pick<SubjectUnitIdentifier, 'idSubject' | 'SubjectName' | 'UnitAbbreviation' | 'IdentifierPublic' | 'IdentifierCollection'>
                )>
            }
        )
    }
);

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = (
    { __typename?: 'Query' }
    & {
        getCurrentUser: (
            { __typename?: 'GetCurrentUserResult' }
            & {
                User?: Maybe<(
                    { __typename?: 'User' }
                    & Pick<User, 'idUser' | 'Name' | 'Active' | 'DateActivated' | 'DateDisabled' | 'EmailAddress' | 'EmailSettings' | 'SecurityID' | 'WorkflowNotificationTime'>
                )>
            }
        )
    }
);

export type GetUserQueryVariables = Exact<{
    input: GetUserInput;
}>;


export type GetUserQuery = (
    { __typename?: 'Query' }
    & {
        getUser: (
            { __typename?: 'GetUserResult' }
            & {
                User?: Maybe<(
                    { __typename?: 'User' }
                    & Pick<User, 'idUser' | 'Name' | 'Active' | 'DateActivated'>
                )>
            }
        )
    }
);

export type GetVocabularyQueryVariables = Exact<{
    input: GetVocabularyInput;
}>;


export type GetVocabularyQuery = (
    { __typename?: 'Query' }
    & {
        getVocabulary: (
            { __typename?: 'GetVocabularyResult' }
            & {
                Vocabulary?: Maybe<(
                    { __typename?: 'Vocabulary' }
                    & Pick<Vocabulary, 'idVocabulary'>
                )>
            }
        )
    }
);

export type GetVocabularyEntriesQueryVariables = Exact<{
    input: GetVocabularyEntriesInput;
}>;


export type GetVocabularyEntriesQuery = (
    { __typename?: 'Query' }
    & {
        getVocabularyEntries: (
            { __typename?: 'GetVocabularyEntriesResult' }
            & {
                VocabularyEntries: Array<(
                    { __typename?: 'VocabularyEntry' }
                    & Pick<VocabularyEntry, 'eVocabSetID'>
                    & {
                        Vocabulary: Array<(
                            { __typename?: 'Vocabulary' }
                            & Pick<Vocabulary, 'idVocabulary' | 'Term'>
                        )>
                    }
                )>
            }
        )
    }
);

export type GetWorkflowQueryVariables = Exact<{
    input: GetWorkflowInput;
}>;


export type GetWorkflowQuery = (
    { __typename?: 'Query' }
    & {
        getWorkflow: (
            { __typename?: 'GetWorkflowResult' }
            & {
                Workflow?: Maybe<(
                    { __typename?: 'Workflow' }
                    & Pick<Workflow, 'idWorkflow'>
                )>
            }
        )
    }
);


export const UploadAssetDocument = gql`
    mutation uploadAsset($file: Upload!, $type: Int!) {
  uploadAsset(file: $file, type: $type) {
    status
  }
}
    `;
export type UploadAssetMutationFn = Apollo.MutationFunction<UploadAssetMutation, UploadAssetMutationVariables>;

/**
 * __useUploadAssetMutation__
 *
 * To run a mutation, you first call `useUploadAssetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadAssetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadAssetMutation, { data, loading, error }] = useUploadAssetMutation({
 *   variables: {
 *      file: // value for 'file'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useUploadAssetMutation(baseOptions?: Apollo.MutationHookOptions<UploadAssetMutation, UploadAssetMutationVariables>) {
    return Apollo.useMutation<UploadAssetMutation, UploadAssetMutationVariables>(UploadAssetDocument, baseOptions);
}
export type UploadAssetMutationHookResult = ReturnType<typeof useUploadAssetMutation>;
export type UploadAssetMutationResult = Apollo.MutationResult<UploadAssetMutation>;
export type UploadAssetMutationOptions = Apollo.BaseMutationOptions<UploadAssetMutation, UploadAssetMutationVariables>;
export const CreateCaptureDataDocument = gql`
    mutation createCaptureData($input: CreateCaptureDataInput!) {
  createCaptureData(input: $input) {
    CaptureData {
      idCaptureData
    }
  }
}
    `;
export type CreateCaptureDataMutationFn = Apollo.MutationFunction<CreateCaptureDataMutation, CreateCaptureDataMutationVariables>;

/**
 * __useCreateCaptureDataMutation__
 *
 * To run a mutation, you first call `useCreateCaptureDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCaptureDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCaptureDataMutation, { data, loading, error }] = useCreateCaptureDataMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCaptureDataMutation(baseOptions?: Apollo.MutationHookOptions<CreateCaptureDataMutation, CreateCaptureDataMutationVariables>) {
    return Apollo.useMutation<CreateCaptureDataMutation, CreateCaptureDataMutationVariables>(CreateCaptureDataDocument, baseOptions);
}
export type CreateCaptureDataMutationHookResult = ReturnType<typeof useCreateCaptureDataMutation>;
export type CreateCaptureDataMutationResult = Apollo.MutationResult<CreateCaptureDataMutation>;
export type CreateCaptureDataMutationOptions = Apollo.BaseMutationOptions<CreateCaptureDataMutation, CreateCaptureDataMutationVariables>;
export const CreateCaptureDataPhotoDocument = gql`
    mutation createCaptureDataPhoto($input: CreateCaptureDataPhotoInput!) {
  createCaptureDataPhoto(input: $input) {
    CaptureDataPhoto {
      idCaptureDataPhoto
    }
  }
}
    `;
export type CreateCaptureDataPhotoMutationFn = Apollo.MutationFunction<CreateCaptureDataPhotoMutation, CreateCaptureDataPhotoMutationVariables>;

/**
 * __useCreateCaptureDataPhotoMutation__
 *
 * To run a mutation, you first call `useCreateCaptureDataPhotoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCaptureDataPhotoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCaptureDataPhotoMutation, { data, loading, error }] = useCreateCaptureDataPhotoMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateCaptureDataPhotoMutation(baseOptions?: Apollo.MutationHookOptions<CreateCaptureDataPhotoMutation, CreateCaptureDataPhotoMutationVariables>) {
    return Apollo.useMutation<CreateCaptureDataPhotoMutation, CreateCaptureDataPhotoMutationVariables>(CreateCaptureDataPhotoDocument, baseOptions);
}
export type CreateCaptureDataPhotoMutationHookResult = ReturnType<typeof useCreateCaptureDataPhotoMutation>;
export type CreateCaptureDataPhotoMutationResult = Apollo.MutationResult<CreateCaptureDataPhotoMutation>;
export type CreateCaptureDataPhotoMutationOptions = Apollo.BaseMutationOptions<CreateCaptureDataPhotoMutation, CreateCaptureDataPhotoMutationVariables>;
export const IngestDataDocument = gql`
    mutation ingestData($input: IngestDataInput!) {
  ingestData(input: $input) {
    success
  }
}
    `;
export type IngestDataMutationFn = Apollo.MutationFunction<IngestDataMutation, IngestDataMutationVariables>;

/**
 * __useIngestDataMutation__
 *
 * To run a mutation, you first call `useIngestDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIngestDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [ingestDataMutation, { data, loading, error }] = useIngestDataMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useIngestDataMutation(baseOptions?: Apollo.MutationHookOptions<IngestDataMutation, IngestDataMutationVariables>) {
    return Apollo.useMutation<IngestDataMutation, IngestDataMutationVariables>(IngestDataDocument, baseOptions);
}
export type IngestDataMutationHookResult = ReturnType<typeof useIngestDataMutation>;
export type IngestDataMutationResult = Apollo.MutationResult<IngestDataMutation>;
export type IngestDataMutationOptions = Apollo.BaseMutationOptions<IngestDataMutation, IngestDataMutationVariables>;
export const CreateModelDocument = gql`
    mutation createModel($input: CreateModelInput!) {
  createModel(input: $input) {
    Model {
      idModel
    }
  }
}
    `;
export type CreateModelMutationFn = Apollo.MutationFunction<CreateModelMutation, CreateModelMutationVariables>;

/**
 * __useCreateModelMutation__
 *
 * To run a mutation, you first call `useCreateModelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateModelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createModelMutation, { data, loading, error }] = useCreateModelMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateModelMutation(baseOptions?: Apollo.MutationHookOptions<CreateModelMutation, CreateModelMutationVariables>) {
    return Apollo.useMutation<CreateModelMutation, CreateModelMutationVariables>(CreateModelDocument, baseOptions);
}
export type CreateModelMutationHookResult = ReturnType<typeof useCreateModelMutation>;
export type CreateModelMutationResult = Apollo.MutationResult<CreateModelMutation>;
export type CreateModelMutationOptions = Apollo.BaseMutationOptions<CreateModelMutation, CreateModelMutationVariables>;
export const CreateSceneDocument = gql`
    mutation createScene($input: CreateSceneInput!) {
  createScene(input: $input) {
    Scene {
      idScene
    }
  }
}
    `;
export type CreateSceneMutationFn = Apollo.MutationFunction<CreateSceneMutation, CreateSceneMutationVariables>;

/**
 * __useCreateSceneMutation__
 *
 * To run a mutation, you first call `useCreateSceneMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSceneMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSceneMutation, { data, loading, error }] = useCreateSceneMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSceneMutation(baseOptions?: Apollo.MutationHookOptions<CreateSceneMutation, CreateSceneMutationVariables>) {
    return Apollo.useMutation<CreateSceneMutation, CreateSceneMutationVariables>(CreateSceneDocument, baseOptions);
}
export type CreateSceneMutationHookResult = ReturnType<typeof useCreateSceneMutation>;
export type CreateSceneMutationResult = Apollo.MutationResult<CreateSceneMutation>;
export type CreateSceneMutationOptions = Apollo.BaseMutationOptions<CreateSceneMutation, CreateSceneMutationVariables>;
export const CreateItemDocument = gql`
    mutation createItem($input: CreateItemInput!) {
  createItem(input: $input) {
    Item {
      idItem
    }
  }
}
    `;
export type CreateItemMutationFn = Apollo.MutationFunction<CreateItemMutation, CreateItemMutationVariables>;

/**
 * __useCreateItemMutation__
 *
 * To run a mutation, you first call `useCreateItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createItemMutation, { data, loading, error }] = useCreateItemMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateItemMutation(baseOptions?: Apollo.MutationHookOptions<CreateItemMutation, CreateItemMutationVariables>) {
    return Apollo.useMutation<CreateItemMutation, CreateItemMutationVariables>(CreateItemDocument, baseOptions);
}
export type CreateItemMutationHookResult = ReturnType<typeof useCreateItemMutation>;
export type CreateItemMutationResult = Apollo.MutationResult<CreateItemMutation>;
export type CreateItemMutationOptions = Apollo.BaseMutationOptions<CreateItemMutation, CreateItemMutationVariables>;
export const CreateProjectDocument = gql`
    mutation createProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    Project {
      idProject
    }
  }
}
    `;
export type CreateProjectMutationFn = Apollo.MutationFunction<CreateProjectMutation, CreateProjectMutationVariables>;

/**
 * __useCreateProjectMutation__
 *
 * To run a mutation, you first call `useCreateProjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProjectMutation, { data, loading, error }] = useCreateProjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProjectMutation(baseOptions?: Apollo.MutationHookOptions<CreateProjectMutation, CreateProjectMutationVariables>) {
    return Apollo.useMutation<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, baseOptions);
}
export type CreateProjectMutationHookResult = ReturnType<typeof useCreateProjectMutation>;
export type CreateProjectMutationResult = Apollo.MutationResult<CreateProjectMutation>;
export type CreateProjectMutationOptions = Apollo.BaseMutationOptions<CreateProjectMutation, CreateProjectMutationVariables>;
export const CreateSubjectDocument = gql`
    mutation createSubject($input: CreateSubjectInput!) {
  createSubject(input: $input) {
    Subject {
      idSubject
    }
  }
}
    `;
export type CreateSubjectMutationFn = Apollo.MutationFunction<CreateSubjectMutation, CreateSubjectMutationVariables>;

/**
 * __useCreateSubjectMutation__
 *
 * To run a mutation, you first call `useCreateSubjectMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSubjectMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSubjectMutation, { data, loading, error }] = useCreateSubjectMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSubjectMutation(baseOptions?: Apollo.MutationHookOptions<CreateSubjectMutation, CreateSubjectMutationVariables>) {
    return Apollo.useMutation<CreateSubjectMutation, CreateSubjectMutationVariables>(CreateSubjectDocument, baseOptions);
}
export type CreateSubjectMutationHookResult = ReturnType<typeof useCreateSubjectMutation>;
export type CreateSubjectMutationResult = Apollo.MutationResult<CreateSubjectMutation>;
export type CreateSubjectMutationOptions = Apollo.BaseMutationOptions<CreateSubjectMutation, CreateSubjectMutationVariables>;
export const CreateUnitDocument = gql`
    mutation createUnit($input: CreateUnitInput!) {
  createUnit(input: $input) {
    Unit {
      idUnit
    }
  }
}
    `;
export type CreateUnitMutationFn = Apollo.MutationFunction<CreateUnitMutation, CreateUnitMutationVariables>;

/**
 * __useCreateUnitMutation__
 *
 * To run a mutation, you first call `useCreateUnitMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUnitMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUnitMutation, { data, loading, error }] = useCreateUnitMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUnitMutation(baseOptions?: Apollo.MutationHookOptions<CreateUnitMutation, CreateUnitMutationVariables>) {
    return Apollo.useMutation<CreateUnitMutation, CreateUnitMutationVariables>(CreateUnitDocument, baseOptions);
}
export type CreateUnitMutationHookResult = ReturnType<typeof useCreateUnitMutation>;
export type CreateUnitMutationResult = Apollo.MutationResult<CreateUnitMutation>;
export type CreateUnitMutationOptions = Apollo.BaseMutationOptions<CreateUnitMutation, CreateUnitMutationVariables>;
export const CreateUserDocument = gql`
    mutation createUser($input: CreateUserInput!) {
  createUser(input: $input) {
    User {
      idUser
      Name
      Active
      DateActivated
    }
  }
}
    `;
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
    return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, baseOptions);
}
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const CreateVocabularyDocument = gql`
    mutation createVocabulary($input: CreateVocabularyInput!) {
  createVocabulary(input: $input) {
    Vocabulary {
      idVocabulary
    }
  }
}
    `;
export type CreateVocabularyMutationFn = Apollo.MutationFunction<CreateVocabularyMutation, CreateVocabularyMutationVariables>;

/**
 * __useCreateVocabularyMutation__
 *
 * To run a mutation, you first call `useCreateVocabularyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateVocabularyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createVocabularyMutation, { data, loading, error }] = useCreateVocabularyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateVocabularyMutation(baseOptions?: Apollo.MutationHookOptions<CreateVocabularyMutation, CreateVocabularyMutationVariables>) {
    return Apollo.useMutation<CreateVocabularyMutation, CreateVocabularyMutationVariables>(CreateVocabularyDocument, baseOptions);
}
export type CreateVocabularyMutationHookResult = ReturnType<typeof useCreateVocabularyMutation>;
export type CreateVocabularyMutationResult = Apollo.MutationResult<CreateVocabularyMutation>;
export type CreateVocabularyMutationOptions = Apollo.BaseMutationOptions<CreateVocabularyMutation, CreateVocabularyMutationVariables>;
export const CreateVocabularySetDocument = gql`
    mutation createVocabularySet($input: CreateVocabularySetInput!) {
  createVocabularySet(input: $input) {
    VocabularySet {
      idVocabularySet
    }
  }
}
    `;
export type CreateVocabularySetMutationFn = Apollo.MutationFunction<CreateVocabularySetMutation, CreateVocabularySetMutationVariables>;

/**
 * __useCreateVocabularySetMutation__
 *
 * To run a mutation, you first call `useCreateVocabularySetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateVocabularySetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createVocabularySetMutation, { data, loading, error }] = useCreateVocabularySetMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateVocabularySetMutation(baseOptions?: Apollo.MutationHookOptions<CreateVocabularySetMutation, CreateVocabularySetMutationVariables>) {
    return Apollo.useMutation<CreateVocabularySetMutation, CreateVocabularySetMutationVariables>(CreateVocabularySetDocument, baseOptions);
}
export type CreateVocabularySetMutationHookResult = ReturnType<typeof useCreateVocabularySetMutation>;
export type CreateVocabularySetMutationResult = Apollo.MutationResult<CreateVocabularySetMutation>;
export type CreateVocabularySetMutationOptions = Apollo.BaseMutationOptions<CreateVocabularySetMutation, CreateVocabularySetMutationVariables>;
export const GetAccessPolicyDocument = gql`
    query getAccessPolicy($input: GetAccessPolicyInput!) {
  getAccessPolicy(input: $input) {
    AccessPolicy {
      idAccessPolicy
    }
  }
}
    `;

/**
 * __useGetAccessPolicyQuery__
 *
 * To run a query within a React component, call `useGetAccessPolicyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAccessPolicyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAccessPolicyQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetAccessPolicyQuery(baseOptions?: Apollo.QueryHookOptions<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>) {
    return Apollo.useQuery<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>(GetAccessPolicyDocument, baseOptions);
}
export function useGetAccessPolicyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>) {
    return Apollo.useLazyQuery<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>(GetAccessPolicyDocument, baseOptions);
}
export type GetAccessPolicyQueryHookResult = ReturnType<typeof useGetAccessPolicyQuery>;
export type GetAccessPolicyLazyQueryHookResult = ReturnType<typeof useGetAccessPolicyLazyQuery>;
export type GetAccessPolicyQueryResult = Apollo.QueryResult<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>;
export const GetAssetDocument = gql`
    query getAsset($input: GetAssetInput!) {
  getAsset(input: $input) {
    Asset {
      idAsset
    }
  }
}
    `;

/**
 * __useGetAssetQuery__
 *
 * To run a query within a React component, call `useGetAssetQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAssetQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAssetQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetAssetQuery(baseOptions?: Apollo.QueryHookOptions<GetAssetQuery, GetAssetQueryVariables>) {
    return Apollo.useQuery<GetAssetQuery, GetAssetQueryVariables>(GetAssetDocument, baseOptions);
}
export function useGetAssetLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAssetQuery, GetAssetQueryVariables>) {
    return Apollo.useLazyQuery<GetAssetQuery, GetAssetQueryVariables>(GetAssetDocument, baseOptions);
}
export type GetAssetQueryHookResult = ReturnType<typeof useGetAssetQuery>;
export type GetAssetLazyQueryHookResult = ReturnType<typeof useGetAssetLazyQuery>;
export type GetAssetQueryResult = Apollo.QueryResult<GetAssetQuery, GetAssetQueryVariables>;
export const GetAssetVersionsDetailsDocument = gql`
    query getAssetVersionsDetails($input: GetAssetVersionsDetailsInput!) {
  getAssetVersionsDetails(input: $input) {
    valid
    SubjectUnitIdentifier {
      idSubject
      SubjectName
      UnitAbbreviation
      IdentifierPublic
      IdentifierCollection
    }
    Project {
      idProject
      Name
    }
    Item {
      idItem
      Name
      EntireSubject
    }
  }
}
    `;

/**
 * __useGetAssetVersionsDetailsQuery__
 *
 * To run a query within a React component, call `useGetAssetVersionsDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAssetVersionsDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAssetVersionsDetailsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetAssetVersionsDetailsQuery(baseOptions?: Apollo.QueryHookOptions<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>) {
    return Apollo.useQuery<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>(GetAssetVersionsDetailsDocument, baseOptions);
}
export function useGetAssetVersionsDetailsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>) {
    return Apollo.useLazyQuery<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>(GetAssetVersionsDetailsDocument, baseOptions);
}
export type GetAssetVersionsDetailsQueryHookResult = ReturnType<typeof useGetAssetVersionsDetailsQuery>;
export type GetAssetVersionsDetailsLazyQueryHookResult = ReturnType<typeof useGetAssetVersionsDetailsLazyQuery>;
export type GetAssetVersionsDetailsQueryResult = Apollo.QueryResult<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>;
export const GetContentsForAssetVersionsDocument = gql`
    query getContentsForAssetVersions($input: GetContentsForAssetVersionsInput!) {
  getContentsForAssetVersions(input: $input) {
    AssetVersionContent {
      idAssetVersion
      folders
      all
    }
  }
}
    `;

/**
 * __useGetContentsForAssetVersionsQuery__
 *
 * To run a query within a React component, call `useGetContentsForAssetVersionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetContentsForAssetVersionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetContentsForAssetVersionsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetContentsForAssetVersionsQuery(baseOptions?: Apollo.QueryHookOptions<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>) {
    return Apollo.useQuery<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>(GetContentsForAssetVersionsDocument, baseOptions);
}
export function useGetContentsForAssetVersionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>) {
    return Apollo.useLazyQuery<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>(GetContentsForAssetVersionsDocument, baseOptions);
}
export type GetContentsForAssetVersionsQueryHookResult = ReturnType<typeof useGetContentsForAssetVersionsQuery>;
export type GetContentsForAssetVersionsLazyQueryHookResult = ReturnType<typeof useGetContentsForAssetVersionsLazyQuery>;
export type GetContentsForAssetVersionsQueryResult = Apollo.QueryResult<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>;
export const GetUploadedAssetVersionDocument = gql`
    query getUploadedAssetVersion {
  getUploadedAssetVersion {
    AssetVersion {
      idAssetVersion
      StorageSize
      Asset {
        idAsset
        FileName
        VAssetType {
          idVocabulary
          Term
        }
      }
    }
  }
}
    `;

/**
 * __useGetUploadedAssetVersionQuery__
 *
 * To run a query within a React component, call `useGetUploadedAssetVersionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUploadedAssetVersionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUploadedAssetVersionQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetUploadedAssetVersionQuery(baseOptions?: Apollo.QueryHookOptions<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>) {
    return Apollo.useQuery<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>(GetUploadedAssetVersionDocument, baseOptions);
}
export function useGetUploadedAssetVersionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>) {
    return Apollo.useLazyQuery<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>(GetUploadedAssetVersionDocument, baseOptions);
}
export type GetUploadedAssetVersionQueryHookResult = ReturnType<typeof useGetUploadedAssetVersionQuery>;
export type GetUploadedAssetVersionLazyQueryHookResult = ReturnType<typeof useGetUploadedAssetVersionLazyQuery>;
export type GetUploadedAssetVersionQueryResult = Apollo.QueryResult<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>;
export const GetCaptureDataDocument = gql`
    query getCaptureData($input: GetCaptureDataInput!) {
  getCaptureData(input: $input) {
    CaptureData {
      idCaptureData
    }
  }
}
    `;

/**
 * __useGetCaptureDataQuery__
 *
 * To run a query within a React component, call `useGetCaptureDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCaptureDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCaptureDataQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetCaptureDataQuery(baseOptions?: Apollo.QueryHookOptions<GetCaptureDataQuery, GetCaptureDataQueryVariables>) {
    return Apollo.useQuery<GetCaptureDataQuery, GetCaptureDataQueryVariables>(GetCaptureDataDocument, baseOptions);
}
export function useGetCaptureDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCaptureDataQuery, GetCaptureDataQueryVariables>) {
    return Apollo.useLazyQuery<GetCaptureDataQuery, GetCaptureDataQueryVariables>(GetCaptureDataDocument, baseOptions);
}
export type GetCaptureDataQueryHookResult = ReturnType<typeof useGetCaptureDataQuery>;
export type GetCaptureDataLazyQueryHookResult = ReturnType<typeof useGetCaptureDataLazyQuery>;
export type GetCaptureDataQueryResult = Apollo.QueryResult<GetCaptureDataQuery, GetCaptureDataQueryVariables>;
export const GetCaptureDataPhotoDocument = gql`
    query getCaptureDataPhoto($input: GetCaptureDataPhotoInput!) {
  getCaptureDataPhoto(input: $input) {
    CaptureDataPhoto {
      idCaptureDataPhoto
    }
  }
}
    `;

/**
 * __useGetCaptureDataPhotoQuery__
 *
 * To run a query within a React component, call `useGetCaptureDataPhotoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCaptureDataPhotoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCaptureDataPhotoQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetCaptureDataPhotoQuery(baseOptions?: Apollo.QueryHookOptions<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>) {
    return Apollo.useQuery<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>(GetCaptureDataPhotoDocument, baseOptions);
}
export function useGetCaptureDataPhotoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>) {
    return Apollo.useLazyQuery<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>(GetCaptureDataPhotoDocument, baseOptions);
}
export type GetCaptureDataPhotoQueryHookResult = ReturnType<typeof useGetCaptureDataPhotoQuery>;
export type GetCaptureDataPhotoLazyQueryHookResult = ReturnType<typeof useGetCaptureDataPhotoLazyQuery>;
export type GetCaptureDataPhotoQueryResult = Apollo.QueryResult<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>;
export const AreCameraSettingsUniformDocument = gql`
    query areCameraSettingsUniform($input: AreCameraSettingsUniformInput!) {
  areCameraSettingsUniform(input: $input) {
    isUniform
  }
}
    `;

/**
 * __useAreCameraSettingsUniformQuery__
 *
 * To run a query within a React component, call `useAreCameraSettingsUniformQuery` and pass it any options that fit your needs.
 * When your component renders, `useAreCameraSettingsUniformQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAreCameraSettingsUniformQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAreCameraSettingsUniformQuery(baseOptions?: Apollo.QueryHookOptions<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>) {
    return Apollo.useQuery<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>(AreCameraSettingsUniformDocument, baseOptions);
}
export function useAreCameraSettingsUniformLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>) {
    return Apollo.useLazyQuery<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>(AreCameraSettingsUniformDocument, baseOptions);
}
export type AreCameraSettingsUniformQueryHookResult = ReturnType<typeof useAreCameraSettingsUniformQuery>;
export type AreCameraSettingsUniformLazyQueryHookResult = ReturnType<typeof useAreCameraSettingsUniformLazyQuery>;
export type AreCameraSettingsUniformQueryResult = Apollo.QueryResult<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>;
export const GetLicenseDocument = gql`
    query getLicense($input: GetLicenseInput!) {
  getLicense(input: $input) {
    License {
      idLicense
    }
  }
}
    `;

/**
 * __useGetLicenseQuery__
 *
 * To run a query within a React component, call `useGetLicenseQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLicenseQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLicenseQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetLicenseQuery(baseOptions?: Apollo.QueryHookOptions<GetLicenseQuery, GetLicenseQueryVariables>) {
    return Apollo.useQuery<GetLicenseQuery, GetLicenseQueryVariables>(GetLicenseDocument, baseOptions);
}
export function useGetLicenseLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLicenseQuery, GetLicenseQueryVariables>) {
    return Apollo.useLazyQuery<GetLicenseQuery, GetLicenseQueryVariables>(GetLicenseDocument, baseOptions);
}
export type GetLicenseQueryHookResult = ReturnType<typeof useGetLicenseQuery>;
export type GetLicenseLazyQueryHookResult = ReturnType<typeof useGetLicenseLazyQuery>;
export type GetLicenseQueryResult = Apollo.QueryResult<GetLicenseQuery, GetLicenseQueryVariables>;
export const GetModelDocument = gql`
    query getModel($input: GetModelInput!) {
  getModel(input: $input) {
    Model {
      idModel
    }
  }
}
    `;

/**
 * __useGetModelQuery__
 *
 * To run a query within a React component, call `useGetModelQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetModelQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetModelQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetModelQuery(baseOptions?: Apollo.QueryHookOptions<GetModelQuery, GetModelQueryVariables>) {
    return Apollo.useQuery<GetModelQuery, GetModelQueryVariables>(GetModelDocument, baseOptions);
}
export function useGetModelLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetModelQuery, GetModelQueryVariables>) {
    return Apollo.useLazyQuery<GetModelQuery, GetModelQueryVariables>(GetModelDocument, baseOptions);
}
export type GetModelQueryHookResult = ReturnType<typeof useGetModelQuery>;
export type GetModelLazyQueryHookResult = ReturnType<typeof useGetModelLazyQuery>;
export type GetModelQueryResult = Apollo.QueryResult<GetModelQuery, GetModelQueryVariables>;
export const GetSceneDocument = gql`
    query getScene($input: GetSceneInput!) {
  getScene(input: $input) {
    Scene {
      idScene
    }
  }
}
    `;

/**
 * __useGetSceneQuery__
 *
 * To run a query within a React component, call `useGetSceneQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSceneQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSceneQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSceneQuery(baseOptions?: Apollo.QueryHookOptions<GetSceneQuery, GetSceneQueryVariables>) {
    return Apollo.useQuery<GetSceneQuery, GetSceneQueryVariables>(GetSceneDocument, baseOptions);
}
export function useGetSceneLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSceneQuery, GetSceneQueryVariables>) {
    return Apollo.useLazyQuery<GetSceneQuery, GetSceneQueryVariables>(GetSceneDocument, baseOptions);
}
export type GetSceneQueryHookResult = ReturnType<typeof useGetSceneQuery>;
export type GetSceneLazyQueryHookResult = ReturnType<typeof useGetSceneLazyQuery>;
export type GetSceneQueryResult = Apollo.QueryResult<GetSceneQuery, GetSceneQueryVariables>;
export const GetIngestionItemsForSubjectsDocument = gql`
    query getIngestionItemsForSubjects($input: GetIngestionItemsForSubjectsInput!) {
  getIngestionItemsForSubjects(input: $input) {
    Item {
      idItem
      EntireSubject
      Name
    }
  }
}
    `;

/**
 * __useGetIngestionItemsForSubjectsQuery__
 *
 * To run a query within a React component, call `useGetIngestionItemsForSubjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIngestionItemsForSubjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIngestionItemsForSubjectsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetIngestionItemsForSubjectsQuery(baseOptions?: Apollo.QueryHookOptions<GetIngestionItemsForSubjectsQuery, GetIngestionItemsForSubjectsQueryVariables>) {
    return Apollo.useQuery<GetIngestionItemsForSubjectsQuery, GetIngestionItemsForSubjectsQueryVariables>(GetIngestionItemsForSubjectsDocument, baseOptions);
}
export function useGetIngestionItemsForSubjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetIngestionItemsForSubjectsQuery, GetIngestionItemsForSubjectsQueryVariables>) {
    return Apollo.useLazyQuery<GetIngestionItemsForSubjectsQuery, GetIngestionItemsForSubjectsQueryVariables>(GetIngestionItemsForSubjectsDocument, baseOptions);
}
export type GetIngestionItemsForSubjectsQueryHookResult = ReturnType<typeof useGetIngestionItemsForSubjectsQuery>;
export type GetIngestionItemsForSubjectsLazyQueryHookResult = ReturnType<typeof useGetIngestionItemsForSubjectsLazyQuery>;
export type GetIngestionItemsForSubjectsQueryResult = Apollo.QueryResult<GetIngestionItemsForSubjectsQuery, GetIngestionItemsForSubjectsQueryVariables>;
export const GetIngestionProjectsForSubjectsDocument = gql`
    query getIngestionProjectsForSubjects($input: GetIngestionProjectsForSubjectsInput!) {
  getIngestionProjectsForSubjects(input: $input) {
    Project {
      idProject
      Name
    }
  }
}
    `;

/**
 * __useGetIngestionProjectsForSubjectsQuery__
 *
 * To run a query within a React component, call `useGetIngestionProjectsForSubjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIngestionProjectsForSubjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIngestionProjectsForSubjectsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetIngestionProjectsForSubjectsQuery(baseOptions?: Apollo.QueryHookOptions<GetIngestionProjectsForSubjectsQuery, GetIngestionProjectsForSubjectsQueryVariables>) {
    return Apollo.useQuery<GetIngestionProjectsForSubjectsQuery, GetIngestionProjectsForSubjectsQueryVariables>(GetIngestionProjectsForSubjectsDocument, baseOptions);
}
export function useGetIngestionProjectsForSubjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetIngestionProjectsForSubjectsQuery, GetIngestionProjectsForSubjectsQueryVariables>) {
    return Apollo.useLazyQuery<GetIngestionProjectsForSubjectsQuery, GetIngestionProjectsForSubjectsQueryVariables>(GetIngestionProjectsForSubjectsDocument, baseOptions);
}
export type GetIngestionProjectsForSubjectsQueryHookResult = ReturnType<typeof useGetIngestionProjectsForSubjectsQuery>;
export type GetIngestionProjectsForSubjectsLazyQueryHookResult = ReturnType<typeof useGetIngestionProjectsForSubjectsLazyQuery>;
export type GetIngestionProjectsForSubjectsQueryResult = Apollo.QueryResult<GetIngestionProjectsForSubjectsQuery, GetIngestionProjectsForSubjectsQueryVariables>;
export const GetItemDocument = gql`
    query getItem($input: GetItemInput!) {
  getItem(input: $input) {
    Item {
      idItem
    }
  }
}
    `;

/**
 * __useGetItemQuery__
 *
 * To run a query within a React component, call `useGetItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetItemQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetItemQuery(baseOptions?: Apollo.QueryHookOptions<GetItemQuery, GetItemQueryVariables>) {
    return Apollo.useQuery<GetItemQuery, GetItemQueryVariables>(GetItemDocument, baseOptions);
}
export function useGetItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemQuery, GetItemQueryVariables>) {
    return Apollo.useLazyQuery<GetItemQuery, GetItemQueryVariables>(GetItemDocument, baseOptions);
}
export type GetItemQueryHookResult = ReturnType<typeof useGetItemQuery>;
export type GetItemLazyQueryHookResult = ReturnType<typeof useGetItemLazyQuery>;
export type GetItemQueryResult = Apollo.QueryResult<GetItemQuery, GetItemQueryVariables>;
export const GetItemsForSubjectDocument = gql`
    query getItemsForSubject($input: GetItemsForSubjectInput!) {
  getItemsForSubject(input: $input) {
    Item {
      idItem
      Name
    }
  }
}
    `;

/**
 * __useGetItemsForSubjectQuery__
 *
 * To run a query within a React component, call `useGetItemsForSubjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetItemsForSubjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetItemsForSubjectQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetItemsForSubjectQuery(baseOptions?: Apollo.QueryHookOptions<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>) {
    return Apollo.useQuery<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>(GetItemsForSubjectDocument, baseOptions);
}
export function useGetItemsForSubjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>) {
    return Apollo.useLazyQuery<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>(GetItemsForSubjectDocument, baseOptions);
}
export type GetItemsForSubjectQueryHookResult = ReturnType<typeof useGetItemsForSubjectQuery>;
export type GetItemsForSubjectLazyQueryHookResult = ReturnType<typeof useGetItemsForSubjectLazyQuery>;
export type GetItemsForSubjectQueryResult = Apollo.QueryResult<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>;
export const GetObjectsForItemDocument = gql`
    query getObjectsForItem($input: GetObjectsForItemInput!) {
  getObjectsForItem(input: $input) {
    CaptureData {
      idCaptureData
      DateCaptured
      Description
    }
    Model {
      idModel
      Authoritative
      DateCreated
    }
    Scene {
      idScene
      HasBeenQCd
      IsOriented
      Name
    }
    IntermediaryFile {
      idIntermediaryFile
      DateCreated
    }
    ProjectDocumentation {
      idProjectDocumentation
      Description
      Name
    }
  }
}
    `;

/**
 * __useGetObjectsForItemQuery__
 *
 * To run a query within a React component, call `useGetObjectsForItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetObjectsForItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetObjectsForItemQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetObjectsForItemQuery(baseOptions?: Apollo.QueryHookOptions<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>) {
    return Apollo.useQuery<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>(GetObjectsForItemDocument, baseOptions);
}
export function useGetObjectsForItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>) {
    return Apollo.useLazyQuery<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>(GetObjectsForItemDocument, baseOptions);
}
export type GetObjectsForItemQueryHookResult = ReturnType<typeof useGetObjectsForItemQuery>;
export type GetObjectsForItemLazyQueryHookResult = ReturnType<typeof useGetObjectsForItemLazyQuery>;
export type GetObjectsForItemQueryResult = Apollo.QueryResult<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>;
export const GetProjectDocument = gql`
    query getProject($input: GetProjectInput!) {
  getProject(input: $input) {
    Project {
      idProject
    }
  }
}
    `;

/**
 * __useGetProjectQuery__
 *
 * To run a query within a React component, call `useGetProjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetProjectQuery(baseOptions?: Apollo.QueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
    return Apollo.useQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, baseOptions);
}
export function useGetProjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
    return Apollo.useLazyQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, baseOptions);
}
export type GetProjectQueryHookResult = ReturnType<typeof useGetProjectQuery>;
export type GetProjectLazyQueryHookResult = ReturnType<typeof useGetProjectLazyQuery>;
export type GetProjectQueryResult = Apollo.QueryResult<GetProjectQuery, GetProjectQueryVariables>;
export const GetSubjectDocument = gql`
    query getSubject($input: GetSubjectInput!) {
  getSubject(input: $input) {
    Subject {
      idSubject
    }
  }
}
    `;

/**
 * __useGetSubjectQuery__
 *
 * To run a query within a React component, call `useGetSubjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSubjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSubjectQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSubjectQuery(baseOptions?: Apollo.QueryHookOptions<GetSubjectQuery, GetSubjectQueryVariables>) {
    return Apollo.useQuery<GetSubjectQuery, GetSubjectQueryVariables>(GetSubjectDocument, baseOptions);
}
export function useGetSubjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubjectQuery, GetSubjectQueryVariables>) {
    return Apollo.useLazyQuery<GetSubjectQuery, GetSubjectQueryVariables>(GetSubjectDocument, baseOptions);
}
export type GetSubjectQueryHookResult = ReturnType<typeof useGetSubjectQuery>;
export type GetSubjectLazyQueryHookResult = ReturnType<typeof useGetSubjectLazyQuery>;
export type GetSubjectQueryResult = Apollo.QueryResult<GetSubjectQuery, GetSubjectQueryVariables>;
export const GetSubjectsForUnitDocument = gql`
    query getSubjectsForUnit($input: GetSubjectsForUnitInput!) {
  getSubjectsForUnit(input: $input) {
    Subject {
      idSubject
      Name
    }
  }
}
    `;

/**
 * __useGetSubjectsForUnitQuery__
 *
 * To run a query within a React component, call `useGetSubjectsForUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSubjectsForUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSubjectsForUnitQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSubjectsForUnitQuery(baseOptions?: Apollo.QueryHookOptions<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>) {
    return Apollo.useQuery<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>(GetSubjectsForUnitDocument, baseOptions);
}
export function useGetSubjectsForUnitLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>) {
    return Apollo.useLazyQuery<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>(GetSubjectsForUnitDocument, baseOptions);
}
export type GetSubjectsForUnitQueryHookResult = ReturnType<typeof useGetSubjectsForUnitQuery>;
export type GetSubjectsForUnitLazyQueryHookResult = ReturnType<typeof useGetSubjectsForUnitLazyQuery>;
export type GetSubjectsForUnitQueryResult = Apollo.QueryResult<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>;
export const GetUnitDocument = gql`
    query getUnit($input: GetUnitInput!) {
  getUnit(input: $input) {
    Unit {
      idUnit
    }
  }
}
    `;

/**
 * __useGetUnitQuery__
 *
 * To run a query within a React component, call `useGetUnitQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUnitQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUnitQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetUnitQuery(baseOptions?: Apollo.QueryHookOptions<GetUnitQuery, GetUnitQueryVariables>) {
    return Apollo.useQuery<GetUnitQuery, GetUnitQueryVariables>(GetUnitDocument, baseOptions);
}
export function useGetUnitLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUnitQuery, GetUnitQueryVariables>) {
    return Apollo.useLazyQuery<GetUnitQuery, GetUnitQueryVariables>(GetUnitDocument, baseOptions);
}
export type GetUnitQueryHookResult = ReturnType<typeof useGetUnitQuery>;
export type GetUnitLazyQueryHookResult = ReturnType<typeof useGetUnitLazyQuery>;
export type GetUnitQueryResult = Apollo.QueryResult<GetUnitQuery, GetUnitQueryVariables>;
export const SearchIngestionSubjectsDocument = gql`
    query searchIngestionSubjects($input: SearchIngestionSubjectsInput!) {
  searchIngestionSubjects(input: $input) {
    SubjectUnitIdentifier {
      idSubject
      SubjectName
      UnitAbbreviation
      IdentifierPublic
      IdentifierCollection
    }
  }
}
    `;

/**
 * __useSearchIngestionSubjectsQuery__
 *
 * To run a query within a React component, call `useSearchIngestionSubjectsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchIngestionSubjectsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchIngestionSubjectsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchIngestionSubjectsQuery(baseOptions?: Apollo.QueryHookOptions<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>) {
    return Apollo.useQuery<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>(SearchIngestionSubjectsDocument, baseOptions);
}
export function useSearchIngestionSubjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>) {
    return Apollo.useLazyQuery<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>(SearchIngestionSubjectsDocument, baseOptions);
}
export type SearchIngestionSubjectsQueryHookResult = ReturnType<typeof useSearchIngestionSubjectsQuery>;
export type SearchIngestionSubjectsLazyQueryHookResult = ReturnType<typeof useSearchIngestionSubjectsLazyQuery>;
export type SearchIngestionSubjectsQueryResult = Apollo.QueryResult<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>;
export const GetCurrentUserDocument = gql`
    query getCurrentUser {
  getCurrentUser {
    User {
      idUser
      Name
      Active
      DateActivated
      DateDisabled
      EmailAddress
      EmailSettings
      SecurityID
      WorkflowNotificationTime
    }
  }
}
    `;

/**
 * __useGetCurrentUserQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
    return Apollo.useQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, baseOptions);
}
export function useGetCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
    return Apollo.useLazyQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, baseOptions);
}
export type GetCurrentUserQueryHookResult = ReturnType<typeof useGetCurrentUserQuery>;
export type GetCurrentUserLazyQueryHookResult = ReturnType<typeof useGetCurrentUserLazyQuery>;
export type GetCurrentUserQueryResult = Apollo.QueryResult<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export const GetUserDocument = gql`
    query getUser($input: GetUserInput!) {
  getUser(input: $input) {
    User {
      idUser
      Name
      Active
      DateActivated
    }
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions?: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
    return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, baseOptions);
}
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
    return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, baseOptions);
}
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const GetVocabularyDocument = gql`
    query getVocabulary($input: GetVocabularyInput!) {
  getVocabulary(input: $input) {
    Vocabulary {
      idVocabulary
    }
  }
}
    `;

/**
 * __useGetVocabularyQuery__
 *
 * To run a query within a React component, call `useGetVocabularyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetVocabularyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVocabularyQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetVocabularyQuery(baseOptions?: Apollo.QueryHookOptions<GetVocabularyQuery, GetVocabularyQueryVariables>) {
    return Apollo.useQuery<GetVocabularyQuery, GetVocabularyQueryVariables>(GetVocabularyDocument, baseOptions);
}
export function useGetVocabularyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetVocabularyQuery, GetVocabularyQueryVariables>) {
    return Apollo.useLazyQuery<GetVocabularyQuery, GetVocabularyQueryVariables>(GetVocabularyDocument, baseOptions);
}
export type GetVocabularyQueryHookResult = ReturnType<typeof useGetVocabularyQuery>;
export type GetVocabularyLazyQueryHookResult = ReturnType<typeof useGetVocabularyLazyQuery>;
export type GetVocabularyQueryResult = Apollo.QueryResult<GetVocabularyQuery, GetVocabularyQueryVariables>;
export const GetVocabularyEntriesDocument = gql`
    query getVocabularyEntries($input: GetVocabularyEntriesInput!) {
  getVocabularyEntries(input: $input) {
    VocabularyEntries {
      eVocabSetID
      Vocabulary {
        idVocabulary
        Term
      }
    }
  }
}
    `;

/**
 * __useGetVocabularyEntriesQuery__
 *
 * To run a query within a React component, call `useGetVocabularyEntriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetVocabularyEntriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVocabularyEntriesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetVocabularyEntriesQuery(baseOptions?: Apollo.QueryHookOptions<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>) {
    return Apollo.useQuery<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>(GetVocabularyEntriesDocument, baseOptions);
}
export function useGetVocabularyEntriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>) {
    return Apollo.useLazyQuery<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>(GetVocabularyEntriesDocument, baseOptions);
}
export type GetVocabularyEntriesQueryHookResult = ReturnType<typeof useGetVocabularyEntriesQuery>;
export type GetVocabularyEntriesLazyQueryHookResult = ReturnType<typeof useGetVocabularyEntriesLazyQuery>;
export type GetVocabularyEntriesQueryResult = Apollo.QueryResult<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>;
export const GetWorkflowDocument = gql`
    query getWorkflow($input: GetWorkflowInput!) {
  getWorkflow(input: $input) {
    Workflow {
      idWorkflow
    }
  }
}
    `;

/**
 * __useGetWorkflowQuery__
 *
 * To run a query within a React component, call `useGetWorkflowQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorkflowQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorkflowQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetWorkflowQuery(baseOptions?: Apollo.QueryHookOptions<GetWorkflowQuery, GetWorkflowQueryVariables>) {
    return Apollo.useQuery<GetWorkflowQuery, GetWorkflowQueryVariables>(GetWorkflowDocument, baseOptions);
}
export function useGetWorkflowLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWorkflowQuery, GetWorkflowQueryVariables>) {
    return Apollo.useLazyQuery<GetWorkflowQuery, GetWorkflowQueryVariables>(GetWorkflowDocument, baseOptions);
}
export type GetWorkflowQueryHookResult = ReturnType<typeof useGetWorkflowQuery>;
export type GetWorkflowLazyQueryHookResult = ReturnType<typeof useGetWorkflowLazyQuery>;
export type GetWorkflowQueryResult = Apollo.QueryResult<GetWorkflowQuery, GetWorkflowQueryVariables>;