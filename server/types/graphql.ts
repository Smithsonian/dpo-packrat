export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    DateTime: any;
};

export type Asset = {
    __typename?: 'Asset';
    idAsset: Scalars['ID'];
    FileName: Scalars['String'];
    FilePath: Scalars['String'];
    AssetGroup?: Maybe<AssetGroup>;
    CaptureDataFile?: Maybe<Array<Maybe<CaptureDataFile>>>;
    Scene?: Maybe<Array<Maybe<Scene>>>;
    IntermediaryFile?: Maybe<Array<Maybe<IntermediaryFile>>>;
};

export type AssetVersion = {
    __typename?: 'AssetVersion';
    idAssetVersion: Scalars['ID'];
    Asset?: Maybe<Asset>;
    UserCreator?: Maybe<User>;
    DateCreated: Scalars['DateTime'];
    StorageLocation: Scalars['String'];
    StorageChecksum: Scalars['String'];
    StorageSize: Scalars['Int'];
};

export type AssetGroup = {
    __typename?: 'AssetGroup';
    idAssetGroup: Scalars['ID'];
    Asset?: Maybe<Array<Maybe<Asset>>>;
};

export type CaptureData = {
    __typename?: 'CaptureData';
    idCaptureData: Scalars['ID'];
    VCaptureMethod: Vocabulary;
    VCaptureDatasetType: Vocabulary;
    DateCaptured: Scalars['DateTime'];
    Description: Scalars['String'];
    CaptureDatasetFieldID?: Maybe<Scalars['Int']>;
    VItemPositionType?: Maybe<Vocabulary>;
    ItemPositionFieldID?: Maybe<Scalars['Int']>;
    ItemArrangementFieldID?: Maybe<Scalars['Int']>;
    VFocusType?: Maybe<Vocabulary>;
    VLightSourceType?: Maybe<Vocabulary>;
    VBackgroundRemovalMethod?: Maybe<Vocabulary>;
    VClusterType?: Maybe<Vocabulary>;
    ClusterGeometryFieldID?: Maybe<Scalars['Int']>;
    CameraSettingsUniform?: Maybe<Scalars['Boolean']>;
    AssetThumbnail?: Maybe<Asset>;
    CaptureDataGroup?: Maybe<Array<Maybe<CaptureDataGroup>>>;
    CaptureDataFile?: Maybe<Array<Maybe<CaptureDataFile>>>;
};

export type CaptureDataFile = {
    __typename?: 'CaptureDataFile';
    idCaptureDataFile: Scalars['ID'];
    CaptureData: CaptureData;
    Asset: Asset;
    VVariantType: Vocabulary;
    CompressedMultipleFiles: Scalars['Boolean'];
};

export type CaptureDataGroup = {
    __typename?: 'CaptureDataGroup';
    idCaptureDataGroup: Scalars['ID'];
    CaptureData?: Maybe<Array<Maybe<CaptureData>>>;
};

export type License = {
    __typename?: 'License';
    idLicense: Scalars['ID'];
    Name: Scalars['String'];
    Description: Scalars['String'];
    LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
};

export type LicenseAssignment = {
    __typename?: 'LicenseAssignment';
    idLicenseAssignment: Scalars['ID'];
    License: License;
    UserCreator?: Maybe<User>;
    DateStart?: Maybe<Scalars['DateTime']>;
    DateEnd?: Maybe<Scalars['DateTime']>;
};

export type Model = {
    __typename?: 'Model';
    idModel: Scalars['ID'];
    DateCreated: Scalars['DateTime'];
    VCreationMethod: Vocabulary;
    Master: Scalars['Boolean'];
    Authoritative: Scalars['Boolean'];
    VModality: Vocabulary;
    VUnits: Vocabulary;
    VPurpose: Vocabulary;
    AssetThumbnail?: Maybe<Asset>;
    Orientation?: Maybe<Orientation>;
};

export type Orientation = {
    __typename?: 'Orientation';
    TS0?: Maybe<Scalars['Float']>;
    TS1?: Maybe<Scalars['Float']>;
    TS2?: Maybe<Scalars['Float']>;
    R0?: Maybe<Scalars['Float']>;
    R1?: Maybe<Scalars['Float']>;
    R2?: Maybe<Scalars['Float']>;
    R3?: Maybe<Scalars['Float']>;
};

