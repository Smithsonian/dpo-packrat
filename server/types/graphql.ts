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
    id: Scalars['ID'];
    fileName: Scalars['String'];
    filePath: Scalars['String'];
    assetGroups?: Maybe<AssetGroup>;
    captureDataFiles?: Maybe<Array<Maybe<CaptureDataFile>>>;
    scenes?: Maybe<Array<Maybe<Scene>>>;
    intermediaryFiles?: Maybe<Array<Maybe<IntermediaryFile>>>;
};

export type AssetVersion = {
    __typename?: 'AssetVersion';
    id: Scalars['ID'];
    asset: Asset;
    userCreator: User;
    creationDate: Scalars['DateTime'];
    storageLocation: Scalars['String'];
    storageChecksum: Scalars['String'];
    storageSize: Scalars['Int'];
    assets?: Maybe<Array<Maybe<Asset>>>;
};

export type AssetGroup = {
    __typename?: 'AssetGroup';
    id: Scalars['ID'];
    assets: Array<Maybe<Asset>>;
};

export type CaptureData = {
    __typename?: 'CaptureData';
    id: Scalars['ID'];
    vCaptureMethod: Vocabulary;
    vCaptureDatasetType: Vocabulary;
    captureDate: Scalars['DateTime'];
    description: Scalars['String'];
    captureDatasetFieldId?: Maybe<Scalars['Int']>;
    vItemPositionType?: Maybe<Vocabulary>;
    itemPositionFieldId?: Maybe<Scalars['Int']>;
    itemArrangementFieldId?: Maybe<Scalars['Int']>;
    vFocusType?: Maybe<Vocabulary>;
    vLightSourceType?: Maybe<Vocabulary>;
    vBackgroundRemovalMethod?: Maybe<Vocabulary>;
    vClusterType?: Maybe<Vocabulary>;
    clusterGeometryFieldId?: Maybe<Scalars['Int']>;
    cameraSettingsUniform?: Maybe<Scalars['Boolean']>;
    assetThumbnail?: Maybe<Asset>;
    captureDataGroups?: Maybe<Array<Maybe<CaptureDataGroup>>>;
    captureDataFiles?: Maybe<Array<Maybe<CaptureDataFile>>>;
};

export type CaptureDataFile = {
    __typename?: 'CaptureDataFile';
    id: Scalars['ID'];
    captureData: CaptureData;
    asset: Asset;
    vVariantType: Vocabulary;
    compressedMultipleFiles: Scalars['Boolean'];
};

export type CaptureDataGroup = {
    __typename?: 'CaptureDataGroup';
    id: Scalars['ID'];
    captureDatas?: Maybe<Array<Maybe<CaptureData>>>;
};

export type Licence = {
    __typename?: 'Licence';
    id: Scalars['ID'];
    name: Scalars['String'];
    description: Scalars['String'];
    licenceAssignments?: Maybe<Array<Maybe<LicenceAssignment>>>;
};

export type LicenceAssignment = {
    __typename?: 'LicenceAssignment';
    id: Scalars['ID'];
    licence: Licence;
    userCreators?: Maybe<User>;
    dateStart?: Maybe<Scalars['DateTime']>;
    dateEnd?: Maybe<Scalars['DateTime']>;
};

export type Model = {
    __typename?: 'Model';
    id: Scalars['ID'];
    dateCreated: Scalars['DateTime'];
    vCreationMethod: Vocabulary;
    master: Scalars['Boolean'];
    authoritative: Scalars['Boolean'];
    vModality: Vocabulary;
    vUnits: Vocabulary;
    vPurpose: Vocabulary;
    assetThumbnail?: Maybe<Asset>;
    orientation?: Maybe<Orientation>;
};

