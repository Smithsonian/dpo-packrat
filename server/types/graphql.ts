/* eslint-disable @typescript-eslint/no-explicit-any */
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
    Project: Project;
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
    SystemObject?: Maybe<SystemObject>;
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
    SystemObject?: Maybe<SystemObject>;
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
    getCaptureData: GetCaptureDataResult;
    getCaptureDataPhoto: GetCaptureDataPhotoResult;
    areCameraSettingsUniform: AreCameraSettingsUniformResult;
    getLicense: GetLicenseResult;
    getModel: GetModelResult;
    getScene: GetSceneResult;
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

export type SubjectUnitIdentifier = {
    __typename?: 'SubjectUnitIdentifier';
    idSubject: Scalars['Int'];
    SubjectName: Scalars['String'];
    UnitAbbreviation: Scalars['String'];
    IdentifierPublic?: Maybe<Scalars['String']>;
    IdentifierCollection?: Maybe<Scalars['String']>;
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

export enum AssetType {
    Diconde = 'Diconde',
    Photogrammetry = 'Photogrammetry'
}

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
    type: AssetType;
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
    type: AssetType;
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