export type ModelGeometryFile = {
    __typename?: 'ModelGeometryFile';
    idModelGeometryFile: Scalars['ID'];
    Model: Model;
    Asset: Asset;
    VModelFileType: Vocabulary;
    Roughness?: Maybe<Scalars['Float']>;
    Metalness?: Maybe<Scalars['Float']>;
    PointCount?: Maybe<Scalars['Int']>;
    FaceCount?: Maybe<Scalars['Int']>;
    IsWatertight?: Maybe<Scalars['Boolean']>;
    HasNormals?: Maybe<Scalars['Boolean']>;
    HasVertexColor?: Maybe<Scalars['Boolean']>;
    HasUvSpace?: Maybe<Scalars['Boolean']>;
    BoundingBoxP1X?: Maybe<Scalars['Float']>;
    BoundingBoxP1Y?: Maybe<Scalars['Float']>;
    BoundingBoxP1Z?: Maybe<Scalars['Float']>;
    BoundingBoxP2X?: Maybe<Scalars['Float']>;
    BoundingBoxP2Y?: Maybe<Scalars['Float']>;
    BoundingBoxP2Z?: Maybe<Scalars['Float']>;
};

export type ModelProcessingAction = {
    __typename?: 'ModelProcessingAction';
    idModelProcessingAction: Scalars['ID'];
    Model: Model;
    Actor: Actor;
    DateProcessed: Scalars['DateTime'];
    ToolsUsed: Scalars['String'];
    Description: Scalars['String'];
    ModelProcessingActionStep?: Maybe<Array<Maybe<ModelProcessingActionStep>>>;
};

export type ModelProcessingActionStep = {
    __typename?: 'ModelProcessingActionStep';
    idModelProcessingActionStep: Scalars['ID'];
    ModelProcessingAction: ModelProcessingAction;
    VActionMethod: Vocabulary;
    Description: Scalars['String'];
};

export type ModelUvMapFile = {
    __typename?: 'ModelUVMapFile';
    idModelUVMapFile: Scalars['ID'];
    ModelGeometryFile: ModelGeometryFile;
    Asset: Asset;
    UVMapEdgeLength: Scalars['Int'];
    ModelUVMapChannel?: Maybe<Array<Maybe<ModelUvMapChannel>>>;
};

export type ModelUvMapChannel = {
    __typename?: 'ModelUVMapChannel';
    idModelUVMapChannel: Scalars['ID'];
    ModelUvMapFile: ModelUvMapFile;
    ChannelPosition: Scalars['Int'];
    ChannelWidth: Scalars['Int'];
    VUVMapType: Vocabulary;
};

export type Scene = {
    __typename?: 'Scene';
    idScene: Scalars['ID'];
    Name: Scalars['String'];
    AssetThumbnail?: Maybe<Asset>;
    IsOriented: Scalars['Boolean'];
    HasBeenQCd: Scalars['Boolean'];
    Model?: Maybe<Array<Maybe<Model>>>;
};

export type Actor = {
    __typename?: 'Actor';
    idActor: Scalars['ID'];
    IndividualName?: Maybe<Scalars['String']>;
    OrganizationName?: Maybe<Scalars['String']>;
    Unit?: Maybe<Unit>;
};

export type IntermediaryFile = {
    __typename?: 'IntermediaryFile';
    idIntermediaryFile: Scalars['ID'];
    Asset: Asset;
    DateCreated: Scalars['DateTime'];
};

export type Unit = {
    __typename?: 'Unit';
    idUnit: Scalars['ID'];
    Name: Scalars['String'];
    Abbreviation?: Maybe<Scalars['String']>;
    ARKPrefix?: Maybe<Scalars['String']>;
    Subject?: Maybe<Array<Maybe<Subject>>>;
    Actor?: Maybe<Array<Maybe<Actor>>>;
};

export type Project = {
    __typename?: 'Project';
    idProject: Scalars['ID'];
    Name: Scalars['String'];
    Description?: Maybe<Scalars['String']>;
    ProjectDocumentation?: Maybe<Array<Maybe<ProjectDocumentation>>>;
};

export type ProjectDocumentation = {
    __typename?: 'ProjectDocumentation';
    idProjectDocumentation: Scalars['ID'];
    Project: Project;
    Name: Scalars['String'];
    Description: Scalars['String'];
};

export type Stakeholder = {
    __typename?: 'Stakeholder';
    idStakeholder: Scalars['ID'];
    IndividualName: Scalars['String'];
    OrganizationName: Scalars['String'];
    EmailAddress?: Maybe<Scalars['String']>;
    PhoneNumberMobile?: Maybe<Scalars['String']>;
    PhoneNumberOffice?: Maybe<Scalars['String']>;
    MailingAddress?: Maybe<Scalars['String']>;
};

export type GeoLocation = {
    __typename?: 'GeoLocation';
    idGeoLocation: Scalars['ID'];
    Latitude?: Maybe<Scalars['Float']>;
    Longitude?: Maybe<Scalars['Float']>;
    Altitude?: Maybe<Scalars['Float']>;
    TS0?: Maybe<Scalars['Float']>;
    TS1?: Maybe<Scalars['Float']>;
    TS2?: Maybe<Scalars['Float']>;
    R0?: Maybe<Scalars['Float']>;
    R1?: Maybe<Scalars['Float']>;
    R2?: Maybe<Scalars['Float']>;
    R3?: Maybe<Scalars['Float']>;
    Item?: Maybe<Array<Maybe<Item>>>;
    Subject?: Maybe<Array<Maybe<Subject>>>;
};

