export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigInt: any;
  DateTime: any;
  JSON: any;
  Upload: any;
};

export type AccessAction = {
  __typename?: 'AccessAction';
  AccessRole?: Maybe<Array<Maybe<AccessRole>>>;
  Name: Scalars['String'];
  SortOrder: Scalars['Int'];
  idAccessAction: Scalars['Int'];
};

export type AccessContext = {
  __typename?: 'AccessContext';
  AccessContextObject?: Maybe<Array<Maybe<AccessContextObject>>>;
  AccessPolicy?: Maybe<Array<Maybe<AccessPolicy>>>;
  Authoritative: Scalars['Boolean'];
  CaptureData: Scalars['Boolean'];
  Global: Scalars['Boolean'];
  IntermediaryFile: Scalars['Boolean'];
  Model: Scalars['Boolean'];
  Scene: Scalars['Boolean'];
  idAccessContext: Scalars['Int'];
};

export type AccessContextObject = {
  __typename?: 'AccessContextObject';
  AccessContext?: Maybe<AccessContext>;
  SystemObject?: Maybe<SystemObject>;
  idAccessContext: Scalars['Int'];
  idAccessContextObject: Scalars['Int'];
  idSystemObject: Scalars['Int'];
};

export type AccessPolicy = {
  __typename?: 'AccessPolicy';
  AccessContext?: Maybe<AccessContext>;
  AccessRole?: Maybe<AccessRole>;
  User?: Maybe<User>;
  idAccessContext: Scalars['Int'];
  idAccessPolicy: Scalars['Int'];
  idAccessRole: Scalars['Int'];
  idUser: Scalars['Int'];
};

export type AccessRole = {
  __typename?: 'AccessRole';
  AccessAction?: Maybe<Array<Maybe<AccessAction>>>;
  Name: Scalars['String'];
  idAccessRole: Scalars['Int'];
};

export type Actor = {
  __typename?: 'Actor';
  IndividualName?: Maybe<Scalars['String']>;
  OrganizationName?: Maybe<Scalars['String']>;
  SystemObject?: Maybe<SystemObject>;
  Unit?: Maybe<Unit>;
  idActor: Scalars['Int'];
  idUnit?: Maybe<Scalars['Int']>;
};

export type ActorDetailFields = {
  __typename?: 'ActorDetailFields';
  OrganizationName?: Maybe<Scalars['String']>;
};

export type ActorDetailFieldsInput = {
  OrganizationName?: InputMaybe<Scalars['String']>;
};

export type AreCameraSettingsUniformInput = {
  idAssetVersion: Scalars['Int'];
};

export type AreCameraSettingsUniformResult = {
  __typename?: 'AreCameraSettingsUniformResult';
  isUniform: Scalars['Boolean'];
};

export type Asset = {
  __typename?: 'Asset';
  AssetGroup?: Maybe<AssetGroup>;
  AssetVersion?: Maybe<Array<Maybe<AssetVersion>>>;
  FileName: Scalars['String'];
  StorageKey?: Maybe<Scalars['String']>;
  SystemObject?: Maybe<SystemObject>;
  SystemObjectSource?: Maybe<SystemObject>;
  VAssetType?: Maybe<Vocabulary>;
  idAsset: Scalars['Int'];
  idAssetGroup?: Maybe<Scalars['Int']>;
  idSystemObject?: Maybe<Scalars['Int']>;
  idVAssetType?: Maybe<Scalars['Int']>;
};

export type AssetDetailFields = {
  __typename?: 'AssetDetailFields';
  Asset?: Maybe<Asset>;
  AssetType?: Maybe<Scalars['Int']>;
  idAsset?: Maybe<Scalars['Int']>;
};

export type AssetDetailFieldsInput = {
  AssetType?: InputMaybe<Scalars['Int']>;
};

export type AssetGroup = {
  __typename?: 'AssetGroup';
  Asset?: Maybe<Array<Maybe<Asset>>>;
  idAssetGroup: Scalars['Int'];
};

export type AssetVersion = {
  __typename?: 'AssetVersion';
  Asset?: Maybe<Asset>;
  Comment?: Maybe<Scalars['String']>;
  DateCreated: Scalars['DateTime'];
  FileName: Scalars['String'];
  FilePath: Scalars['String'];
  Ingested?: Maybe<Scalars['Boolean']>;
  SOAttachment?: Maybe<SystemObject>;
  SOAttachmentObjectType?: Maybe<Scalars['Int']>;
  StorageHash: Scalars['String'];
  StorageKeyStaging: Scalars['String'];
  StorageSize: Scalars['BigInt'];
  SystemObject?: Maybe<SystemObject>;
  User?: Maybe<User>;
  Version: Scalars['Int'];
  idAsset: Scalars['Int'];
  idAssetVersion: Scalars['Int'];
  idSOAttachment?: Maybe<Scalars['Int']>;
  idUserCreator: Scalars['Int'];
};

export type AssetVersionContent = {
  __typename?: 'AssetVersionContent';
  all: Array<Scalars['String']>;
  folders: Array<Scalars['String']>;
  idAssetVersion: Scalars['Int'];
};

export type AssetVersionDetailFields = {
  __typename?: 'AssetVersionDetailFields';
  AssetVersion?: Maybe<AssetVersion>;
  Creator?: Maybe<Scalars['String']>;
  DateCreated?: Maybe<Scalars['DateTime']>;
  FilePath?: Maybe<Scalars['String']>;
  Ingested?: Maybe<Scalars['Boolean']>;
  StorageHash?: Maybe<Scalars['String']>;
  StorageSize?: Maybe<Scalars['BigInt']>;
  Version?: Maybe<Scalars['Int']>;
  idAsset?: Maybe<Scalars['Int']>;
  idAssetVersion?: Maybe<Scalars['Int']>;
};

export type AssetVersionDetailFieldsInput = {
  Creator?: InputMaybe<Scalars['String']>;
  DateCreated?: InputMaybe<Scalars['DateTime']>;
  FilePath?: InputMaybe<Scalars['String']>;
  Ingested?: InputMaybe<Scalars['Boolean']>;
  StorageHash?: InputMaybe<Scalars['String']>;
  StorageSize?: InputMaybe<Scalars['BigInt']>;
  Version?: InputMaybe<Scalars['Int']>;
};

export type AssignLicenseInput = {
  idLicense: Scalars['Int'];
  idSystemObject: Scalars['Int'];
};

export type AssignLicenseResult = {
  __typename?: 'AssignLicenseResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type CaptureData = {
  __typename?: 'CaptureData';
  AssetThumbnail?: Maybe<Asset>;
  CaptureDataFile?: Maybe<Array<Maybe<CaptureDataFile>>>;
  CaptureDataGroup?: Maybe<Array<Maybe<CaptureDataGroup>>>;
  CaptureDataPhoto?: Maybe<Array<Maybe<CaptureDataPhoto>>>;
  DateCaptured: Scalars['DateTime'];
  Description: Scalars['String'];
  SystemObject?: Maybe<SystemObject>;
  VCaptureMethod?: Maybe<Vocabulary>;
  idAssetThumbnail?: Maybe<Scalars['Int']>;
  idCaptureData: Scalars['Int'];
  idVCaptureMethod: Scalars['Int'];
};

export type CaptureDataDetailFields = {
  __typename?: 'CaptureDataDetailFields';
  backgroundRemovalMethod?: Maybe<Scalars['Int']>;
  cameraSettingUniform?: Maybe<Scalars['Boolean']>;
  captureMethod?: Maybe<Scalars['Int']>;
  clusterGeometryFieldId?: Maybe<Scalars['Int']>;
  clusterType?: Maybe<Scalars['Int']>;
  datasetFieldId?: Maybe<Scalars['Int']>;
  datasetType?: Maybe<Scalars['Int']>;
  datasetUse: Scalars['String'];
  dateCaptured?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  focusType?: Maybe<Scalars['Int']>;
  folders: Array<IngestFolder>;
  isValidData?: Maybe<Scalars['Boolean']>;
  itemArrangementFieldId?: Maybe<Scalars['Int']>;
  itemPositionFieldId?: Maybe<Scalars['Int']>;
  itemPositionType?: Maybe<Scalars['Int']>;
  lightsourceType?: Maybe<Scalars['Int']>;
  systemCreated?: Maybe<Scalars['Boolean']>;
};

export type CaptureDataDetailFieldsInput = {
  backgroundRemovalMethod?: InputMaybe<Scalars['Int']>;
  cameraSettingUniform?: InputMaybe<Scalars['Boolean']>;
  captureMethod?: InputMaybe<Scalars['Int']>;
  clusterGeometryFieldId?: InputMaybe<Scalars['Int']>;
  clusterType?: InputMaybe<Scalars['Int']>;
  datasetFieldId?: InputMaybe<Scalars['Int']>;
  datasetType?: InputMaybe<Scalars['Int']>;
  datasetUse: Scalars['String'];
  dateCaptured?: InputMaybe<Scalars['DateTime']>;
  description?: InputMaybe<Scalars['String']>;
  focusType?: InputMaybe<Scalars['Int']>;
  folders: Array<IngestFolderInput>;
  isValidData?: InputMaybe<Scalars['Boolean']>;
  itemArrangementFieldId?: InputMaybe<Scalars['Int']>;
  itemPositionFieldId?: InputMaybe<Scalars['Int']>;
  itemPositionType?: InputMaybe<Scalars['Int']>;
  lightsourceType?: InputMaybe<Scalars['Int']>;
  systemCreated?: InputMaybe<Scalars['Boolean']>;
};

export type CaptureDataFile = {
  __typename?: 'CaptureDataFile';
  Asset?: Maybe<Asset>;
  CaptureData?: Maybe<CaptureData>;
  CompressedMultipleFiles: Scalars['Boolean'];
  VVariantType?: Maybe<Vocabulary>;
  idAsset: Scalars['Int'];
  idCaptureData: Scalars['Int'];
  idCaptureDataFile: Scalars['Int'];
  idVVariantType: Scalars['Int'];
};

export type CaptureDataGroup = {
  __typename?: 'CaptureDataGroup';
  CaptureData?: Maybe<Array<Maybe<CaptureData>>>;
  idCaptureDataGroup: Scalars['Int'];
};

export type CaptureDataPhoto = {
  __typename?: 'CaptureDataPhoto';
  CameraSettingsUniform?: Maybe<Scalars['Boolean']>;
  CaptureData?: Maybe<CaptureData>;
  CaptureDatasetFieldID?: Maybe<Scalars['Int']>;
  CaptureDatasetUse: Scalars['String'];
  ClusterGeometryFieldID?: Maybe<Scalars['Int']>;
  ItemArrangementFieldID?: Maybe<Scalars['Int']>;
  ItemPositionFieldID?: Maybe<Scalars['Int']>;
  VBackgroundRemovalMethod?: Maybe<Vocabulary>;
  VCaptureDatasetType?: Maybe<Vocabulary>;
  VClusterType?: Maybe<Vocabulary>;
  VFocusType?: Maybe<Vocabulary>;
  VItemPositionType?: Maybe<Vocabulary>;
  VLightSourceType?: Maybe<Vocabulary>;
  idCaptureData: Scalars['Int'];
  idCaptureDataPhoto: Scalars['Int'];
  idVBackgroundRemovalMethod?: Maybe<Scalars['Int']>;
  idVCaptureDatasetType: Scalars['Int'];
  idVClusterType?: Maybe<Scalars['Int']>;
  idVFocusType?: Maybe<Scalars['Int']>;
  idVItemPositionType?: Maybe<Scalars['Int']>;
  idVLightSourceType?: Maybe<Scalars['Int']>;
};