export type Orientation = {
    __typename?: 'Orientation';
    ts0?: Maybe<Scalars['Float']>;
    ts1?: Maybe<Scalars['Float']>;
    ts2?: Maybe<Scalars['Float']>;
    r0?: Maybe<Scalars['Float']>;
    r1?: Maybe<Scalars['Float']>;
    r2?: Maybe<Scalars['Float']>;
    r3?: Maybe<Scalars['Float']>;
};

export type ModelGeometryFile = {
    __typename?: 'ModelGeometryFile';
    id: Scalars['ID'];
    model: Model;
    asset: Asset;
    vModelFileType: Vocabulary;
    roughness?: Maybe<Scalars['Float']>;
    metalness?: Maybe<Scalars['Float']>;
    pointCount?: Maybe<Scalars['Int']>;
    faceCount?: Maybe<Scalars['Int']>;
    isWatertight?: Maybe<Scalars['Boolean']>;
    hasNormals?: Maybe<Scalars['Boolean']>;
    hasVertexColor?: Maybe<Scalars['Boolean']>;
    hasUvSpace?: Maybe<Scalars['Boolean']>;
    boundingBoxP1X?: Maybe<Scalars['Float']>;
    boundingBoxP1Y?: Maybe<Scalars['Float']>;
    boundingBoxP1Z?: Maybe<Scalars['Float']>;
    boundingBoxP2X?: Maybe<Scalars['Float']>;
    boundingBoxP2Y?: Maybe<Scalars['Float']>;
    boundingBoxP2Z?: Maybe<Scalars['Float']>;
};

export type ModelProcessingAction = {
    __typename?: 'ModelProcessingAction';
    id: Scalars['ID'];
    model: Model;
    actor: Actor;
    processingDate: Scalars['DateTime'];
    toolsUsed: Scalars['String'];
    description: Scalars['String'];
    modelProcessingActionSteps?: Maybe<Array<Maybe<ModelProcessingActionStep>>>;
};

export type ModelProcessingActionStep = {
    __typename?: 'ModelProcessingActionStep';
    id: Scalars['ID'];
    modelProcessingAction: ModelProcessingAction;
    vActionMethod: Vocabulary;
    description: Scalars['String'];
};

export type ModelUvMapFile = {
    __typename?: 'ModelUVMapFile';
    id: Scalars['ID'];
    modelGeometryFile: ModelGeometryFile;
    asset: Asset;
    uVMapEdgeLength: Scalars['Int'];
    modelUVMapChannel?: Maybe<Array<Maybe<ModelUvMapChannel>>>;
};

export type ModelUvMapChannel = {
    __typename?: 'ModelUVMapChannel';
    id: Scalars['ID'];
    modelUvMapFile: ModelUvMapFile;
    channelPosition: Scalars['Int'];
    channelWidth: Scalars['Int'];
    vUVMapType: Vocabulary;
};

export type Scene = {
    __typename?: 'Scene';
    id: Scalars['ID'];
    name: Scalars['String'];
    assetThumbnail?: Maybe<Asset>;
    isOriented: Scalars['Boolean'];
    hasBeenQCd: Scalars['Boolean'];
    models?: Maybe<Array<Maybe<Model>>>;
};

export type Actor = {
    __typename?: 'Actor';
    id: Scalars['ID'];
    individualName?: Maybe<Scalars['String']>;
    organizationName?: Maybe<Scalars['String']>;
    unit?: Maybe<Unit>;
};

export type IntermediaryFile = {
    __typename?: 'IntermediaryFile';
    id: Scalars['ID'];
    asset: Asset;
    dateCreated: Scalars['DateTime'];
};

export type Unit = {
    __typename?: 'Unit';
    id: Scalars['ID'];
    name: Scalars['String'];
    abbreviation?: Maybe<Scalars['String']>;
    subjects?: Maybe<Array<Maybe<Subject>>>;
    actors?: Maybe<Array<Maybe<Actor>>>;
};