export type Subject = {
    __typename?: 'Subject';
    idSubject: Scalars['ID'];
    Unit?: Maybe<Unit>;
    AssetThumbnail?: Maybe<Asset>;
    Name: Scalars['String'];
    GeoLocation?: Maybe<GeoLocation>;
    Item?: Maybe<Array<Maybe<Item>>>;
};

export type Item = {
    __typename?: 'Item';
    idItem: Scalars['ID'];
    Subject?: Maybe<Subject>;
    AssetThumbnail?: Maybe<Asset>;
    GeoLocation?: Maybe<GeoLocation>;
    Name: Scalars['String'];
    EntireSubject: Scalars['Boolean'];
};

export type User = {
    __typename?: 'User';
    idUser: Scalars['ID'];
    Name: Scalars['String'];
    EmailAddress: Scalars['String'];
    SecurityID: Scalars['String'];
    Active: Scalars['Boolean'];
    DateActivated: Scalars['DateTime'];
    DateDisabled?: Maybe<Scalars['DateTime']>;
    WorkflowNotificationTime?: Maybe<Scalars['DateTime']>;
    EmailSettings?: Maybe<Scalars['Int']>;
    UserPersonalizationSystemObject?: Maybe<Array<Maybe<UserPersonalizationSystemObject>>>;
    UserPersonalizationUrl?: Maybe<Array<Maybe<UserPersonalizationUrl>>>;
    LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
};

export type UserPersonalizationSystemObject = {
    __typename?: 'UserPersonalizationSystemObject';
    idUserPersonalizationSystemObject: Scalars['ID'];
    User?: Maybe<User>;
    Personalization?: Maybe<Scalars['String']>;
};

export type UserPersonalizationUrl = {
    __typename?: 'UserPersonalizationUrl';
    idUserPersonalizationUrl: Scalars['ID'];
    User?: Maybe<User>;
    URL: Scalars['String'];
    Personalization: Scalars['String'];
};

export type Vocabulary = {
    __typename?: 'Vocabulary';
    idVocabulary: Scalars['ID'];
    VocabularySet: VocabularySet;
    SortOrder: Scalars['Int'];
};

export type VocabularySet = {
    __typename?: 'VocabularySet';
    idVocabularySet: Scalars['ID'];
    Name: Scalars['String'];
    SystemMaintained: Scalars['Boolean'];
};

export type Query = {
    __typename?: 'Query';
    getAsset: GetAssetResult;
    getCaptureData: GetCaptureDataResult;
    getLicense: GetLicenseResult;
    getUnit: GetUnitResult;
    getUser: GetUserResult;
    getVocabulary: GetVocabularyResult;
};

export type QueryGetAssetArgs = {
    input: GetAssetInput;
};

export type QueryGetCaptureDataArgs = {
    input: GetCaptureDataInput;
};

export type QueryGetLicenseArgs = {
    input: GetLicenseInput;
};

export type QueryGetUnitArgs = {
    input: GetUnitInput;
};

export type QueryGetUserArgs = {
    input: GetUserInput;
};

export type QueryGetVocabularyArgs = {
    input: GetVocabularyInput;
};

export type GetAssetInput = {
    idAsset: Scalars['ID'];
};

export type GetAssetResult = {
    __typename?: 'GetAssetResult';
    Asset?: Maybe<Asset>;
};

export type GetCaptureDataInput = {
    idCaptureData: Scalars['ID'];
};

export type GetCaptureDataResult = {
    __typename?: 'GetCaptureDataResult';
    CaptureData?: Maybe<CaptureData>;
};

export type GetLicenseInput = {
    idLicense: Scalars['ID'];
};

export type GetLicenseResult = {
    __typename?: 'GetLicenseResult';
    License?: Maybe<License>;
};

export type GetUnitInput = {
    idUnit: Scalars['ID'];
};

export type GetUnitResult = {
    __typename?: 'GetUnitResult';
    Unit?: Maybe<Unit>;
};

export type GetUserInput = {
    idUser: Scalars['ID'];
};

export type GetUserResult = {
    __typename?: 'GetUserResult';
    User?: Maybe<User>;
};

export type GetVocabularyInput = {
    idVocabulary: Scalars['ID'];
};

export type GetVocabularyResult = {
    __typename?: 'GetVocabularyResult';
    Vocabulary?: Maybe<Vocabulary>;
};