export type ClearLicenseAssignmentInput = {
  clearAll?: InputMaybe<Scalars['Boolean']>;
  idSystemObject: Scalars['Int'];
};

export type ClearLicenseAssignmentResult = {
  __typename?: 'ClearLicenseAssignmentResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type ColumnDefinition = {
  __typename?: 'ColumnDefinition';
  colAlign: Scalars['String'];
  colDisplay: Scalars['Boolean'];
  colLabel: Scalars['String'];
  colName: Scalars['String'];
  colType: Scalars['Int'];
};

export type CreateCaptureDataInput = {
  DateCaptured: Scalars['DateTime'];
  Description: Scalars['String'];
  Name: Scalars['String'];
  idAssetThumbnail?: InputMaybe<Scalars['Int']>;
  idVCaptureMethod: Scalars['Int'];
};

export type CreateCaptureDataPhotoInput = {
  CameraSettingsUniform: Scalars['Boolean'];
  CaptureDatasetFieldID: Scalars['Int'];
  CaptureDatasetUse: Scalars['String'];
  ClusterGeometryFieldID: Scalars['Int'];
  ItemArrangementFieldID: Scalars['Int'];
  ItemPositionFieldID: Scalars['Int'];
  idCaptureData: Scalars['Int'];
  idVBackgroundRemovalMethod: Scalars['Int'];
  idVCaptureDatasetType: Scalars['Int'];
  idVClusterType?: InputMaybe<Scalars['Int']>;
  idVFocusType?: InputMaybe<Scalars['Int']>;
  idVItemPositionType?: InputMaybe<Scalars['Int']>;
  idVLightSourceType?: InputMaybe<Scalars['Int']>;
};

export type CreateCaptureDataPhotoResult = {
  __typename?: 'CreateCaptureDataPhotoResult';
  CaptureDataPhoto?: Maybe<CaptureDataPhoto>;
};

export type CreateCaptureDataResult = {
  __typename?: 'CreateCaptureDataResult';
  CaptureData?: Maybe<CaptureData>;
};

export type CreateGeoLocationInput = {
  Altitude?: InputMaybe<Scalars['Int']>;
  Latitude?: InputMaybe<Scalars['Int']>;
  Longitude?: InputMaybe<Scalars['Int']>;
  R0?: InputMaybe<Scalars['Int']>;
  R1?: InputMaybe<Scalars['Int']>;
  R2?: InputMaybe<Scalars['Int']>;
  R3?: InputMaybe<Scalars['Int']>;
  TS0?: InputMaybe<Scalars['Int']>;
  TS1?: InputMaybe<Scalars['Int']>;
  TS2?: InputMaybe<Scalars['Int']>;
};

export type CreateGeoLocationResult = {
  __typename?: 'CreateGeoLocationResult';
  GeoLocation?: Maybe<GeoLocation>;
};

export type CreateIdentifierInput = {
  idSystemObject?: InputMaybe<Scalars['Int']>;
  identifierType: Scalars['Int'];
  identifierValue: Scalars['String'];
  preferred?: InputMaybe<Scalars['Boolean']>;
};

export type CreateLicenseInput = {
  Description: Scalars['String'];
  Name: Scalars['String'];
  RestrictLevel: Scalars['Int'];
};

export type CreateLicenseResult = {
  __typename?: 'CreateLicenseResult';
  License?: Maybe<License>;
};

export type CreateProjectInput = {
  Description: Scalars['String'];
  Name: Scalars['String'];
  Unit: Scalars['Int'];
};

export type CreateProjectResult = {
  __typename?: 'CreateProjectResult';
  Project?: Maybe<Project>;
};

export type CreateSubjectInput = {
  Name: Scalars['String'];
  idAssetThumbnail?: InputMaybe<Scalars['Int']>;
  idGeoLocation?: InputMaybe<Scalars['Int']>;
  idIdentifierPreferred?: InputMaybe<Scalars['Int']>;
  idUnit: Scalars['Int'];
};

export type CreateSubjectResult = {
  __typename?: 'CreateSubjectResult';
  Subject?: Maybe<Subject>;
};

export type CreateSubjectWithIdentifiersInput = {
  identifiers: Array<CreateIdentifierInput>;
  metadata?: InputMaybe<Array<MetadataInput>>;
  subject: CreateSubjectInput;
  systemCreated: Scalars['Boolean'];
};

export type CreateSubjectWithIdentifiersResult = {
  __typename?: 'CreateSubjectWithIdentifiersResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type CreateUnitInput = {
  ARKPrefix: Scalars['String'];
  Abbreviation: Scalars['String'];
  Name: Scalars['String'];
};

export type CreateUnitResult = {
  __typename?: 'CreateUnitResult';
  Unit?: Maybe<Unit>;
};

export type CreateUserInput = {
  EmailAddress: Scalars['String'];
  EmailSettings?: InputMaybe<Scalars['Int']>;
  Name: Scalars['String'];
  SecurityID?: InputMaybe<Scalars['String']>;
  SlackID: Scalars['String'];
  WorkflowNotificationTime?: InputMaybe<Scalars['DateTime']>;
};

export type CreateUserResult = {
  __typename?: 'CreateUserResult';
  User?: Maybe<User>;
};