export type Project = {
    __typename?: 'Project';
    id: Scalars['ID'];
    name: Scalars['String'];
    description?: Maybe<Scalars['String']>;
    documentations?: Maybe<Array<Maybe<ProjectDocumentation>>>;
};

export type ProjectDocumentation = {
    __typename?: 'ProjectDocumentation';
    id: Scalars['ID'];
    project: Project;
    name: Scalars['String'];
    description: Scalars['String'];
};

export type Stakeholder = {
    __typename?: 'Stakeholder';
    id: Scalars['ID'];
    individualName: Scalars['String'];
    organizationName: Scalars['String'];
    emailAddress?: Maybe<Scalars['String']>;
    phoneNumberMobile?: Maybe<Scalars['String']>;
    phoneNumberOffice?: Maybe<Scalars['String']>;
    mailingAddress?: Maybe<Scalars['String']>;
};

export type Geolocation = {
    __typename?: 'Geolocation';
    id: Scalars['ID'];
    latitude: Scalars['Float'];
    longitude: Scalars['Float'];
    altitude: Scalars['Float'];
    ts0: Scalars['Float'];
    ts1: Scalars['Float'];
    ts2: Scalars['Float'];
    r0: Scalars['Float'];
    r1: Scalars['Float'];
    r2: Scalars['Float'];
    r3: Scalars['Float'];
    items?: Maybe<Array<Maybe<Item>>>;
    subjects?: Maybe<Array<Maybe<Subject>>>;
};

export type Subject = {
    __typename?: 'Subject';
    id: Scalars['ID'];
    unit: Unit;
    assetThumbnail?: Maybe<Asset>;
    name: Scalars['String'];
    geolocation?: Maybe<Geolocation>;
    items?: Maybe<Array<Maybe<Item>>>;
};

export type Item = {
    __typename?: 'Item';
    id: Scalars['ID'];
    subject: Subject;
    assetThumbnail?: Maybe<Asset>;
    geolocation?: Maybe<Geolocation>;
    name: Scalars['String'];
    entireSubject: Scalars['Boolean'];
};

export type User = {
    __typename?: 'User';
    id: Scalars['ID'];
    name: Scalars['String'];
    emailAddress: Scalars['String'];
    securityId: Scalars['String'];
    active: Scalars['Boolean'];
    dateActivated: Scalars['DateTime'];
    dateDisabled?: Maybe<Scalars['DateTime']>;
    workflowNotificationTime?: Maybe<Scalars['DateTime']>;
    emailSettings?: Maybe<Scalars['Int']>;
    userPersonalizationSystemObjects?: Maybe<Array<Maybe<UserPersonalizationSystemObject>>>;
    userPersonalizationUrls?: Maybe<Array<Maybe<UserPersonalizationUrl>>>;
    licenceAssignments?: Maybe<Array<Maybe<LicenceAssignment>>>;
};

export type UserPersonalizationSystemObject = {
    __typename?: 'UserPersonalizationSystemObject';
    id: Scalars['ID'];
    user: User;
    personalization?: Maybe<Scalars['String']>;
};

export type UserPersonalizationUrl = {
    __typename?: 'UserPersonalizationUrl';
    id: Scalars['ID'];
    user: User;
    url: Scalars['String'];
    personalization: Scalars['String'];
};

export type Vocabulary = {
    __typename?: 'Vocabulary';
    id: Scalars['ID'];
    vocabularySet: VocabularySet;
    sortOrder: Scalars['Int'];
};

export type VocabularySet = {
    __typename?: 'VocabularySet';
    id: Scalars['ID'];
    name: Scalars['String'];
    systemMaintained: Scalars['Boolean'];
};

export type Query = {
    __typename?: 'Query';
    getUser: GetUserResult;
};


export type QueryGetUserArgs = {
    input: GetUserInput;
};

export type GetUserInput = {
    id: Scalars['ID'];
};

export type GetUserResult = {
    __typename?: 'GetUserResult';
    user?: Maybe<User>;
};