export type CreateVocabularyInput = {
  SortOrder: Scalars['Int'];
  Term: Scalars['String'];
  idVocabularySet: Scalars['Int'];
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

export type DeleteIdentifierInput = {
  idIdentifier: Scalars['Int'];
};

export type DeleteIdentifierResult = {
  __typename?: 'DeleteIdentifierResult';
  success: Scalars['Boolean'];
};

export type DeleteMetadataInput = {
  idMetadata: Scalars['Int'];
};

export type DeleteMetadataResult = {
  __typename?: 'DeleteMetadataResult';
  success: Scalars['Boolean'];
};

export type DeleteObjectConnectionInput = {
  idSystemObjectDerived: Scalars['Int'];
  idSystemObjectMaster: Scalars['Int'];
  objectTypeDerived: Scalars['Int'];
  objectTypeMaster: Scalars['Int'];
};

export type DeleteObjectConnectionResult = {
  __typename?: 'DeleteObjectConnectionResult';
  details: Scalars['String'];
  success: Scalars['Boolean'];
};

export type DetailVersion = {
  __typename?: 'DetailVersion';
  Comment?: Maybe<Scalars['String']>;
  CommentLink?: Maybe<Scalars['String']>;
  creator: Scalars['String'];
  dateCreated: Scalars['DateTime'];
  hash: Scalars['String'];
  idAssetVersion: Scalars['Int'];
  idSystemObject: Scalars['Int'];
  ingested: Scalars['Boolean'];
  name: Scalars['String'];
  size: Scalars['BigInt'];
  version: Scalars['Int'];
};

export type DiscardUploadedAssetVersionsInput = {
  idAssetVersions: Array<Scalars['Int']>;
};

export type DiscardUploadedAssetVersionsResult = {
  __typename?: 'DiscardUploadedAssetVersionsResult';
  success: Scalars['Boolean'];
};

export type ExistingRelationship = {
  idSystemObject: Scalars['Int'];
  objectType: Scalars['Int'];
};

export type GeoLocation = {
  __typename?: 'GeoLocation';
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
  idGeoLocation: Scalars['Int'];
};

export type GetAccessPolicyInput = {
  idAccessPolicy: Scalars['Int'];
};

export type GetAccessPolicyResult = {
  __typename?: 'GetAccessPolicyResult';
  AccessPolicy?: Maybe<AccessPolicy>;
};

export type GetAllUsersInput = {
  active: User_Status;
  search: Scalars['String'];
};

export type GetAllUsersResult = {
  __typename?: 'GetAllUsersResult';
  User: Array<User>;
};

export type GetAssetDetailsForSystemObjectInput = {
  idSystemObject: Scalars['Int'];
};

export type GetAssetDetailsForSystemObjectResult = {
  __typename?: 'GetAssetDetailsForSystemObjectResult';
  assetDetailRows: Array<Scalars['JSON']>;
  columns: Array<ColumnDefinition>;
};

export type GetAssetInput = {
  idAsset: Scalars['Int'];
};

export type GetAssetResult = {
  __typename?: 'GetAssetResult';
  Asset?: Maybe<Asset>;
};

export type GetAssetVersionDetailResult = {
  __typename?: 'GetAssetVersionDetailResult';
  CaptureDataPhoto?: Maybe<IngestPhotogrammetry>;
  Item?: Maybe<Item>;
  Model?: Maybe<IngestModel>;
  Project?: Maybe<Array<Project>>;
  Scene?: Maybe<IngestScene>;
  SubjectUnitIdentifier?: Maybe<SubjectUnitIdentifier>;
  idAssetVersion: Scalars['Int'];
};

export type GetAssetVersionsDetailsInput = {
  idAssetVersions: Array<Scalars['Int']>;
};

export type GetAssetVersionsDetailsResult = {
  __typename?: 'GetAssetVersionsDetailsResult';
  Details: Array<GetAssetVersionDetailResult>;
  valid: Scalars['Boolean'];
};

export type GetCaptureDataInput = {
  idCaptureData: Scalars['Int'];
};

export type GetCaptureDataPhotoInput = {
  idCaptureDataPhoto: Scalars['Int'];
};

export type GetCaptureDataPhotoResult = {
  __typename?: 'GetCaptureDataPhotoResult';
  CaptureDataPhoto?: Maybe<CaptureDataPhoto>;
};

export type GetCaptureDataResult = {
  __typename?: 'GetCaptureDataResult';
  CaptureData?: Maybe<CaptureData>;
};

export type GetContentsForAssetVersionsInput = {
  idAssetVersions: Array<Scalars['Int']>;
};

export type GetContentsForAssetVersionsResult = {
  __typename?: 'GetContentsForAssetVersionsResult';
  AssetVersionContent: Array<AssetVersionContent>;
};

export type GetCurrentUserResult = {
  __typename?: 'GetCurrentUserResult';
  User?: Maybe<User>;
};

export type GetDetailsTabDataForObjectInput = {
  idSystemObject: Scalars['Int'];
  objectType: Scalars['Int'];
};

export type GetDetailsTabDataForObjectResult = {
  __typename?: 'GetDetailsTabDataForObjectResult';
  Actor?: Maybe<ActorDetailFields>;
  Asset?: Maybe<AssetDetailFields>;
  AssetVersion?: Maybe<AssetVersionDetailFields>;
  CaptureData?: Maybe<CaptureDataDetailFields>;
  IntermediaryFile?: Maybe<IntermediaryFileDetailFields>;
  Item?: Maybe<ItemDetailFields>;
  Model?: Maybe<ModelConstellation>;
  Project?: Maybe<ProjectDetailFields>;
  ProjectDocumentation?: Maybe<ProjectDocumentationDetailFields>;
  Scene?: Maybe<SceneDetailFields>;
  Stakeholder?: Maybe<StakeholderDetailFields>;
  Subject?: Maybe<SubjectDetailFields>;
  Unit?: Maybe<UnitDetailFields>;
};

export type GetEdanUnitsNamedResult = {
  __typename?: 'GetEdanUnitsNamedResult';
  UnitEdan?: Maybe<Array<UnitEdan>>;
};

export type GetFilterViewDataResult = {
  __typename?: 'GetFilterViewDataResult';
  projects: Array<Project>;
  units: Array<Unit>;
};

export type GetIngestTitleInput = {
  item?: InputMaybe<IngestItemInput>;
  sourceObjects?: InputMaybe<Array<RelatedObjectInput>>;
};

export type GetIngestTitleResult = {
  __typename?: 'GetIngestTitleResult';
  ingestTitle?: Maybe<IngestTitle>;
};

export type GetIngestionItemsInput = {
  idSubjects: Array<Scalars['Int']>;
};

export type GetIngestionItemsResult = {
  __typename?: 'GetIngestionItemsResult';
  IngestionItem?: Maybe<Array<IngestionItem>>;
};

export type GetIntermediaryFileInput = {
  idIntermediaryFile: Scalars['Int'];
};

export type GetIntermediaryFileResult = {
  __typename?: 'GetIntermediaryFileResult';
  IntermediaryFile?: Maybe<IntermediaryFile>;
};

export type GetItemInput = {
  idItem: Scalars['Int'];
};

export type GetItemResult = {
  __typename?: 'GetItemResult';
  Item?: Maybe<Item>;
};

export type GetItemsForSubjectInput = {
  idSubject: Scalars['Int'];
  pagination?: InputMaybe<PaginationInput>;
};

export type GetItemsForSubjectResult = {
  __typename?: 'GetItemsForSubjectResult';
  Item: Array<Item>;
};

export type GetLicenseInput = {
  idLicense: Scalars['Int'];
};

export type GetLicenseListInput = {
  search?: InputMaybe<Scalars['String']>;
};

export type GetLicenseListResult = {
  __typename?: 'GetLicenseListResult';
  Licenses: Array<License>;
};

export type GetLicenseResult = {
  __typename?: 'GetLicenseResult';
  License?: Maybe<License>;
};

export type GetModelConstellationForAssetVersionInput = {
  idAssetVersion: Scalars['Int'];
};

export type GetModelConstellationForAssetVersionResult = {
  __typename?: 'GetModelConstellationForAssetVersionResult';
  ModelConstellation?: Maybe<ModelConstellation>;
  idAssetVersion: Scalars['Int'];
};

export type GetModelConstellationInput = {
  idModel: Scalars['Int'];
};

export type GetModelConstellationResult = {
  __typename?: 'GetModelConstellationResult';
  ModelConstellation?: Maybe<ModelConstellation>;
};

export type GetModelInput = {
  idModel: Scalars['Int'];
};

export type GetModelResult = {
  __typename?: 'GetModelResult';
  Model?: Maybe<Model>;
};

export type GetObjectChildrenInput = {
  captureMethod: Array<Scalars['Int']>;
  cursorMark: Scalars['String'];
  dateCreatedFrom?: InputMaybe<Scalars['DateTime']>;
  dateCreatedTo?: InputMaybe<Scalars['DateTime']>;
  has: Array<Scalars['Int']>;
  idRoot: Scalars['Int'];
  metadataColumns: Array<Scalars['Int']>;
  missing: Array<Scalars['Int']>;
  modelFileType: Array<Scalars['Int']>;
  modelPurpose: Array<Scalars['Int']>;
  objectTypes: Array<Scalars['Int']>;
  objectsToDisplay: Array<Scalars['Int']>;
  projects: Array<Scalars['Int']>;
  rows: Scalars['Int'];
  search: Scalars['String'];
  units: Array<Scalars['Int']>;
  variantType: Array<Scalars['Int']>;
};

export type GetObjectChildrenResult = {
  __typename?: 'GetObjectChildrenResult';
  cursorMark?: Maybe<Scalars['String']>;
  entries: Array<NavigationResultEntry>;
  error?: Maybe<Scalars['String']>;
  metadataColumns: Array<Scalars['Int']>;
  success: Scalars['Boolean'];
};

export type GetObjectsForItemInput = {
  idItem: Scalars['Int'];
};

export type GetObjectsForItemResult = {
  __typename?: 'GetObjectsForItemResult';
  CaptureData: Array<CaptureData>;
  IntermediaryFile: Array<IntermediaryFile>;
  Model: Array<Model>;
  ProjectDocumentation: Array<ProjectDocumentation>;
  Scene: Array<Scene>;
};

export type GetProjectDocumentationInput = {
  idProjectDocumentation: Scalars['Int'];
};

export type GetProjectDocumentationResult = {
  __typename?: 'GetProjectDocumentationResult';
  ProjectDocumentation?: Maybe<ProjectDocumentation>;
};

export type GetProjectInput = {
  idProject: Scalars['Int'];
};

export type GetProjectListInput = {
  search: Scalars['String'];
};

export type GetProjectListResult = {
  __typename?: 'GetProjectListResult';
  projects: Array<Project>;
};

export type GetProjectResult = {
  __typename?: 'GetProjectResult';
  Project?: Maybe<Project>;
};

export type GetSceneForAssetVersionInput = {
  directory?: InputMaybe<Scalars['String']>;
  idAssetVersion: Scalars['Int'];
};

export type GetSceneForAssetVersionResult = {
  __typename?: 'GetSceneForAssetVersionResult';
  SceneConstellation?: Maybe<SceneConstellation>;
  idAssetVersion: Scalars['Int'];
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type GetSceneInput = {
  idScene: Scalars['Int'];
};

export type GetSceneResult = {
  __typename?: 'GetSceneResult';
  Scene?: Maybe<Scene>;
};

export type GetSourceObjectIdentiferInput = {
  idSystemObjects: Array<Scalars['Int']>;
};

export type GetSourceObjectIdentiferResult = {
  __typename?: 'GetSourceObjectIdentiferResult';
  sourceObjectIdentifiers: Array<SourceObjectIdentifier>;
};

export type GetSubjectInput = {
  idSubject: Scalars['Int'];
};

export type GetSubjectListInput = {
  idUnit?: InputMaybe<Scalars['Int']>;
  pageNumber?: InputMaybe<Scalars['Int']>;
  rowCount?: InputMaybe<Scalars['Int']>;
  search: Scalars['String'];
  sortBy?: InputMaybe<Scalars['Int']>;
  sortOrder?: InputMaybe<Scalars['Boolean']>;
};

export type GetSubjectListResult = {
  __typename?: 'GetSubjectListResult';
  subjects: Array<SubjectUnitIdentifier>;
};

export type GetSubjectResult = {
  __typename?: 'GetSubjectResult';
  Subject?: Maybe<Subject>;
};

export type GetSubjectsForUnitInput = {
  idUnit: Scalars['Int'];
  pagination?: InputMaybe<PaginationInput>;
};

export type GetSubjectsForUnitResult = {
  __typename?: 'GetSubjectsForUnitResult';
  Subject: Array<Subject>;
};

export type GetSystemObjectDetailsInput = {
  idSystemObject: Scalars['Int'];
};

export type GetSystemObjectDetailsResult = {
  __typename?: 'GetSystemObjectDetailsResult';
  allowed: Scalars['Boolean'];
  asset?: Maybe<RepositoryPath>;
  assetOwner?: Maybe<RepositoryPath>;
  derivedObjects: Array<RelatedObject>;
  idObject: Scalars['Int'];
  idSystemObject: Scalars['Int'];
  identifiers: Array<IngestIdentifier>;
  item?: Maybe<Array<RepositoryPath>>;
  license?: Maybe<License>;
  licenseInheritance?: Maybe<Scalars['Int']>;
  metadata: Array<Metadata>;
  name: Scalars['String'];
  objectAncestors: Array<Array<RepositoryPath>>;
  objectProperties: Array<ObjectPropertyResult>;
  objectType: Scalars['Int'];
  objectVersions: Array<SystemObjectVersion>;
  project?: Maybe<Array<RepositoryPath>>;
  publishable: Scalars['Boolean'];
  publishedEnum: Scalars['Int'];
  publishedState: Scalars['String'];
  retired: Scalars['Boolean'];
  sourceObjects: Array<RelatedObject>;
  subTitle?: Maybe<Scalars['String']>;
  subject?: Maybe<Array<RepositoryPath>>;
  thumbnail?: Maybe<Scalars['String']>;
  unit?: Maybe<Array<RepositoryPath>>;
};

export type GetUnitInput = {
  idUnit: Scalars['Int'];
};

export type GetUnitResult = {
  __typename?: 'GetUnitResult';
  Unit?: Maybe<Unit>;
};

export type GetUnitsFromEdanAbbreviationInput = {
  abbreviation: Scalars['String'];
};

export type GetUnitsFromEdanAbbreviationResult = {
  __typename?: 'GetUnitsFromEdanAbbreviationResult';
  Units: Array<Unit>;
};

export type GetUnitsFromNameSearchInput = {
  search: Scalars['String'];
};

export type GetUnitsFromNameSearchResult = {
  __typename?: 'GetUnitsFromNameSearchResult';
  Units: Array<Unit>;
};

export type GetUploadedAssetVersionResult = {
  __typename?: 'GetUploadedAssetVersionResult';
  AssetVersion: Array<AssetVersion>;
  UpdatedAssetVersionMetadata: Array<UpdatedAssetVersionMetadata>;
  idAssetVersionsUpdated: Array<Scalars['Int']>;
};

export type GetUserInput = {
  idUser?: InputMaybe<Scalars['Int']>;
};

export type GetUserResult = {
  __typename?: 'GetUserResult';
  User?: Maybe<User>;
};

export type GetVersionsForAssetInput = {
  idSystemObject: Scalars['Int'];
};

export type GetVersionsForAssetResult = {
  __typename?: 'GetVersionsForAssetResult';
  versions: Array<DetailVersion>;
};

export type GetVocabularyEntriesInput = {
  eVocabSetIDs: Array<Scalars['Int']>;
};

export type GetVocabularyEntriesResult = {
  __typename?: 'GetVocabularyEntriesResult';
  VocabularyEntries: Array<VocabularyEntry>;
};

export type GetVocabularyInput = {
  idVocabulary: Scalars['Int'];
};

export type GetVocabularyResult = {
  __typename?: 'GetVocabularyResult';
  Vocabulary?: Maybe<Vocabulary>;
};

export type GetVoyagerParamsInput = {
  idSystemObject: Scalars['Int'];
};

export type GetVoyagerParamsResult = {
  __typename?: 'GetVoyagerParamsResult';
  document?: Maybe<Scalars['String']>;
  idSystemObjectScene?: Maybe<Scalars['Int']>;
  path?: Maybe<Scalars['String']>;
};

export type GetWorkflowInput = {
  idWorkflow: Scalars['Int'];
};

export type GetWorkflowListInput = {
  DateFrom?: InputMaybe<Scalars['DateTime']>;
  DateTo?: InputMaybe<Scalars['DateTime']>;
  State?: InputMaybe<Array<Scalars['Int']>>;
  idUserInitiator?: InputMaybe<Array<Scalars['Int']>>;
  idUserOwner?: InputMaybe<Array<Scalars['Int']>>;
  idVJobType?: InputMaybe<Array<Scalars['Int']>>;
  idVWorkflowType?: InputMaybe<Array<Scalars['Int']>>;
  pageNumber?: InputMaybe<Scalars['Int']>;
  rowCount?: InputMaybe<Scalars['Int']>;
  sortBy?: InputMaybe<Scalars['Int']>;
  sortOrder?: InputMaybe<Scalars['Boolean']>;
};

export type GetWorkflowListResult = {
  __typename?: 'GetWorkflowListResult';
  WorkflowList?: Maybe<Array<Maybe<WorkflowListResult>>>;
};

export type GetWorkflowResult = {
  __typename?: 'GetWorkflowResult';
  Workflow?: Maybe<Workflow>;
};

export type Identifier = {
  __typename?: 'Identifier';
  IdentifierValue: Scalars['String'];
  SystemObject?: Maybe<SystemObject>;
  VIdentifierType?: Maybe<Vocabulary>;
  idIdentifier: Scalars['Int'];
  idSystemObject?: Maybe<Scalars['Int']>;
  idVIdentifierType?: Maybe<Scalars['Int']>;
};

export type IngestDataInput = {
  item: IngestItemInput;
  model: Array<IngestModelInput>;
  other: Array<IngestOtherInput>;
  photogrammetry: Array<IngestPhotogrammetryInput>;
  project: IngestProjectInput;
  scene: Array<IngestSceneInput>;
  sceneAttachment: Array<IngestSceneAttachmentInput>;
  subjects: Array<IngestSubjectInput>;
};

export type IngestDataResult = {
  __typename?: 'IngestDataResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type IngestFolder = {
  __typename?: 'IngestFolder';
  name: Scalars['String'];
  variantType?: Maybe<Scalars['Int']>;
};

export type IngestFolderInput = {
  name: Scalars['String'];
  variantType?: InputMaybe<Scalars['Int']>;
};

export type IngestIdentifier = {
  __typename?: 'IngestIdentifier';
  idIdentifier: Scalars['Int'];
  identifier: Scalars['String'];
  identifierType: Scalars['Int'];
};

export type IngestIdentifierInput = {
  idIdentifier: Scalars['Int'];
  identifier: Scalars['String'];
  identifierType: Scalars['Int'];
};

export type IngestItemInput = {
  entireSubject: Scalars['Boolean'];
  id?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  subtitle: Scalars['String'];
};

export type IngestModel = {
  __typename?: 'IngestModel';
  Variant: Scalars['String'];
  creationMethod: Scalars['Int'];
  dateCreated: Scalars['String'];
  derivedObjects: Array<RelatedObject>;
  directory: Scalars['String'];
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifier>;
  modality: Scalars['Int'];
  modelFileType: Scalars['Int'];
  name: Scalars['String'];
  purpose: Scalars['Int'];
  sourceObjects: Array<RelatedObject>;
  subtitle: Scalars['String'];
  systemCreated: Scalars['Boolean'];
  units: Scalars['Int'];
};

export type IngestModelInput = {
  Variant: Scalars['String'];
  creationMethod: Scalars['Int'];
  dateCreated: Scalars['String'];
  derivedObjects: Array<RelatedObjectInput>;
  directory: Scalars['String'];
  idAsset?: InputMaybe<Scalars['Int']>;
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifierInput>;
  modality: Scalars['Int'];
  modelFileType: Scalars['Int'];
  purpose: Scalars['Int'];
  skipSceneGenerate?: InputMaybe<Scalars['Boolean']>;
  sourceObjects: Array<RelatedObjectInput>;
  subtitle: Scalars['String'];
  systemCreated: Scalars['Boolean'];
  units: Scalars['Int'];
  updateNotes?: InputMaybe<Scalars['String']>;
};

export type IngestOtherInput = {
  idAsset?: InputMaybe<Scalars['Int']>;
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifierInput>;
  systemCreated: Scalars['Boolean'];
  updateNotes?: InputMaybe<Scalars['String']>;
};

export type IngestPhotogrammetry = {
  __typename?: 'IngestPhotogrammetry';
  backgroundRemovalMethod?: Maybe<Scalars['Int']>;
  cameraSettingUniform: Scalars['Boolean'];
  clusterGeometryFieldId?: Maybe<Scalars['Int']>;
  clusterType?: Maybe<Scalars['Int']>;
  datasetFieldId?: Maybe<Scalars['Int']>;
  datasetType: Scalars['Int'];
  datasetUse: Scalars['String'];
  dateCaptured: Scalars['String'];
  derivedObjects: Array<RelatedObject>;
  description: Scalars['String'];
  directory: Scalars['String'];
  focusType?: Maybe<Scalars['Int']>;
  folders: Array<IngestFolder>;
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifier>;
  itemArrangementFieldId?: Maybe<Scalars['Int']>;
  itemPositionFieldId?: Maybe<Scalars['Int']>;
  itemPositionType?: Maybe<Scalars['Int']>;
  lightsourceType?: Maybe<Scalars['Int']>;
  name: Scalars['String'];
  sourceObjects: Array<RelatedObject>;
  systemCreated: Scalars['Boolean'];
};

export type IngestPhotogrammetryInput = {
  backgroundRemovalMethod?: InputMaybe<Scalars['Int']>;
  cameraSettingUniform: Scalars['Boolean'];
  clusterGeometryFieldId?: InputMaybe<Scalars['Int']>;
  clusterType?: InputMaybe<Scalars['Int']>;
  datasetFieldId?: InputMaybe<Scalars['Int']>;
  datasetType: Scalars['Int'];
  datasetUse: Scalars['String'];
  dateCaptured: Scalars['String'];
  derivedObjects: Array<RelatedObjectInput>;
  description: Scalars['String'];
  directory: Scalars['String'];
  focusType?: InputMaybe<Scalars['Int']>;
  folders: Array<IngestFolderInput>;
  idAsset?: InputMaybe<Scalars['Int']>;
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifierInput>;
  itemArrangementFieldId?: InputMaybe<Scalars['Int']>;
  itemPositionFieldId?: InputMaybe<Scalars['Int']>;
  itemPositionType?: InputMaybe<Scalars['Int']>;
  lightsourceType?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
  sourceObjects: Array<RelatedObjectInput>;
  systemCreated: Scalars['Boolean'];
  updateNotes?: InputMaybe<Scalars['String']>;
};

export type IngestProjectInput = {
  id: Scalars['Int'];
  name: Scalars['String'];
};

export type IngestScene = {
  __typename?: 'IngestScene';
  approvedForPublication: Scalars['Boolean'];
  derivedObjects: Array<RelatedObject>;
  directory: Scalars['String'];
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifier>;
  name: Scalars['String'];
  posedAndQCd: Scalars['Boolean'];
  referenceModels: Array<ReferenceModel>;
  sourceObjects: Array<RelatedObject>;
  subtitle: Scalars['String'];
  systemCreated: Scalars['Boolean'];
};

export type IngestSceneAttachmentInput = {
  category?: InputMaybe<Scalars['Int']>;
  dracoCompressed?: InputMaybe<Scalars['Boolean']>;
  fileType?: InputMaybe<Scalars['Int']>;
  gltfStandardized?: InputMaybe<Scalars['Boolean']>;
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifierInput>;
  modelType?: InputMaybe<Scalars['Int']>;
  systemCreated: Scalars['Boolean'];
  title?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['Int']>;
  units?: InputMaybe<Scalars['Int']>;
};

export type IngestSceneInput = {
  approvedForPublication: Scalars['Boolean'];
  derivedObjects: Array<RelatedObjectInput>;
  directory: Scalars['String'];
  idAsset?: InputMaybe<Scalars['Int']>;
  idAssetVersion: Scalars['Int'];
  identifiers: Array<IngestIdentifierInput>;
  posedAndQCd: Scalars['Boolean'];
  sourceObjects: Array<RelatedObjectInput>;
  subtitle: Scalars['String'];
  systemCreated: Scalars['Boolean'];
  updateNotes?: InputMaybe<Scalars['String']>;
};

export type IngestSubjectInput = {
  arkId: Scalars['String'];
  collectionId: Scalars['String'];
  id?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
  unit: Scalars['String'];
};

export type IngestTitle = {
  __typename?: 'IngestTitle';
  forced: Scalars['Boolean'];
  subtitle?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
};

export type IngestionItem = {
  __typename?: 'IngestionItem';
  EntireSubject: Scalars['Boolean'];
  MediaGroupName: Scalars['String'];
  ProjectName: Scalars['String'];
  idItem: Scalars['Int'];
  idProject: Scalars['Int'];
};

export type IntermediaryFile = {
  __typename?: 'IntermediaryFile';
  Asset?: Maybe<Asset>;
  DateCreated: Scalars['DateTime'];
  SystemObject?: Maybe<SystemObject>;
  idAsset: Scalars['Int'];
  idIntermediaryFile: Scalars['Int'];
};

export type IntermediaryFileDetailFields = {
  __typename?: 'IntermediaryFileDetailFields';
  idIntermediaryFile: Scalars['Int'];
};

export type Item = {
  __typename?: 'Item';
  AssetThumbnail?: Maybe<Asset>;
  EntireSubject: Scalars['Boolean'];
  GeoLocation?: Maybe<GeoLocation>;
  Name: Scalars['String'];
  Subject?: Maybe<Subject>;
  SystemObject?: Maybe<SystemObject>;
  idAssetThumbnail?: Maybe<Scalars['Int']>;
  idGeoLocation?: Maybe<Scalars['Int']>;
  idItem: Scalars['Int'];
};

export type ItemDetailFields = {
  __typename?: 'ItemDetailFields';
  EntireSubject?: Maybe<Scalars['Boolean']>;
};

export type ItemDetailFieldsInput = {
  EntireSubject?: InputMaybe<Scalars['Boolean']>;
};

export type Job = {
  __typename?: 'Job';
  Frequency?: Maybe<Scalars['String']>;
  Name: Scalars['String'];
  Status?: Maybe<Scalars['Int']>;
  VJobType?: Maybe<Vocabulary>;
  idJob: Scalars['Int'];
  idVJobType: Scalars['Int'];
};

export type JobRun = {
  __typename?: 'JobRun';
  Configuration?: Maybe<Scalars['String']>;
  DateEnd?: Maybe<Scalars['DateTime']>;
  DateStart?: Maybe<Scalars['DateTime']>;
  Error?: Maybe<Scalars['String']>;
  Job?: Maybe<Job>;
  Output?: Maybe<Scalars['String']>;
  Parameters?: Maybe<Scalars['String']>;
  Result?: Maybe<Scalars['Boolean']>;
  Status: Scalars['Int'];
  idJob: Scalars['Int'];
  idJobRun: Scalars['Int'];
};

export type License = {
  __typename?: 'License';
  Description: Scalars['String'];
  LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
  Name: Scalars['String'];
  RestrictLevel: Scalars['Int'];
  idLicense: Scalars['Int'];
};

export type LicenseAssignment = {
  __typename?: 'LicenseAssignment';
  DateEnd?: Maybe<Scalars['DateTime']>;
  DateStart?: Maybe<Scalars['DateTime']>;
  License?: Maybe<License>;
  SystemObject?: Maybe<SystemObject>;
  UserCreator?: Maybe<User>;
  idLicense: Scalars['Int'];
  idLicenseAssignment: Scalars['Int'];
  idSystemObject?: Maybe<Scalars['Int']>;
  idUserCreator?: Maybe<Scalars['Int']>;
};

export type Metadata = {
  __typename?: 'Metadata';
  AssetVersionValue?: Maybe<AssetVersion>;
  Label?: Maybe<Scalars['String']>;
  Name: Scalars['String'];
  SystemObject?: Maybe<SystemObject>;
  SystemObjectParent?: Maybe<SystemObject>;
  User?: Maybe<User>;
  VMetadataSource?: Maybe<Vocabulary>;
  Value?: Maybe<Scalars['String']>;
  ValueExtended?: Maybe<Scalars['String']>;
  ValueShort?: Maybe<Scalars['String']>;
  idAssetVersionValue?: Maybe<Scalars['Int']>;
  idMetadata: Scalars['Int'];
  idSystemObject?: Maybe<Scalars['Int']>;
  idSystemObjectParent?: Maybe<Scalars['Int']>;
  idUser?: Maybe<Scalars['Int']>;
  idVMetadataSource?: Maybe<Scalars['Int']>;
};

export type MetadataInput = {
  Label: Scalars['String'];
  Name: Scalars['String'];
  Value: Scalars['String'];
  idMetadata?: InputMaybe<Scalars['Int']>;
};

export type Model = {
  __typename?: 'Model';
  AssetThumbnail?: Maybe<Asset>;
  CountAnimations?: Maybe<Scalars['Int']>;
  CountCameras?: Maybe<Scalars['Int']>;
  CountEmbeddedTextures?: Maybe<Scalars['Int']>;
  CountFaces?: Maybe<Scalars['Int']>;
  CountLights?: Maybe<Scalars['Int']>;
  CountLinkedTextures?: Maybe<Scalars['Int']>;
  CountMaterials?: Maybe<Scalars['Int']>;
  CountMeshes?: Maybe<Scalars['Int']>;
  CountTriangles?: Maybe<Scalars['Int']>;
  CountVertices?: Maybe<Scalars['Int']>;
  DateCreated: Scalars['DateTime'];
  FileEncoding?: Maybe<Scalars['String']>;
  IsDracoCompressed?: Maybe<Scalars['Boolean']>;
  ModelConstellation?: Maybe<ModelConstellation>;
  ModelObject?: Maybe<Array<Maybe<ModelObject>>>;
  ModelProcessingAction?: Maybe<Array<Maybe<ModelProcessingAction>>>;
  ModelSceneXref?: Maybe<Array<Maybe<ModelSceneXref>>>;
  Name: Scalars['String'];
  SystemObject?: Maybe<SystemObject>;
  VCreationMethod?: Maybe<Vocabulary>;
  VFileType?: Maybe<Vocabulary>;
  VModality?: Maybe<Vocabulary>;
  VPurpose?: Maybe<Vocabulary>;
  VUnits?: Maybe<Vocabulary>;
  Variant: Scalars['String'];
  idAssetThumbnail?: Maybe<Scalars['Int']>;
  idModel: Scalars['Int'];
  idVCreationMethod?: Maybe<Scalars['Int']>;
  idVFileType?: Maybe<Scalars['Int']>;
  idVModality?: Maybe<Scalars['Int']>;
  idVPurpose?: Maybe<Scalars['Int']>;
  idVUnits?: Maybe<Scalars['Int']>;
};

export type ModelAsset = {
  __typename?: 'ModelAsset';
  Asset: Asset;
  AssetName: Scalars['String'];
  AssetType: Scalars['String'];
  AssetVersion: AssetVersion;
};

export type ModelConstellation = {
  __typename?: 'ModelConstellation';
  Model: Model;
  ModelAssets?: Maybe<Array<ModelAsset>>;
  ModelMaterialChannels?: Maybe<Array<ModelMaterialChannel>>;
  ModelMaterialUVMaps?: Maybe<Array<ModelMaterialUvMap>>;
  ModelMaterials?: Maybe<Array<ModelMaterial>>;
  ModelObjectModelMaterialXref?: Maybe<Array<ModelObjectModelMaterialXref>>;
  ModelObjects?: Maybe<Array<ModelObject>>;
};

export type ModelDetailFieldsInput = {
  CreationMethod?: InputMaybe<Scalars['Int']>;
  DateCreated?: InputMaybe<Scalars['DateTime']>;
  Modality?: InputMaybe<Scalars['Int']>;
  ModelFileType?: InputMaybe<Scalars['Int']>;
  Name?: InputMaybe<Scalars['String']>;
  Purpose?: InputMaybe<Scalars['Int']>;
  Units?: InputMaybe<Scalars['Int']>;
  Variant: Scalars['String'];
};

export type ModelMaterial = {
  __typename?: 'ModelMaterial';
  ModelMaterialChannel?: Maybe<Array<Maybe<ModelMaterialChannel>>>;
  Name?: Maybe<Scalars['String']>;
  idModelMaterial: Scalars['Int'];
};

export type ModelMaterialChannel = {
  __typename?: 'ModelMaterialChannel';
  AdditionalAttributes?: Maybe<Scalars['String']>;
  ChannelPosition?: Maybe<Scalars['Int']>;
  ChannelWidth?: Maybe<Scalars['Int']>;
  MaterialTypeOther?: Maybe<Scalars['String']>;
  ModelMaterial?: Maybe<ModelMaterial>;
  ModelMaterialUVMap?: Maybe<ModelMaterialUvMap>;
  Scalar1?: Maybe<Scalars['Float']>;
  Scalar2?: Maybe<Scalars['Float']>;
  Scalar3?: Maybe<Scalars['Float']>;
  Scalar4?: Maybe<Scalars['Float']>;
  Source?: Maybe<Scalars['String']>;
  Type?: Maybe<Scalars['String']>;
  UVMapEmbedded?: Maybe<Scalars['Boolean']>;
  VMaterialType?: Maybe<Vocabulary>;
  Value?: Maybe<Scalars['String']>;
  idModelMaterial: Scalars['Int'];
  idModelMaterialChannel: Scalars['Int'];
  idModelMaterialUVMap?: Maybe<Scalars['Int']>;
  idVMaterialType?: Maybe<Scalars['Int']>;
};

export type ModelMaterialUvMap = {
  __typename?: 'ModelMaterialUVMap';
  Asset?: Maybe<Asset>;
  Model?: Maybe<Model>;
  UVMapEdgeLength: Scalars['Int'];
  idAsset: Scalars['Int'];
  idModel: Scalars['Int'];
  idModelMaterialUVMap: Scalars['Int'];
};

export type ModelObject = {
  __typename?: 'ModelObject';
  BoundingBoxP1X?: Maybe<Scalars['Float']>;
  BoundingBoxP1Y?: Maybe<Scalars['Float']>;
  BoundingBoxP1Z?: Maybe<Scalars['Float']>;
  BoundingBoxP2X?: Maybe<Scalars['Float']>;
  BoundingBoxP2Y?: Maybe<Scalars['Float']>;
  BoundingBoxP2Z?: Maybe<Scalars['Float']>;
  CountColorChannels?: Maybe<Scalars['Int']>;
  CountFaces?: Maybe<Scalars['Int']>;
  CountTextureCoordinateChannels?: Maybe<Scalars['Int']>;
  CountTriangles?: Maybe<Scalars['Int']>;
  CountVertices?: Maybe<Scalars['Int']>;
  HasBones?: Maybe<Scalars['Boolean']>;
  HasFaceNormals?: Maybe<Scalars['Boolean']>;
  HasTangents?: Maybe<Scalars['Boolean']>;
  HasTextureCoordinates?: Maybe<Scalars['Boolean']>;
  HasVertexColor?: Maybe<Scalars['Boolean']>;
  HasVertexNormals?: Maybe<Scalars['Boolean']>;
  IsTwoManifoldBounded?: Maybe<Scalars['Boolean']>;
  IsTwoManifoldUnbounded?: Maybe<Scalars['Boolean']>;
  IsWatertight?: Maybe<Scalars['Boolean']>;
  Model?: Maybe<Model>;
  SelfIntersecting?: Maybe<Scalars['Boolean']>;
  idModel: Scalars['Int'];
  idModelObject: Scalars['Int'];
};

export type ModelObjectModelMaterialXref = {
  __typename?: 'ModelObjectModelMaterialXref';
  ModelMaterial?: Maybe<ModelMaterial>;
  ModelObject?: Maybe<ModelObject>;
  idModelMaterial: Scalars['Int'];
  idModelObject: Scalars['Int'];
  idModelObjectModelMaterialXref: Scalars['Int'];
};

export type ModelProcessingAction = {
  __typename?: 'ModelProcessingAction';
  Actor?: Maybe<Actor>;
  DateProcessed: Scalars['DateTime'];
  Description: Scalars['String'];
  Model?: Maybe<Model>;
  ModelProcessingActionStep: Array<Maybe<ModelProcessingActionStep>>;
  ToolsUsed: Scalars['String'];
  idActor: Scalars['Int'];
  idModel: Scalars['Int'];
  idModelProcessingAction: Scalars['Int'];
};

export type ModelProcessingActionStep = {
  __typename?: 'ModelProcessingActionStep';
  Description: Scalars['String'];
  ModelProcessingAction?: Maybe<ModelProcessingAction>;
  VActionMethod?: Maybe<Vocabulary>;
  idModelProcessingAction: Scalars['Int'];
  idModelProcessingActionStep: Scalars['Int'];
  idVActionMethod: Scalars['Int'];
};

export type ModelSceneXref = {
  __typename?: 'ModelSceneXref';
  BoundingBoxP1X?: Maybe<Scalars['Float']>;
  BoundingBoxP1Y?: Maybe<Scalars['Float']>;
  BoundingBoxP1Z?: Maybe<Scalars['Float']>;
  BoundingBoxP2X?: Maybe<Scalars['Float']>;
  BoundingBoxP2Y?: Maybe<Scalars['Float']>;
  BoundingBoxP2Z?: Maybe<Scalars['Float']>;
  FileSize?: Maybe<Scalars['BigInt']>;
  Model?: Maybe<Model>;
  Name?: Maybe<Scalars['String']>;
  Quality?: Maybe<Scalars['String']>;
  R0?: Maybe<Scalars['Float']>;
  R1?: Maybe<Scalars['Float']>;
  R2?: Maybe<Scalars['Float']>;
  R3?: Maybe<Scalars['Float']>;
  Scene?: Maybe<Scene>;
  TS0?: Maybe<Scalars['Float']>;
  TS1?: Maybe<Scalars['Float']>;
  TS2?: Maybe<Scalars['Float']>;
  UVResolution?: Maybe<Scalars['Int']>;
  Usage?: Maybe<Scalars['String']>;
  idModel: Scalars['Int'];
  idModelSceneXref: Scalars['Int'];
  idScene: Scalars['Int'];
};

export type Mutation = {
  __typename?: 'Mutation';
  assignLicense: AssignLicenseResult;
  clearLicenseAssignment: ClearLicenseAssignmentResult;
  createCaptureData: CreateCaptureDataResult;
  createCaptureDataPhoto: CreateCaptureDataPhotoResult;
  createGeoLocation: CreateGeoLocationResult;
  createLicense: CreateLicenseResult;
  createProject: CreateProjectResult;
  createSubject: CreateSubjectResult;
  createSubjectWithIdentifiers: CreateSubjectWithIdentifiersResult;
  createUnit: CreateUnitResult;
  createUser: CreateUserResult;
  createVocabulary: CreateVocabularyResult;
  createVocabularySet: CreateVocabularySetResult;
  deleteIdentifier: DeleteIdentifierResult;
  deleteMetadata: DeleteMetadataResult;
  deleteObjectConnection: DeleteObjectConnectionResult;
  discardUploadedAssetVersions: DiscardUploadedAssetVersionsResult;
  ingestData: IngestDataResult;
  publish: PublishResult;
  rollbackAssetVersion: RollbackAssetVersionResult;
  rollbackSystemObjectVersion: RollbackSystemObjectVersionResult;
  updateDerivedObjects: UpdateDerivedObjectsResult;
  updateLicense: CreateLicenseResult;
  updateObjectDetails: UpdateObjectDetailsResult;
  updateSourceObjects: UpdateSourceObjectsResult;
  updateUser: CreateUserResult;
  uploadAsset: UploadAssetResult;
};


export type MutationAssignLicenseArgs = {
  input: AssignLicenseInput;
};


export type MutationClearLicenseAssignmentArgs = {
  input: ClearLicenseAssignmentInput;
};


export type MutationCreateCaptureDataArgs = {
  input: CreateCaptureDataInput;
};


export type MutationCreateCaptureDataPhotoArgs = {
  input: CreateCaptureDataPhotoInput;
};


export type MutationCreateGeoLocationArgs = {
  input: CreateGeoLocationInput;
};


export type MutationCreateLicenseArgs = {
  input: CreateLicenseInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateSubjectArgs = {
  input: CreateSubjectInput;
};


export type MutationCreateSubjectWithIdentifiersArgs = {
  input: CreateSubjectWithIdentifiersInput;
};


export type MutationCreateUnitArgs = {
  input: CreateUnitInput;
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


export type MutationDeleteIdentifierArgs = {
  input: DeleteIdentifierInput;
};


export type MutationDeleteMetadataArgs = {
  input: DeleteMetadataInput;
};


export type MutationDeleteObjectConnectionArgs = {
  input: DeleteObjectConnectionInput;
};


export type MutationDiscardUploadedAssetVersionsArgs = {
  input: DiscardUploadedAssetVersionsInput;
};


export type MutationIngestDataArgs = {
  input: IngestDataInput;
};


export type MutationPublishArgs = {
  input: PublishInput;
};


export type MutationRollbackAssetVersionArgs = {
  input: RollbackAssetVersionInput;
};


export type MutationRollbackSystemObjectVersionArgs = {
  input: RollbackSystemObjectVersionInput;
};


export type MutationUpdateDerivedObjectsArgs = {
  input: UpdateDerivedObjectsInput;
};


export type MutationUpdateLicenseArgs = {
  input: UpdateLicenseInput;
};


export type MutationUpdateObjectDetailsArgs = {
  input: UpdateObjectDetailsInput;
};


export type MutationUpdateSourceObjectsArgs = {
  input: UpdateSourceObjectsInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUploadAssetArgs = {
  file: Scalars['Upload'];
  idAsset?: InputMaybe<Scalars['Int']>;
  idSOAttachment?: InputMaybe<Scalars['Int']>;
  type: Scalars['Int'];
};

export type NavigationResultEntry = {
  __typename?: 'NavigationResultEntry';
  idObject: Scalars['Int'];
  idSystemObject: Scalars['Int'];
  metadata: Array<Scalars['String']>;
  name: Scalars['String'];
  objectType: Scalars['Int'];
};

export type ObjectPropertyResult = {
  __typename?: 'ObjectPropertyResult';
  idContact?: Maybe<Scalars['Int']>;
  level: Scalars['Int'];
  propertyType: Scalars['String'];
  rationale: Scalars['String'];
};

export type PaginationInput = {
  first?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  size?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
};

export type Project = {
  __typename?: 'Project';
  Description?: Maybe<Scalars['String']>;
  Name: Scalars['String'];
  ProjectDocumentation?: Maybe<Array<Maybe<ProjectDocumentation>>>;
  SystemObject?: Maybe<SystemObject>;
  Workflow?: Maybe<Array<Maybe<Workflow>>>;
  idProject: Scalars['Int'];
};

export type ProjectDetailFields = {
  __typename?: 'ProjectDetailFields';
  Description?: Maybe<Scalars['String']>;
};

export type ProjectDetailFieldsInput = {
  Description?: InputMaybe<Scalars['String']>;
};

export type ProjectDocumentation = {
  __typename?: 'ProjectDocumentation';
  Description: Scalars['String'];
  Name: Scalars['String'];
  Project?: Maybe<Project>;
  SystemObject?: Maybe<SystemObject>;
  idProject: Scalars['Int'];
  idProjectDocumentation: Scalars['Int'];
};

export type ProjectDocumentationDetailFields = {
  __typename?: 'ProjectDocumentationDetailFields';
  Description?: Maybe<Scalars['String']>;
};

export type ProjectDocumentationDetailFieldsInput = {
  Description?: InputMaybe<Scalars['String']>;
};

export type PublishInput = {
  eState: Scalars['Int'];
  idSystemObject: Scalars['Int'];
};

export type PublishResult = {
  __typename?: 'PublishResult';
  eState?: Maybe<Scalars['Int']>;
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  areCameraSettingsUniform: AreCameraSettingsUniformResult;
  getAccessPolicy: GetAccessPolicyResult;
  getAllUsers: GetAllUsersResult;
  getAsset: GetAssetResult;
  getAssetDetailsForSystemObject: GetAssetDetailsForSystemObjectResult;
  getAssetVersionsDetails: GetAssetVersionsDetailsResult;
  getCaptureData: GetCaptureDataResult;
  getCaptureDataPhoto: GetCaptureDataPhotoResult;
  getContentsForAssetVersions: GetContentsForAssetVersionsResult;
  getCurrentUser: GetCurrentUserResult;
  getDetailsTabDataForObject: GetDetailsTabDataForObjectResult;
  getEdanUnitsNamed: GetEdanUnitsNamedResult;
  getFilterViewData: GetFilterViewDataResult;
  getIngestTitle: GetIngestTitleResult;
  getIngestionItems: GetIngestionItemsResult;
  getIntermediaryFile: GetIntermediaryFileResult;
  getItem: GetItemResult;
  getItemsForSubject: GetItemsForSubjectResult;
  getLicense: GetLicenseResult;
  getLicenseList: GetLicenseListResult;
  getModel: GetModelResult;
  getModelConstellation: GetModelConstellationResult;
  getModelConstellationForAssetVersion: GetModelConstellationForAssetVersionResult;
  getObjectChildren: GetObjectChildrenResult;
  getObjectsForItem: GetObjectsForItemResult;
  getProject: GetProjectResult;
  getProjectDocumentation: GetProjectDocumentationResult;
  getProjectList: GetProjectListResult;
  getScene: GetSceneResult;
  getSceneForAssetVersion: GetSceneForAssetVersionResult;
  getSourceObjectIdentifer: GetSourceObjectIdentiferResult;
  getSubject: GetSubjectResult;
  getSubjectList: GetSubjectListResult;
  getSubjectsForUnit: GetSubjectsForUnitResult;
  getSystemObjectDetails: GetSystemObjectDetailsResult;
  getUnit: GetUnitResult;
  getUnitsFromEdanAbbreviation: GetUnitsFromEdanAbbreviationResult;
  getUnitsFromNameSearch: GetUnitsFromNameSearchResult;
  getUploadedAssetVersion: GetUploadedAssetVersionResult;
  getUser: GetUserResult;
  getVersionsForAsset: GetVersionsForAssetResult;
  getVocabulary: GetVocabularyResult;
  getVocabularyEntries: GetVocabularyEntriesResult;
  getVoyagerParams: GetVoyagerParamsResult;
  getWorkflow: GetWorkflowResult;
  getWorkflowList: GetWorkflowListResult;
  searchIngestionSubjects: SearchIngestionSubjectsResult;
};


export type QueryAreCameraSettingsUniformArgs = {
  input: AreCameraSettingsUniformInput;
};


export type QueryGetAccessPolicyArgs = {
  input: GetAccessPolicyInput;
};


export type QueryGetAllUsersArgs = {
  input: GetAllUsersInput;
};


export type QueryGetAssetArgs = {
  input: GetAssetInput;
};


export type QueryGetAssetDetailsForSystemObjectArgs = {
  input: GetAssetDetailsForSystemObjectInput;
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


export type QueryGetContentsForAssetVersionsArgs = {
  input: GetContentsForAssetVersionsInput;
};


export type QueryGetDetailsTabDataForObjectArgs = {
  input: GetDetailsTabDataForObjectInput;
};


export type QueryGetIngestTitleArgs = {
  input: GetIngestTitleInput;
};


export type QueryGetIngestionItemsArgs = {
  input: GetIngestionItemsInput;
};


export type QueryGetIntermediaryFileArgs = {
  input: GetIntermediaryFileInput;
};


export type QueryGetItemArgs = {
  input: GetItemInput;
};


export type QueryGetItemsForSubjectArgs = {
  input: GetItemsForSubjectInput;
};


export type QueryGetLicenseArgs = {
  input: GetLicenseInput;
};


export type QueryGetLicenseListArgs = {
  input: GetLicenseListInput;
};


export type QueryGetModelArgs = {
  input: GetModelInput;
};


export type QueryGetModelConstellationArgs = {
  input: GetModelConstellationInput;
};


export type QueryGetModelConstellationForAssetVersionArgs = {
  input: GetModelConstellationForAssetVersionInput;
};


export type QueryGetObjectChildrenArgs = {
  input: GetObjectChildrenInput;
};


export type QueryGetObjectsForItemArgs = {
  input: GetObjectsForItemInput;
};


export type QueryGetProjectArgs = {
  input: GetProjectInput;
};


export type QueryGetProjectDocumentationArgs = {
  input: GetProjectDocumentationInput;
};


export type QueryGetProjectListArgs = {
  input: GetProjectListInput;
};


export type QueryGetSceneArgs = {
  input: GetSceneInput;
};


export type QueryGetSceneForAssetVersionArgs = {
  input: GetSceneForAssetVersionInput;
};


export type QueryGetSourceObjectIdentiferArgs = {
  input: GetSourceObjectIdentiferInput;
};


export type QueryGetSubjectArgs = {
  input: GetSubjectInput;
};


export type QueryGetSubjectListArgs = {
  input: GetSubjectListInput;
};


export type QueryGetSubjectsForUnitArgs = {
  input: GetSubjectsForUnitInput;
};


export type QueryGetSystemObjectDetailsArgs = {
  input: GetSystemObjectDetailsInput;
};


export type QueryGetUnitArgs = {
  input: GetUnitInput;
};


export type QueryGetUnitsFromEdanAbbreviationArgs = {
  input: GetUnitsFromEdanAbbreviationInput;
};


export type QueryGetUnitsFromNameSearchArgs = {
  input: GetUnitsFromNameSearchInput;
};


export type QueryGetUserArgs = {
  input: GetUserInput;
};


export type QueryGetVersionsForAssetArgs = {
  input: GetVersionsForAssetInput;
};


export type QueryGetVocabularyArgs = {
  input: GetVocabularyInput;
};


export type QueryGetVocabularyEntriesArgs = {
  input: GetVocabularyEntriesInput;
};


export type QueryGetVoyagerParamsArgs = {
  input: GetVoyagerParamsInput;
};


export type QueryGetWorkflowArgs = {
  input: GetWorkflowInput;
};


export type QueryGetWorkflowListArgs = {
  input: GetWorkflowListInput;
};


export type QuerySearchIngestionSubjectsArgs = {
  input: SearchIngestionSubjectsInput;
};

export type ReferenceModel = {
  __typename?: 'ReferenceModel';
  action: ReferenceModelAction;
  boundingBoxP1X?: Maybe<Scalars['Float']>;
  boundingBoxP1Y?: Maybe<Scalars['Float']>;
  boundingBoxP1Z?: Maybe<Scalars['Float']>;
  boundingBoxP2X?: Maybe<Scalars['Float']>;
  boundingBoxP2Y?: Maybe<Scalars['Float']>;
  boundingBoxP2Z?: Maybe<Scalars['Float']>;
  fileSize: Scalars['BigInt'];
  idSystemObject: Scalars['Int'];
  name: Scalars['String'];
  quality: Scalars['String'];
  resolution?: Maybe<Scalars['Int']>;
  usage: Scalars['String'];
};

export enum ReferenceModelAction {
  Ingest = 'Ingest',
  Update = 'Update'
}

export type RelatedObject = {
  __typename?: 'RelatedObject';
  idSystemObject: Scalars['Int'];
  identifier?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  objectType: Scalars['Int'];
};

export type RelatedObjectInput = {
  idSystemObject: Scalars['Int'];
  identifier?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  objectType: Scalars['Int'];
};

export enum RelatedObjectType {
  Derived = 'Derived',
  Source = 'Source'
}

export type RepositoryPath = {
  __typename?: 'RepositoryPath';
  idSystemObject: Scalars['Int'];
  name: Scalars['String'];
  objectType: Scalars['Int'];
};

export type RollbackAssetVersionInput = {
  idAssetVersion: Scalars['Int'];
  rollbackNotes: Scalars['String'];
};

export type RollbackAssetVersionResult = {
  __typename?: 'RollbackAssetVersionResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type RollbackSystemObjectVersionInput = {
  idSystemObjectVersion: Scalars['Int'];
  rollbackNotes: Scalars['String'];
  time: Scalars['String'];
};

export type RollbackSystemObjectVersionResult = {
  __typename?: 'RollbackSystemObjectVersionResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type Scene = {
  __typename?: 'Scene';
  ApprovedForPublication: Scalars['Boolean'];
  AssetThumbnail?: Maybe<Asset>;
  CanBeQCd?: Maybe<Scalars['Boolean']>;
  CountCamera?: Maybe<Scalars['Int']>;
  CountLight?: Maybe<Scalars['Int']>;
  CountMeta?: Maybe<Scalars['Int']>;
  CountModel?: Maybe<Scalars['Int']>;
  CountNode?: Maybe<Scalars['Int']>;
  CountScene?: Maybe<Scalars['Int']>;
  CountSetup?: Maybe<Scalars['Int']>;
  CountTour?: Maybe<Scalars['Int']>;
  EdanUUID?: Maybe<Scalars['String']>;
  ModelSceneXref?: Maybe<Array<Maybe<ModelSceneXref>>>;
  Name: Scalars['String'];
  PosedAndQCd: Scalars['Boolean'];
  SystemObject?: Maybe<SystemObject>;
  idAssetThumbnail?: Maybe<Scalars['Int']>;
  idScene: Scalars['Int'];
};

export type SceneConstellation = {
  __typename?: 'SceneConstellation';
  ModelSceneXref?: Maybe<Array<Maybe<ModelSceneXref>>>;
  Scene?: Maybe<Scene>;
  SvxNonModelAssets?: Maybe<Array<SvxNonModelAsset>>;
};

export type SceneDetailFields = {
  __typename?: 'SceneDetailFields';
  Annotation?: Maybe<Scalars['Int']>;
  ApprovedForPublication?: Maybe<Scalars['Boolean']>;
  AssetType?: Maybe<Scalars['Int']>;
  CanBeQCd?: Maybe<Scalars['Boolean']>;
  CountCamera?: Maybe<Scalars['Int']>;
  CountLight?: Maybe<Scalars['Int']>;
  CountMeta?: Maybe<Scalars['Int']>;
  CountModel?: Maybe<Scalars['Int']>;
  CountNode?: Maybe<Scalars['Int']>;
  CountScene?: Maybe<Scalars['Int']>;
  CountSetup?: Maybe<Scalars['Int']>;
  CountTour?: Maybe<Scalars['Int']>;
  EdanUUID?: Maybe<Scalars['String']>;
  Links: Array<Scalars['String']>;
  PosedAndQCd?: Maybe<Scalars['Boolean']>;
  PublicationApprover?: Maybe<Scalars['String']>;
  Tours?: Maybe<Scalars['Int']>;
  idScene?: Maybe<Scalars['Int']>;
};

export type SceneDetailFieldsInput = {
  Annotation?: InputMaybe<Scalars['Int']>;
  ApprovedForPublication?: InputMaybe<Scalars['Boolean']>;
  AssetType?: InputMaybe<Scalars['Int']>;
  PosedAndQCd?: InputMaybe<Scalars['Boolean']>;
  Tours?: InputMaybe<Scalars['Int']>;
};

export type SearchIngestionSubjectsInput = {
  EdanOnly?: InputMaybe<Scalars['Boolean']>;
  query: Scalars['String'];
};

export type SearchIngestionSubjectsResult = {
  __typename?: 'SearchIngestionSubjectsResult';
  SubjectUnitIdentifier: Array<SubjectUnitIdentifier>;
};

export type SourceObjectIdentifier = {
  __typename?: 'SourceObjectIdentifier';
  idSystemObject: Scalars['Int'];
  identifier?: Maybe<Scalars['String']>;
};

export type Stakeholder = {
  __typename?: 'Stakeholder';
  EmailAddress?: Maybe<Scalars['String']>;
  IndividualName: Scalars['String'];
  MailingAddress?: Maybe<Scalars['String']>;
  OrganizationName: Scalars['String'];
  PhoneNumberMobile?: Maybe<Scalars['String']>;
  PhoneNumberOffice?: Maybe<Scalars['String']>;
  SystemObject?: Maybe<SystemObject>;
  idStakeholder: Scalars['Int'];
};

export type StakeholderDetailFields = {
  __typename?: 'StakeholderDetailFields';
  EmailAddress?: Maybe<Scalars['String']>;
  MailingAddress?: Maybe<Scalars['String']>;
  OrganizationName?: Maybe<Scalars['String']>;
  PhoneNumberMobile?: Maybe<Scalars['String']>;
  PhoneNumberOffice?: Maybe<Scalars['String']>;
};

export type StakeholderDetailFieldsInput = {
  EmailAddress?: InputMaybe<Scalars['String']>;
  MailingAddress?: InputMaybe<Scalars['String']>;
  OrganizationName?: InputMaybe<Scalars['String']>;
  PhoneNumberMobile?: InputMaybe<Scalars['String']>;
  PhoneNumberOffice?: InputMaybe<Scalars['String']>;
};

export type Subject = {
  __typename?: 'Subject';
  AssetThumbnail?: Maybe<Asset>;
  GeoLocation?: Maybe<GeoLocation>;
  IdentifierPreferred?: Maybe<Identifier>;
  Item?: Maybe<Array<Maybe<Item>>>;
  Name: Scalars['String'];
  SystemObject?: Maybe<SystemObject>;
  Unit?: Maybe<Unit>;
  idAssetThumbnail?: Maybe<Scalars['Int']>;
  idGeoLocation?: Maybe<Scalars['Int']>;
  idIdentifierPreferred?: Maybe<Scalars['Int']>;
  idSubject: Scalars['Int'];
  idUnit: Scalars['Int'];
};

export type SubjectDetailFields = {
  __typename?: 'SubjectDetailFields';
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
  idIdentifierPreferred?: Maybe<Scalars['Int']>;
};

export type SubjectDetailFieldsInput = {
  Altitude?: InputMaybe<Scalars['Float']>;
  Latitude?: InputMaybe<Scalars['Float']>;
  Longitude?: InputMaybe<Scalars['Float']>;
  R0?: InputMaybe<Scalars['Float']>;
  R1?: InputMaybe<Scalars['Float']>;
  R2?: InputMaybe<Scalars['Float']>;
  R3?: InputMaybe<Scalars['Float']>;
  TS0?: InputMaybe<Scalars['Float']>;
  TS1?: InputMaybe<Scalars['Float']>;
  TS2?: InputMaybe<Scalars['Float']>;
  idIdentifierPreferred?: InputMaybe<Scalars['Int']>;
};

export type SubjectUnitIdentifier = {
  __typename?: 'SubjectUnitIdentifier';
  IdentifierCollection?: Maybe<Scalars['String']>;
  IdentifierPublic?: Maybe<Scalars['String']>;
  SubjectName: Scalars['String'];
  UnitAbbreviation: Scalars['String'];
  idSubject: Scalars['Int'];
  idSystemObject: Scalars['Int'];
};

export type SvxNonModelAsset = {
  __typename?: 'SvxNonModelAsset';
  description?: Maybe<Scalars['String']>;
  idAssetVersion?: Maybe<Scalars['Int']>;
  size?: Maybe<Scalars['Int']>;
  type: Scalars['String'];
  uri: Scalars['String'];
};

export type SystemObject = {
  __typename?: 'SystemObject';
  AccessContextObject?: Maybe<Array<Maybe<AccessContextObject>>>;
  Actor?: Maybe<Actor>;
  Asset?: Maybe<Asset>;
  AssetVersion?: Maybe<AssetVersion>;
  CaptureData?: Maybe<CaptureData>;
  Identifier?: Maybe<Array<Maybe<Identifier>>>;
  IntermediaryFile?: Maybe<IntermediaryFile>;
  Item?: Maybe<Item>;
  LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
  Metadata?: Maybe<Array<Maybe<Metadata>>>;
  Model?: Maybe<Model>;
  Project?: Maybe<Project>;
  ProjectDocumentation?: Maybe<ProjectDocumentation>;
  Retired: Scalars['Boolean'];
  Scene?: Maybe<Scene>;
  Stakeholder?: Maybe<Stakeholder>;
  Subject?: Maybe<Subject>;
  SystemObjectDerived?: Maybe<Array<Maybe<SystemObject>>>;
  SystemObjectMaster?: Maybe<Array<Maybe<SystemObject>>>;
  SystemObjectVersion?: Maybe<Array<Maybe<SystemObjectVersion>>>;
  Unit?: Maybe<Unit>;
  UserPersonalizationSystemObject?: Maybe<Array<Maybe<UserPersonalizationSystemObject>>>;
  Workflow?: Maybe<Workflow>;
  WorkflowStep?: Maybe<WorkflowStep>;
  WorkflowStepXref?: Maybe<Array<Maybe<WorkflowStep>>>;
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
  idSystemObject: Scalars['Int'];
  idUnit?: Maybe<Scalars['Int']>;
  idWorkflow?: Maybe<Scalars['Int']>;
  idWorkflowStep?: Maybe<Scalars['Int']>;
};

export type SystemObjectVersion = {
  __typename?: 'SystemObjectVersion';
  Comment?: Maybe<Scalars['String']>;
  CommentLink?: Maybe<Scalars['String']>;
  DateCreated: Scalars['DateTime'];
  PublishedState: Scalars['Int'];
  SystemObject?: Maybe<SystemObject>;
  idSystemObject: Scalars['Int'];
  idSystemObjectVersion: Scalars['Int'];
};

export enum User_Status {
  EActive = 'eActive',
  EAll = 'eAll',
  EInactive = 'eInactive'
}

export type Unit = {
  __typename?: 'Unit';
  ARKPrefix?: Maybe<Scalars['String']>;
  Abbreviation?: Maybe<Scalars['String']>;
  Actor?: Maybe<Array<Maybe<Actor>>>;
  Name: Scalars['String'];
  Subject?: Maybe<Array<Maybe<Subject>>>;
  SystemObject?: Maybe<SystemObject>;
  idUnit: Scalars['Int'];
};

export type UnitDetailFields = {
  __typename?: 'UnitDetailFields';
  ARKPrefix?: Maybe<Scalars['String']>;
  Abbreviation?: Maybe<Scalars['String']>;
};

export type UnitDetailFieldsInput = {
  ARKPrefix?: InputMaybe<Scalars['String']>;
  Abbreviation?: InputMaybe<Scalars['String']>;
};

export type UnitEdan = {
  __typename?: 'UnitEdan';
  Abbreviation: Scalars['String'];
  Name?: Maybe<Scalars['String']>;
  Unit?: Maybe<Unit>;
  idUnit?: Maybe<Scalars['Int']>;
  idUnitEdan: Scalars['Int'];
};

export type UpdateDerivedObjectsInput = {
  Derivatives: Array<ExistingRelationship>;
  ParentObjectType: Scalars['Int'];
  PreviouslySelected: Array<ExistingRelationship>;
  idSystemObject: Scalars['Int'];
};

export type UpdateDerivedObjectsResult = {
  __typename?: 'UpdateDerivedObjectsResult';
  message?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  success: Scalars['Boolean'];
};

export type UpdateIdentifier = {
  id: Scalars['Int'];
  idIdentifier: Scalars['Int'];
  idSystemObject: Scalars['Int'];
  identifier: Scalars['String'];
  identifierType: Scalars['Int'];
  preferred?: InputMaybe<Scalars['Boolean']>;
};

export type UpdateLicenseInput = {
  Description: Scalars['String'];
  Name: Scalars['String'];
  RestrictLevel: Scalars['Int'];
  idLicense: Scalars['Int'];
};

export type UpdateModelMetadata = {
  __typename?: 'UpdateModelMetadata';
  Variant: Scalars['String'];
  creationMethod: Scalars['Int'];
  dateCreated: Scalars['String'];
  modality: Scalars['Int'];
  modelFileType: Scalars['Int'];
  name: Scalars['String'];
  purpose: Scalars['Int'];
  units: Scalars['Int'];
};

export type UpdateObjectDetailsDataInput = {
  Actor?: InputMaybe<ActorDetailFieldsInput>;
  Asset?: InputMaybe<AssetDetailFieldsInput>;
  AssetVersion?: InputMaybe<AssetVersionDetailFieldsInput>;
  CaptureData?: InputMaybe<CaptureDataDetailFieldsInput>;
  Identifiers?: InputMaybe<Array<UpdateIdentifier>>;
  Item?: InputMaybe<ItemDetailFieldsInput>;
  License?: InputMaybe<Scalars['Int']>;
  Metadata?: InputMaybe<Array<MetadataInput>>;
  Model?: InputMaybe<ModelDetailFieldsInput>;
  Name?: InputMaybe<Scalars['String']>;
  Project?: InputMaybe<ProjectDetailFieldsInput>;
  ProjectDocumentation?: InputMaybe<ProjectDocumentationDetailFieldsInput>;
  Retired?: InputMaybe<Scalars['Boolean']>;
  Scene?: InputMaybe<SceneDetailFieldsInput>;
  Stakeholder?: InputMaybe<StakeholderDetailFieldsInput>;
  Subject?: InputMaybe<SubjectDetailFieldsInput>;
  Subtitle?: InputMaybe<Scalars['String']>;
  Unit?: InputMaybe<UnitDetailFieldsInput>;
};

export type UpdateObjectDetailsInput = {
  data: UpdateObjectDetailsDataInput;
  idObject: Scalars['Int'];
  idSystemObject: Scalars['Int'];
  objectType: Scalars['Int'];
};

export type UpdateObjectDetailsResult = {
  __typename?: 'UpdateObjectDetailsResult';
  message?: Maybe<Scalars['String']>;
  success: Scalars['Boolean'];
};

export type UpdatePhotogrammetryMetadata = {
  __typename?: 'UpdatePhotogrammetryMetadata';
  backgroundRemovalMethod?: Maybe<Scalars['Int']>;
  cameraSettingUniform: Scalars['Boolean'];
  clusterGeometryFieldId?: Maybe<Scalars['Int']>;
  clusterType?: Maybe<Scalars['Int']>;
  datasetFieldId?: Maybe<Scalars['Int']>;
  datasetType: Scalars['Int'];
  datasetUse: Scalars['String'];
  dateCaptured: Scalars['String'];
  description: Scalars['String'];
  focusType?: Maybe<Scalars['Int']>;
  folders: Array<IngestFolder>;
  itemArrangementFieldId?: Maybe<Scalars['Int']>;
  itemPositionFieldId?: Maybe<Scalars['Int']>;
  itemPositionType?: Maybe<Scalars['Int']>;
  lightsourceType?: Maybe<Scalars['Int']>;
  name: Scalars['String'];
};

export type UpdateSceneMetadata = {
  __typename?: 'UpdateSceneMetadata';
  approvedForPublication: Scalars['Boolean'];
  name: Scalars['String'];
  posedAndQCd: Scalars['Boolean'];
  referenceModels?: Maybe<Array<ReferenceModel>>;
};

export type UpdateSourceObjectsInput = {
  ChildObjectType: Scalars['Int'];
  PreviouslySelected: Array<ExistingRelationship>;
  Sources: Array<ExistingRelationship>;
  idSystemObject: Scalars['Int'];
};

export type UpdateSourceObjectsResult = {
  __typename?: 'UpdateSourceObjectsResult';
  message?: Maybe<Scalars['String']>;
  status: Scalars['String'];
  success: Scalars['Boolean'];
};

export type UpdateUserInput = {
  Active: Scalars['Boolean'];
  EmailAddress: Scalars['String'];
  EmailSettings?: InputMaybe<Scalars['Int']>;
  Name: Scalars['String'];
  SlackID: Scalars['String'];
  WorkflowNotificationTime: Scalars['DateTime'];
  idUser: Scalars['Int'];
};

export type UpdatedAssetVersionMetadata = {
  __typename?: 'UpdatedAssetVersionMetadata';
  CaptureDataPhoto?: Maybe<UpdatePhotogrammetryMetadata>;
  Item?: Maybe<Item>;
  Model?: Maybe<UpdateModelMetadata>;
  Scene?: Maybe<UpdateSceneMetadata>;
  UpdatedObjectName: Scalars['String'];
  idAssetVersion: Scalars['Int'];
};

export type UploadAssetInput = {
  __typename?: 'UploadAssetInput';
  file: Scalars['Upload'];
  idAsset?: Maybe<Scalars['Int']>;
  idSOAttachment?: Maybe<Scalars['Int']>;
  type: Scalars['Int'];
};

export type UploadAssetResult = {
  __typename?: 'UploadAssetResult';
  error?: Maybe<Scalars['String']>;
  idAssetVersions?: Maybe<Array<Scalars['Int']>>;
  status: UploadStatus;
};

export enum UploadStatus {
  Complete = 'COMPLETE',
  Failed = 'FAILED',
  Noauth = 'NOAUTH'
}

export type User = {
  __typename?: 'User';
  AccessPolicy?: Maybe<Array<Maybe<AccessPolicy>>>;
  Active: Scalars['Boolean'];
  AssetVersion?: Maybe<Array<Maybe<AssetVersion>>>;
  DateActivated: Scalars['DateTime'];
  DateDisabled?: Maybe<Scalars['DateTime']>;
  EmailAddress: Scalars['String'];
  EmailSettings?: Maybe<Scalars['Int']>;
  LicenseAssignment?: Maybe<Array<Maybe<LicenseAssignment>>>;
  Metadata?: Maybe<Array<Maybe<Metadata>>>;
  Name: Scalars['String'];
  SecurityID: Scalars['String'];
  SlackID: Scalars['String'];
  UserPersonalizationSystemObject?: Maybe<Array<Maybe<UserPersonalizationSystemObject>>>;
  UserPersonalizationUrl?: Maybe<Array<Maybe<UserPersonalizationUrl>>>;
  Workflow?: Maybe<Array<Maybe<Workflow>>>;
  WorkflowNotificationTime?: Maybe<Scalars['DateTime']>;
  WorkflowStep?: Maybe<Array<Maybe<WorkflowStep>>>;
  idUser: Scalars['Int'];
};

export type UserPersonalizationSystemObject = {
  __typename?: 'UserPersonalizationSystemObject';
  Personalization?: Maybe<Scalars['String']>;
  SystemObject?: Maybe<SystemObject>;
  User?: Maybe<User>;
  idSystemObject: Scalars['Int'];
  idUser: Scalars['Int'];
  idUserPersonalizationSystemObject: Scalars['Int'];
};

export type UserPersonalizationUrl = {
  __typename?: 'UserPersonalizationUrl';
  Personalization: Scalars['String'];
  URL: Scalars['String'];
  User?: Maybe<User>;
  idUser: Scalars['Int'];
  idUserPersonalizationUrl: Scalars['Int'];
};

export type Vocabulary = {
  __typename?: 'Vocabulary';
  SortOrder: Scalars['Int'];
  Term: Scalars['String'];
  VocabularySet?: Maybe<VocabularySet>;
  eVocabID?: Maybe<Scalars['Int']>;
  idVocabulary: Scalars['Int'];
  idVocabularySet: Scalars['Int'];
};

export type VocabularyEntry = {
  __typename?: 'VocabularyEntry';
  Vocabulary: Array<Vocabulary>;
  eVocabSetID: Scalars['Int'];
};

export type VocabularySet = {
  __typename?: 'VocabularySet';
  Name: Scalars['String'];
  SystemMaintained: Scalars['Boolean'];
  Vocabulary?: Maybe<Array<Maybe<Vocabulary>>>;
  idVocabularySet: Scalars['Int'];
};

export type Workflow = {
  __typename?: 'Workflow';
  DateInitiated: Scalars['DateTime'];
  DateUpdated: Scalars['DateTime'];
  Parameters?: Maybe<Scalars['String']>;
  Project?: Maybe<Project>;
  UserInitiator?: Maybe<User>;
  VWorkflowType?: Maybe<Vocabulary>;
  WorkflowStep?: Maybe<Array<Maybe<WorkflowStep>>>;
  idProject?: Maybe<Scalars['Int']>;
  idUserInitiator?: Maybe<Scalars['Int']>;
  idVWorkflowType: Scalars['Int'];
  idWorkflow: Scalars['Int'];
};

export type WorkflowListResult = {
  __typename?: 'WorkflowListResult';
  DateLast?: Maybe<Scalars['DateTime']>;
  DateStart?: Maybe<Scalars['DateTime']>;
  Error?: Maybe<Scalars['String']>;
  HyperlinkJob?: Maybe<Scalars['String']>;
  HyperlinkReport?: Maybe<Scalars['String']>;
  HyperlinkSet?: Maybe<Scalars['String']>;
  JobRun?: Maybe<JobRun>;
  Owner?: Maybe<User>;
  State?: Maybe<Scalars['String']>;
  Type?: Maybe<Scalars['String']>;
  UserInitiator?: Maybe<User>;
  Workflow?: Maybe<Workflow>;
  WorkflowReport?: Maybe<WorkflowReport>;
  WorkflowSet?: Maybe<WorkflowSet>;
  idJobRun?: Maybe<Scalars['Int']>;
  idOwner?: Maybe<Scalars['Int']>;
  idUserInitiator?: Maybe<Scalars['Int']>;
  idWorkflow: Scalars['Int'];
  idWorkflowReport?: Maybe<Scalars['Int']>;
  idWorkflowSet?: Maybe<Scalars['Int']>;
};

export type WorkflowReport = {
  __typename?: 'WorkflowReport';
  Data: Scalars['String'];
  MimeType: Scalars['String'];
  Workflow?: Maybe<Workflow>;
  idWorkflow: Scalars['Int'];
  idWorkflowReport: Scalars['Int'];
};

export type WorkflowSet = {
  __typename?: 'WorkflowSet';
  Workflow?: Maybe<Array<Maybe<Workflow>>>;
  idWorkflowSet: Scalars['Int'];
};

export type WorkflowStep = {
  __typename?: 'WorkflowStep';
  DateCompleted?: Maybe<Scalars['DateTime']>;
  DateCreated: Scalars['DateTime'];
  JobRun?: Maybe<JobRun>;
  State: Scalars['Int'];
  User?: Maybe<User>;
  VWorkflowStepType?: Maybe<Vocabulary>;
  Workflow?: Maybe<Workflow>;
  WorkflowStepSystemObjectXref?: Maybe<Array<Maybe<WorkflowStepSystemObjectXref>>>;
  idUserOwner: Scalars['Int'];
  idVWorkflowStepType: Scalars['Int'];
  idWorkflow: Scalars['Int'];
  idWorkflowStep: Scalars['Int'];
};

export type WorkflowStepSystemObjectXref = {
  __typename?: 'WorkflowStepSystemObjectXref';
  Input: Scalars['Boolean'];
  SystemObject?: Maybe<SystemObject>;
  WorkflowStep?: Maybe<WorkflowStep>;
  idSystemObject: Scalars['Int'];
  idWorkflowStep: Scalars['Int'];
  idWorkflowStepSystemObjectXref: Scalars['Int'];
};
