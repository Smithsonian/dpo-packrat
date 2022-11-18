import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
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
  Altitude?: Maybe<Scalars['Float']>;
  EntireSubject?: Maybe<Scalars['Boolean']>;
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

export type ItemDetailFieldsInput = {
  Altitude?: InputMaybe<Scalars['Float']>;
  EntireSubject?: InputMaybe<Scalars['Boolean']>;
  Latitude?: InputMaybe<Scalars['Float']>;
  Longitude?: InputMaybe<Scalars['Float']>;
  R0?: InputMaybe<Scalars['Float']>;
  R1?: InputMaybe<Scalars['Float']>;
  R2?: InputMaybe<Scalars['Float']>;
  R3?: InputMaybe<Scalars['Float']>;
  TS0?: InputMaybe<Scalars['Float']>;
  TS1?: InputMaybe<Scalars['Float']>;
  TS2?: InputMaybe<Scalars['Float']>;
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

export type DiscardUploadedAssetVersionsMutationVariables = Exact<{
  input: DiscardUploadedAssetVersionsInput;
}>;


export type DiscardUploadedAssetVersionsMutation = { __typename?: 'Mutation', discardUploadedAssetVersions: { __typename?: 'DiscardUploadedAssetVersionsResult', success: boolean } };

export type RollbackAssetVersionMutationVariables = Exact<{
  input: RollbackAssetVersionInput;
}>;


export type RollbackAssetVersionMutation = { __typename?: 'Mutation', rollbackAssetVersion: { __typename?: 'RollbackAssetVersionResult', success: boolean, message?: string | null } };

export type UploadAssetMutationVariables = Exact<{
  file: Scalars['Upload'];
  type: Scalars['Int'];
  idAsset?: InputMaybe<Scalars['Int']>;
  idSOAttachment?: InputMaybe<Scalars['Int']>;
}>;


export type UploadAssetMutation = { __typename?: 'Mutation', uploadAsset: { __typename?: 'UploadAssetResult', status: UploadStatus, idAssetVersions?: Array<number> | null, error?: string | null } };

export type CreateCaptureDataMutationVariables = Exact<{
  input: CreateCaptureDataInput;
}>;


export type CreateCaptureDataMutation = { __typename?: 'Mutation', createCaptureData: { __typename?: 'CreateCaptureDataResult', CaptureData?: { __typename?: 'CaptureData', idCaptureData: number } | null } };

export type CreateCaptureDataPhotoMutationVariables = Exact<{
  input: CreateCaptureDataPhotoInput;
}>;


export type CreateCaptureDataPhotoMutation = { __typename?: 'Mutation', createCaptureDataPhoto: { __typename?: 'CreateCaptureDataPhotoResult', CaptureDataPhoto?: { __typename?: 'CaptureDataPhoto', idCaptureDataPhoto: number } | null } };

export type IngestDataMutationVariables = Exact<{
  input: IngestDataInput;
}>;


export type IngestDataMutation = { __typename?: 'Mutation', ingestData: { __typename?: 'IngestDataResult', success: boolean, message?: string | null } };

export type AssignLicenseMutationVariables = Exact<{
  input: AssignLicenseInput;
}>;


export type AssignLicenseMutation = { __typename?: 'Mutation', assignLicense: { __typename?: 'AssignLicenseResult', success: boolean, message?: string | null } };

export type ClearLicenseAssignmentMutationVariables = Exact<{
  input: ClearLicenseAssignmentInput;
}>;


export type ClearLicenseAssignmentMutation = { __typename?: 'Mutation', clearLicenseAssignment: { __typename?: 'ClearLicenseAssignmentResult', success: boolean, message?: string | null } };

export type CreateLicenseMutationVariables = Exact<{
  input: CreateLicenseInput;
}>;


export type CreateLicenseMutation = { __typename?: 'Mutation', createLicense: { __typename?: 'CreateLicenseResult', License?: { __typename?: 'License', idLicense: number, Name: string, Description: string, RestrictLevel: number } | null } };

export type UpdateLicenseMutationVariables = Exact<{
  input: UpdateLicenseInput;
}>;


export type UpdateLicenseMutation = { __typename?: 'Mutation', updateLicense: { __typename?: 'CreateLicenseResult', License?: { __typename?: 'License', idLicense: number, Name: string, Description: string, RestrictLevel: number } | null } };

export type CreateSubjectWithIdentifiersMutationVariables = Exact<{
  input: CreateSubjectWithIdentifiersInput;
}>;


export type CreateSubjectWithIdentifiersMutation = { __typename?: 'Mutation', createSubjectWithIdentifiers: { __typename?: 'CreateSubjectWithIdentifiersResult', success: boolean, message?: string | null } };

export type DeleteIdentifierMutationVariables = Exact<{
  input: DeleteIdentifierInput;
}>;


export type DeleteIdentifierMutation = { __typename?: 'Mutation', deleteIdentifier: { __typename?: 'DeleteIdentifierResult', success: boolean } };

export type DeleteMetadataMutationVariables = Exact<{
  input: DeleteMetadataInput;
}>;


export type DeleteMetadataMutation = { __typename?: 'Mutation', deleteMetadata: { __typename?: 'DeleteMetadataResult', success: boolean } };

export type DeleteObjectConnectionMutationVariables = Exact<{
  input: DeleteObjectConnectionInput;
}>;


export type DeleteObjectConnectionMutation = { __typename?: 'Mutation', deleteObjectConnection: { __typename?: 'DeleteObjectConnectionResult', success: boolean, details: string } };

export type PublishMutationVariables = Exact<{
  input: PublishInput;
}>;


export type PublishMutation = { __typename?: 'Mutation', publish: { __typename?: 'PublishResult', success: boolean, eState?: number | null, message?: string | null } };

export type RollbackSystemObjectVersionMutationVariables = Exact<{
  input: RollbackSystemObjectVersionInput;
}>;


export type RollbackSystemObjectVersionMutation = { __typename?: 'Mutation', rollbackSystemObjectVersion: { __typename?: 'RollbackSystemObjectVersionResult', success: boolean, message?: string | null } };

export type UpdateDerivedObjectsMutationVariables = Exact<{
  input: UpdateDerivedObjectsInput;
}>;


export type UpdateDerivedObjectsMutation = { __typename?: 'Mutation', updateDerivedObjects: { __typename?: 'UpdateDerivedObjectsResult', success: boolean, message?: string | null, status: string } };

export type UpdateObjectDetailsMutationVariables = Exact<{
  input: UpdateObjectDetailsInput;
}>;


export type UpdateObjectDetailsMutation = { __typename?: 'Mutation', updateObjectDetails: { __typename?: 'UpdateObjectDetailsResult', success: boolean, message?: string | null } };

export type UpdateSourceObjectsMutationVariables = Exact<{
  input: UpdateSourceObjectsInput;
}>;


export type UpdateSourceObjectsMutation = { __typename?: 'Mutation', updateSourceObjects: { __typename?: 'UpdateSourceObjectsResult', success: boolean, status: string, message?: string | null } };

export type CreateGeoLocationMutationVariables = Exact<{
  input: CreateGeoLocationInput;
}>;


export type CreateGeoLocationMutation = { __typename?: 'Mutation', createGeoLocation: { __typename?: 'CreateGeoLocationResult', GeoLocation?: { __typename?: 'GeoLocation', idGeoLocation: number } | null } };

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput;
}>;


export type CreateProjectMutation = { __typename?: 'Mutation', createProject: { __typename?: 'CreateProjectResult', Project?: { __typename?: 'Project', idProject: number, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null } | null } };

export type CreateSubjectMutationVariables = Exact<{
  input: CreateSubjectInput;
}>;


export type CreateSubjectMutation = { __typename?: 'Mutation', createSubject: { __typename?: 'CreateSubjectResult', Subject?: { __typename?: 'Subject', idSubject: number } | null } };

export type CreateUnitMutationVariables = Exact<{
  input: CreateUnitInput;
}>;


export type CreateUnitMutation = { __typename?: 'Mutation', createUnit: { __typename?: 'CreateUnitResult', Unit?: { __typename?: 'Unit', idUnit: number, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null } | null } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'CreateUserResult', User?: { __typename?: 'User', idUser: number, Name: string, Active: boolean, DateActivated: any, WorkflowNotificationTime?: any | null, EmailSettings?: number | null } | null } };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'CreateUserResult', User?: { __typename?: 'User', idUser: number, EmailAddress: string, Name: string, Active: boolean, DateActivated: any, DateDisabled?: any | null, EmailSettings?: number | null, WorkflowNotificationTime?: any | null } | null } };

export type CreateVocabularyMutationVariables = Exact<{
  input: CreateVocabularyInput;
}>;


export type CreateVocabularyMutation = { __typename?: 'Mutation', createVocabulary: { __typename?: 'CreateVocabularyResult', Vocabulary?: { __typename?: 'Vocabulary', idVocabulary: number } | null } };

export type CreateVocabularySetMutationVariables = Exact<{
  input: CreateVocabularySetInput;
}>;


export type CreateVocabularySetMutation = { __typename?: 'Mutation', createVocabularySet: { __typename?: 'CreateVocabularySetResult', VocabularySet?: { __typename?: 'VocabularySet', idVocabularySet: number } | null } };

export type GetAccessPolicyQueryVariables = Exact<{
  input: GetAccessPolicyInput;
}>;


export type GetAccessPolicyQuery = { __typename?: 'Query', getAccessPolicy: { __typename?: 'GetAccessPolicyResult', AccessPolicy?: { __typename?: 'AccessPolicy', idAccessPolicy: number } | null } };

export type GetAssetQueryVariables = Exact<{
  input: GetAssetInput;
}>;


export type GetAssetQuery = { __typename?: 'Query', getAsset: { __typename?: 'GetAssetResult', Asset?: { __typename?: 'Asset', idAsset: number, idVAssetType?: number | null } | null } };

export type GetAssetVersionsDetailsQueryVariables = Exact<{
  input: GetAssetVersionsDetailsInput;
}>;


export type GetAssetVersionsDetailsQuery = { __typename?: 'Query', getAssetVersionsDetails: { __typename?: 'GetAssetVersionsDetailsResult', valid: boolean, Details: Array<{ __typename?: 'GetAssetVersionDetailResult', idAssetVersion: number, SubjectUnitIdentifier?: { __typename?: 'SubjectUnitIdentifier', idSubject: number, idSystemObject: number, SubjectName: string, UnitAbbreviation: string, IdentifierPublic?: string | null, IdentifierCollection?: string | null } | null, Project?: Array<{ __typename?: 'Project', idProject: number, Name: string }> | null, Item?: { __typename?: 'Item', idItem: number, Name: string, EntireSubject: boolean } | null, CaptureDataPhoto?: { __typename?: 'IngestPhotogrammetry', idAssetVersion: number, dateCaptured: string, datasetType: number, systemCreated: boolean, description: string, cameraSettingUniform: boolean, datasetFieldId?: number | null, itemPositionType?: number | null, itemPositionFieldId?: number | null, itemArrangementFieldId?: number | null, focusType?: number | null, lightsourceType?: number | null, backgroundRemovalMethod?: number | null, clusterType?: number | null, clusterGeometryFieldId?: number | null, directory: string, folders: Array<{ __typename?: 'IngestFolder', name: string, variantType?: number | null }>, identifiers: Array<{ __typename?: 'IngestIdentifier', identifier: string, identifierType: number, idIdentifier: number }> } | null, Model?: { __typename?: 'IngestModel', idAssetVersion: number, systemCreated: boolean, name: string, creationMethod: number, modality: number, purpose: number, units: number, dateCreated: string, modelFileType: number, directory: string, identifiers: Array<{ __typename?: 'IngestIdentifier', identifier: string, identifierType: number, idIdentifier: number }> } | null, Scene?: { __typename?: 'IngestScene', idAssetVersion: number, systemCreated: boolean, name: string, directory: string, approvedForPublication: boolean, posedAndQCd: boolean, identifiers: Array<{ __typename?: 'IngestIdentifier', identifier: string, identifierType: number, idIdentifier: number }> } | null }> } };

export type GetContentsForAssetVersionsQueryVariables = Exact<{
  input: GetContentsForAssetVersionsInput;
}>;


export type GetContentsForAssetVersionsQuery = { __typename?: 'Query', getContentsForAssetVersions: { __typename?: 'GetContentsForAssetVersionsResult', AssetVersionContent: Array<{ __typename?: 'AssetVersionContent', idAssetVersion: number, folders: Array<string>, all: Array<string> }> } };

export type GetModelConstellationForAssetVersionQueryVariables = Exact<{
  input: GetModelConstellationForAssetVersionInput;
}>;


export type GetModelConstellationForAssetVersionQuery = { __typename?: 'Query', getModelConstellationForAssetVersion: { __typename?: 'GetModelConstellationForAssetVersionResult', idAssetVersion: number, ModelConstellation?: { __typename?: 'ModelConstellation', Model: { __typename?: 'Model', idModel: number, CountVertices?: number | null, CountFaces?: number | null, CountTriangles?: number | null, CountAnimations?: number | null, CountCameras?: number | null, CountLights?: number | null, CountMaterials?: number | null, CountMeshes?: number | null, CountEmbeddedTextures?: number | null, CountLinkedTextures?: number | null, FileEncoding?: string | null, IsDracoCompressed?: boolean | null, Name: string, idVFileType?: number | null }, ModelObjects?: Array<{ __typename?: 'ModelObject', idModelObject: number, BoundingBoxP1X?: number | null, BoundingBoxP1Y?: number | null, BoundingBoxP1Z?: number | null, BoundingBoxP2X?: number | null, BoundingBoxP2Y?: number | null, BoundingBoxP2Z?: number | null, CountVertices?: number | null, CountFaces?: number | null, CountTriangles?: number | null, CountColorChannels?: number | null, CountTextureCoordinateChannels?: number | null, HasBones?: boolean | null, HasFaceNormals?: boolean | null, HasTangents?: boolean | null, HasTextureCoordinates?: boolean | null, HasVertexNormals?: boolean | null, HasVertexColor?: boolean | null, IsTwoManifoldUnbounded?: boolean | null, IsTwoManifoldBounded?: boolean | null, IsWatertight?: boolean | null, SelfIntersecting?: boolean | null }> | null, ModelMaterials?: Array<{ __typename?: 'ModelMaterial', idModelMaterial: number, Name?: string | null }> | null, ModelMaterialChannels?: Array<{ __typename?: 'ModelMaterialChannel', Type?: string | null, Source?: string | null, Value?: string | null, AdditionalAttributes?: string | null, idModelMaterial: number, idModelMaterialChannel: number }> | null, ModelObjectModelMaterialXref?: Array<{ __typename?: 'ModelObjectModelMaterialXref', idModelObjectModelMaterialXref: number, idModelObject: number, idModelMaterial: number }> | null, ModelAssets?: Array<{ __typename?: 'ModelAsset', AssetName: string, AssetType: string }> | null } | null } };

export type GetUploadedAssetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUploadedAssetVersionQuery = { __typename?: 'Query', getUploadedAssetVersion: { __typename?: 'GetUploadedAssetVersionResult', idAssetVersionsUpdated: Array<number>, AssetVersion: Array<{ __typename?: 'AssetVersion', idAssetVersion: number, StorageSize: any, FileName: string, DateCreated: any, idSOAttachment?: number | null, SOAttachmentObjectType?: number | null, Asset?: { __typename?: 'Asset', idAsset: number, VAssetType?: { __typename?: 'Vocabulary', idVocabulary: number, Term: string } | null } | null }>, UpdatedAssetVersionMetadata: Array<{ __typename?: 'UpdatedAssetVersionMetadata', idAssetVersion: number, UpdatedObjectName: string, Item?: { __typename?: 'Item', Name: string } | null, CaptureDataPhoto?: { __typename?: 'UpdatePhotogrammetryMetadata', name: string, dateCaptured: string, datasetType: number, description: string, cameraSettingUniform: boolean, datasetFieldId?: number | null, itemPositionType?: number | null, itemPositionFieldId?: number | null, itemArrangementFieldId?: number | null, focusType?: number | null, lightsourceType?: number | null, backgroundRemovalMethod?: number | null, clusterType?: number | null, clusterGeometryFieldId?: number | null, folders: Array<{ __typename?: 'IngestFolder', name: string, variantType?: number | null }> } | null, Model?: { __typename?: 'UpdateModelMetadata', name: string, creationMethod: number, modality: number, purpose: number, units: number, dateCreated: string, modelFileType: number } | null, Scene?: { __typename?: 'UpdateSceneMetadata', name: string, approvedForPublication: boolean, posedAndQCd: boolean, referenceModels?: Array<{ __typename?: 'ReferenceModel', idSystemObject: number, name: string, usage: string, quality: string, fileSize: any, resolution?: number | null, boundingBoxP1X?: number | null, boundingBoxP1Y?: number | null, boundingBoxP1Z?: number | null, boundingBoxP2X?: number | null, boundingBoxP2Y?: number | null, boundingBoxP2Z?: number | null }> | null } | null }> } };

export type GetCaptureDataQueryVariables = Exact<{
  input: GetCaptureDataInput;
}>;


export type GetCaptureDataQuery = { __typename?: 'Query', getCaptureData: { __typename?: 'GetCaptureDataResult', CaptureData?: { __typename?: 'CaptureData', idCaptureData: number } | null } };

export type GetCaptureDataPhotoQueryVariables = Exact<{
  input: GetCaptureDataPhotoInput;
}>;


export type GetCaptureDataPhotoQuery = { __typename?: 'Query', getCaptureDataPhoto: { __typename?: 'GetCaptureDataPhotoResult', CaptureDataPhoto?: { __typename?: 'CaptureDataPhoto', idCaptureDataPhoto: number } | null } };

export type AreCameraSettingsUniformQueryVariables = Exact<{
  input: AreCameraSettingsUniformInput;
}>;


export type AreCameraSettingsUniformQuery = { __typename?: 'Query', areCameraSettingsUniform: { __typename?: 'AreCameraSettingsUniformResult', isUniform: boolean } };

export type GetIngestTitleQueryVariables = Exact<{
  input: GetIngestTitleInput;
}>;


export type GetIngestTitleQuery = { __typename?: 'Query', getIngestTitle: { __typename?: 'GetIngestTitleResult', ingestTitle?: { __typename?: 'IngestTitle', title: string, forced: boolean, subtitle?: Array<string | null> | null } | null } };

export type GetLicenseQueryVariables = Exact<{
  input: GetLicenseInput;
}>;


export type GetLicenseQuery = { __typename?: 'Query', getLicense: { __typename?: 'GetLicenseResult', License?: { __typename?: 'License', idLicense: number, Description: string, Name: string, RestrictLevel: number } | null } };

export type GetLicenseListQueryVariables = Exact<{
  input: GetLicenseListInput;
}>;


export type GetLicenseListQuery = { __typename?: 'Query', getLicenseList: { __typename?: 'GetLicenseListResult', Licenses: Array<{ __typename?: 'License', idLicense: number, Description: string, Name: string, RestrictLevel: number }> } };

export type GetModelQueryVariables = Exact<{
  input: GetModelInput;
}>;


export type GetModelQuery = { __typename?: 'Query', getModel: { __typename?: 'GetModelResult', Model?: { __typename?: 'Model', idModel: number, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number, idAsset?: number | null, idAssetVersion?: number | null } | null } | null } };

export type GetModelConstellationQueryVariables = Exact<{
  input: GetModelConstellationInput;
}>;


export type GetModelConstellationQuery = { __typename?: 'Query', getModelConstellation: { __typename?: 'GetModelConstellationResult', ModelConstellation?: { __typename?: 'ModelConstellation', Model: { __typename?: 'Model', idModel: number, Name: string, DateCreated: any, idAssetThumbnail?: number | null, CountAnimations?: number | null, CountCameras?: number | null, CountFaces?: number | null, CountTriangles?: number | null, CountLights?: number | null, CountMaterials?: number | null, CountMeshes?: number | null, CountVertices?: number | null, CountEmbeddedTextures?: number | null, CountLinkedTextures?: number | null, FileEncoding?: string | null, IsDracoCompressed?: boolean | null, VCreationMethod?: { __typename?: 'Vocabulary', Term: string } | null, VModality?: { __typename?: 'Vocabulary', Term: string } | null, VPurpose?: { __typename?: 'Vocabulary', Term: string } | null, VUnits?: { __typename?: 'Vocabulary', Term: string } | null, VFileType?: { __typename?: 'Vocabulary', Term: string } | null }, ModelObjects?: Array<{ __typename?: 'ModelObject', idModelObject: number, idModel: number, BoundingBoxP1X?: number | null, BoundingBoxP1Y?: number | null, BoundingBoxP1Z?: number | null, BoundingBoxP2X?: number | null, BoundingBoxP2Y?: number | null, BoundingBoxP2Z?: number | null, CountVertices?: number | null, CountFaces?: number | null, CountTriangles?: number | null, CountColorChannels?: number | null, CountTextureCoordinateChannels?: number | null, HasBones?: boolean | null, HasFaceNormals?: boolean | null, HasTangents?: boolean | null, HasTextureCoordinates?: boolean | null, HasVertexNormals?: boolean | null, HasVertexColor?: boolean | null, IsTwoManifoldUnbounded?: boolean | null, IsTwoManifoldBounded?: boolean | null, IsWatertight?: boolean | null, SelfIntersecting?: boolean | null }> | null, ModelMaterials?: Array<{ __typename?: 'ModelMaterial', idModelMaterial: number, Name?: string | null }> | null, ModelMaterialChannels?: Array<{ __typename?: 'ModelMaterialChannel', idModelMaterialChannel: number, idModelMaterial: number, Type?: string | null, Source?: string | null, Value?: string | null, MaterialTypeOther?: string | null, idModelMaterialUVMap?: number | null, UVMapEmbedded?: boolean | null, ChannelPosition?: number | null, ChannelWidth?: number | null, Scalar1?: number | null, Scalar2?: number | null, Scalar3?: number | null, Scalar4?: number | null, AdditionalAttributes?: string | null, VMaterialType?: { __typename?: 'Vocabulary', Term: string } | null }> | null, ModelMaterialUVMaps?: Array<{ __typename?: 'ModelMaterialUVMap', idModelMaterialUVMap: number, idModel: number, idAsset: number, UVMapEdgeLength: number }> | null, ModelObjectModelMaterialXref?: Array<{ __typename?: 'ModelObjectModelMaterialXref', idModelObject: number, idModelMaterial: number }> | null, ModelAssets?: Array<{ __typename?: 'ModelAsset', AssetName: string, AssetType: string, AssetVersion: { __typename?: 'AssetVersion', idAsset: number, idAssetVersion: number, FileName: string } }> | null } | null } };

export type GetFilterViewDataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFilterViewDataQuery = { __typename?: 'Query', getFilterViewData: { __typename?: 'GetFilterViewDataResult', units: Array<{ __typename?: 'Unit', idUnit: number, Name: string, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null }>, projects: Array<{ __typename?: 'Project', idProject: number, Name: string, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null }> } };

export type GetObjectChildrenQueryVariables = Exact<{
  input: GetObjectChildrenInput;
}>;


export type GetObjectChildrenQuery = { __typename?: 'Query', getObjectChildren: { __typename?: 'GetObjectChildrenResult', success: boolean, error?: string | null, metadataColumns: Array<number>, cursorMark?: string | null, entries: Array<{ __typename?: 'NavigationResultEntry', idSystemObject: number, name: string, objectType: number, idObject: number, metadata: Array<string> }> } };

export type GetIntermediaryFileQueryVariables = Exact<{
  input: GetIntermediaryFileInput;
}>;


export type GetIntermediaryFileQuery = { __typename?: 'Query', getIntermediaryFile: { __typename?: 'GetIntermediaryFileResult', IntermediaryFile?: { __typename?: 'IntermediaryFile', idIntermediaryFile: number } | null } };

export type GetSceneQueryVariables = Exact<{
  input: GetSceneInput;
}>;


export type GetSceneQuery = { __typename?: 'Query', getScene: { __typename?: 'GetSceneResult', Scene?: { __typename?: 'Scene', idScene: number, Name: string, CountCamera?: number | null, CountScene?: number | null, CountNode?: number | null, CountLight?: number | null, CountModel?: number | null, CountMeta?: number | null, CountSetup?: number | null, CountTour?: number | null, EdanUUID?: string | null, ApprovedForPublication: boolean, PosedAndQCd: boolean, CanBeQCd?: boolean | null, ModelSceneXref?: Array<{ __typename?: 'ModelSceneXref', idModelSceneXref: number, idModel: number, idScene: number, Name?: string | null, Usage?: string | null, Quality?: string | null, FileSize?: any | null, UVResolution?: number | null, BoundingBoxP1X?: number | null, BoundingBoxP1Y?: number | null, BoundingBoxP1Z?: number | null, BoundingBoxP2X?: number | null, BoundingBoxP2Y?: number | null, BoundingBoxP2Z?: number | null } | null> | null } | null } };

export type GetSceneForAssetVersionQueryVariables = Exact<{
  input: GetSceneForAssetVersionInput;
}>;


export type GetSceneForAssetVersionQuery = { __typename?: 'Query', getSceneForAssetVersion: { __typename?: 'GetSceneForAssetVersionResult', idAssetVersion: number, success: boolean, message?: string | null, SceneConstellation?: { __typename?: 'SceneConstellation', Scene?: { __typename?: 'Scene', idScene: number, idAssetThumbnail?: number | null, Name: string, CountScene?: number | null, CountNode?: number | null, CountCamera?: number | null, CountLight?: number | null, CountModel?: number | null, CountMeta?: number | null, CountSetup?: number | null, CountTour?: number | null, ApprovedForPublication: boolean, PosedAndQCd: boolean } | null, ModelSceneXref?: Array<{ __typename?: 'ModelSceneXref', idModelSceneXref: number, idModel: number, idScene: number, Name?: string | null, Usage?: string | null, Quality?: string | null, FileSize?: any | null, UVResolution?: number | null, BoundingBoxP1X?: number | null, BoundingBoxP1Y?: number | null, BoundingBoxP1Z?: number | null, BoundingBoxP2X?: number | null, BoundingBoxP2Y?: number | null, BoundingBoxP2Z?: number | null, Model?: { __typename?: 'Model', SystemObject?: { __typename?: 'SystemObject', idSystemObject: number, idAsset?: number | null } | null } | null } | null> | null, SvxNonModelAssets?: Array<{ __typename?: 'SvxNonModelAsset', uri: string, type: string, description?: string | null, size?: number | null, idAssetVersion?: number | null }> | null } | null } };

export type GetAssetDetailsForSystemObjectQueryVariables = Exact<{
  input: GetAssetDetailsForSystemObjectInput;
}>;


export type GetAssetDetailsForSystemObjectQuery = { __typename?: 'Query', getAssetDetailsForSystemObject: { __typename?: 'GetAssetDetailsForSystemObjectResult', assetDetailRows: Array<any>, columns: Array<{ __typename?: 'ColumnDefinition', colName: string, colDisplay: boolean, colType: number, colAlign: string, colLabel: string }> } };

export type GetDetailsTabDataForObjectQueryVariables = Exact<{
  input: GetDetailsTabDataForObjectInput;
}>;


export type GetDetailsTabDataForObjectQuery = { __typename?: 'Query', getDetailsTabDataForObject: { __typename?: 'GetDetailsTabDataForObjectResult', Unit?: { __typename?: 'UnitDetailFields', Abbreviation?: string | null, ARKPrefix?: string | null } | null, Project?: { __typename?: 'ProjectDetailFields', Description?: string | null } | null, Subject?: { __typename?: 'SubjectDetailFields', Altitude?: number | null, Latitude?: number | null, Longitude?: number | null, R0?: number | null, R1?: number | null, R2?: number | null, R3?: number | null, TS0?: number | null, TS1?: number | null, TS2?: number | null, idIdentifierPreferred?: number | null } | null, Item?: { __typename?: 'ItemDetailFields', EntireSubject?: boolean | null, Altitude?: number | null, Latitude?: number | null, Longitude?: number | null, R0?: number | null, R1?: number | null, R2?: number | null, R3?: number | null, TS0?: number | null, TS1?: number | null, TS2?: number | null } | null, CaptureData?: { __typename?: 'CaptureDataDetailFields', captureMethod?: number | null, dateCaptured?: string | null, datasetType?: number | null, description?: string | null, cameraSettingUniform?: boolean | null, datasetFieldId?: number | null, itemPositionType?: number | null, itemPositionFieldId?: number | null, itemArrangementFieldId?: number | null, focusType?: number | null, lightsourceType?: number | null, backgroundRemovalMethod?: number | null, clusterType?: number | null, clusterGeometryFieldId?: number | null, isValidData?: boolean | null, folders: Array<{ __typename?: 'IngestFolder', name: string, variantType?: number | null }> } | null, Model?: { __typename?: 'ModelConstellation', Model: { __typename?: 'Model', idModel: number, CountVertices?: number | null, CountFaces?: number | null, CountTriangles?: number | null, CountAnimations?: number | null, CountCameras?: number | null, CountLights?: number | null, CountMaterials?: number | null, CountMeshes?: number | null, CountEmbeddedTextures?: number | null, CountLinkedTextures?: number | null, FileEncoding?: string | null, IsDracoCompressed?: boolean | null, Name: string, DateCreated: any, idVCreationMethod?: number | null, idVModality?: number | null, idVUnits?: number | null, idVPurpose?: number | null, idVFileType?: number | null }, ModelObjects?: Array<{ __typename?: 'ModelObject', idModelObject: number, BoundingBoxP1X?: number | null, BoundingBoxP1Y?: number | null, BoundingBoxP1Z?: number | null, BoundingBoxP2X?: number | null, BoundingBoxP2Y?: number | null, BoundingBoxP2Z?: number | null, CountVertices?: number | null, CountFaces?: number | null, CountTriangles?: number | null, CountColorChannels?: number | null, CountTextureCoordinateChannels?: number | null, HasBones?: boolean | null, HasFaceNormals?: boolean | null, HasTangents?: boolean | null, HasTextureCoordinates?: boolean | null, HasVertexNormals?: boolean | null, HasVertexColor?: boolean | null, IsTwoManifoldUnbounded?: boolean | null, IsTwoManifoldBounded?: boolean | null, IsWatertight?: boolean | null, SelfIntersecting?: boolean | null }> | null, ModelMaterials?: Array<{ __typename?: 'ModelMaterial', idModelMaterial: number, Name?: string | null }> | null, ModelMaterialChannels?: Array<{ __typename?: 'ModelMaterialChannel', Type?: string | null, Source?: string | null, Value?: string | null, AdditionalAttributes?: string | null, idModelMaterial: number, idModelMaterialChannel: number }> | null, ModelObjectModelMaterialXref?: Array<{ __typename?: 'ModelObjectModelMaterialXref', idModelObjectModelMaterialXref: number, idModelObject: number, idModelMaterial: number }> | null, ModelAssets?: Array<{ __typename?: 'ModelAsset', AssetName: string, AssetType: string }> | null } | null, Scene?: { __typename?: 'SceneDetailFields', Links: Array<string>, AssetType?: number | null, Tours?: number | null, Annotation?: number | null, EdanUUID?: string | null, ApprovedForPublication?: boolean | null, PublicationApprover?: string | null, PosedAndQCd?: boolean | null, CanBeQCd?: boolean | null, idScene?: number | null } | null, IntermediaryFile?: { __typename?: 'IntermediaryFileDetailFields', idIntermediaryFile: number } | null, ProjectDocumentation?: { __typename?: 'ProjectDocumentationDetailFields', Description?: string | null } | null, Asset?: { __typename?: 'AssetDetailFields', AssetType?: number | null, idAsset?: number | null } | null, AssetVersion?: { __typename?: 'AssetVersionDetailFields', Creator?: string | null, DateCreated?: any | null, StorageSize?: any | null, Ingested?: boolean | null, Version?: number | null, idAsset?: number | null, idAssetVersion?: number | null, FilePath?: string | null, StorageHash?: string | null } | null, Actor?: { __typename?: 'ActorDetailFields', OrganizationName?: string | null } | null, Stakeholder?: { __typename?: 'StakeholderDetailFields', OrganizationName?: string | null, EmailAddress?: string | null, PhoneNumberMobile?: string | null, PhoneNumberOffice?: string | null, MailingAddress?: string | null } | null } };

export type GetProjectListQueryVariables = Exact<{
  input: GetProjectListInput;
}>;


export type GetProjectListQuery = { __typename?: 'Query', getProjectList: { __typename?: 'GetProjectListResult', projects: Array<{ __typename?: 'Project', idProject: number, Name: string, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null }> } };

export type GetSourceObjectIdentiferQueryVariables = Exact<{
  input: GetSourceObjectIdentiferInput;
}>;


export type GetSourceObjectIdentiferQuery = { __typename?: 'Query', getSourceObjectIdentifer: { __typename?: 'GetSourceObjectIdentiferResult', sourceObjectIdentifiers: Array<{ __typename?: 'SourceObjectIdentifier', idSystemObject: number, identifier?: string | null }> } };

export type GetSubjectListQueryVariables = Exact<{
  input: GetSubjectListInput;
}>;


export type GetSubjectListQuery = { __typename?: 'Query', getSubjectList: { __typename?: 'GetSubjectListResult', subjects: Array<{ __typename?: 'SubjectUnitIdentifier', idSubject: number, idSystemObject: number, UnitAbbreviation: string, SubjectName: string, IdentifierPublic?: string | null }> } };

export type GetSystemObjectDetailsQueryVariables = Exact<{
  input: GetSystemObjectDetailsInput;
}>;


export type GetSystemObjectDetailsQuery = { __typename?: 'Query', getSystemObjectDetails: { __typename?: 'GetSystemObjectDetailsResult', idSystemObject: number, idObject: number, name: string, subTitle?: string | null, retired: boolean, objectType: number, allowed: boolean, publishedState: string, publishedEnum: number, publishable: boolean, thumbnail?: string | null, licenseInheritance?: number | null, identifiers: Array<{ __typename?: 'IngestIdentifier', identifier: string, identifierType: number, idIdentifier: number }>, unit?: Array<{ __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number }> | null, project?: Array<{ __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number }> | null, subject?: Array<{ __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number }> | null, item?: Array<{ __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number }> | null, asset?: { __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number } | null, assetOwner?: { __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number } | null, objectAncestors: Array<Array<{ __typename?: 'RepositoryPath', idSystemObject: number, name: string, objectType: number }>>, sourceObjects: Array<{ __typename?: 'RelatedObject', idSystemObject: number, name: string, identifier?: string | null, objectType: number }>, derivedObjects: Array<{ __typename?: 'RelatedObject', idSystemObject: number, name: string, identifier?: string | null, objectType: number }>, objectVersions: Array<{ __typename?: 'SystemObjectVersion', idSystemObjectVersion: number, idSystemObject: number, PublishedState: number, DateCreated: any, Comment?: string | null, CommentLink?: string | null }>, metadata: Array<{ __typename?: 'Metadata', idMetadata: number, Name: string, ValueShort?: string | null, ValueExtended?: string | null, idAssetVersionValue?: number | null, idVMetadataSource?: number | null, Value?: string | null, Label?: string | null }>, license?: { __typename?: 'License', idLicense: number, Name: string, Description: string, RestrictLevel: number } | null } };

export type GetVersionsForAssetQueryVariables = Exact<{
  input: GetVersionsForAssetInput;
}>;


export type GetVersionsForAssetQuery = { __typename?: 'Query', getVersionsForAsset: { __typename?: 'GetVersionsForAssetResult', versions: Array<{ __typename?: 'DetailVersion', idSystemObject: number, idAssetVersion: number, version: number, name: string, creator: string, dateCreated: any, size: any, hash: string, ingested: boolean, Comment?: string | null, CommentLink?: string | null }> } };

export type GetEdanUnitsNamedQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEdanUnitsNamedQuery = { __typename?: 'Query', getEdanUnitsNamed: { __typename?: 'GetEdanUnitsNamedResult', UnitEdan?: Array<{ __typename?: 'UnitEdan', idUnitEdan: number, Name?: string | null, Abbreviation: string, idUnit?: number | null }> | null } };

export type GetIngestionItemsQueryVariables = Exact<{
  input: GetIngestionItemsInput;
}>;


export type GetIngestionItemsQuery = { __typename?: 'Query', getIngestionItems: { __typename?: 'GetIngestionItemsResult', IngestionItem?: Array<{ __typename?: 'IngestionItem', idItem: number, EntireSubject: boolean, MediaGroupName: string, idProject: number, ProjectName: string }> | null } };

export type GetItemQueryVariables = Exact<{
  input: GetItemInput;
}>;


export type GetItemQuery = { __typename?: 'Query', getItem: { __typename?: 'GetItemResult', Item?: { __typename?: 'Item', idItem: number } | null } };

export type GetItemsForSubjectQueryVariables = Exact<{
  input: GetItemsForSubjectInput;
}>;


export type GetItemsForSubjectQuery = { __typename?: 'Query', getItemsForSubject: { __typename?: 'GetItemsForSubjectResult', Item: Array<{ __typename?: 'Item', idItem: number, Name: string }> } };

export type GetObjectsForItemQueryVariables = Exact<{
  input: GetObjectsForItemInput;
}>;


export type GetObjectsForItemQuery = { __typename?: 'Query', getObjectsForItem: { __typename?: 'GetObjectsForItemResult', CaptureData: Array<{ __typename?: 'CaptureData', idCaptureData: number, DateCaptured: any, Description: string }>, Model: Array<{ __typename?: 'Model', idModel: number, DateCreated: any }>, Scene: Array<{ __typename?: 'Scene', idScene: number, Name: string, ApprovedForPublication: boolean, PosedAndQCd: boolean }>, IntermediaryFile: Array<{ __typename?: 'IntermediaryFile', idIntermediaryFile: number, DateCreated: any }>, ProjectDocumentation: Array<{ __typename?: 'ProjectDocumentation', idProjectDocumentation: number, Description: string, Name: string }> } };

export type GetProjectQueryVariables = Exact<{
  input: GetProjectInput;
}>;


export type GetProjectQuery = { __typename?: 'Query', getProject: { __typename?: 'GetProjectResult', Project?: { __typename?: 'Project', idProject: number, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null } | null } };

export type GetProjectDocumentationQueryVariables = Exact<{
  input: GetProjectDocumentationInput;
}>;


export type GetProjectDocumentationQuery = { __typename?: 'Query', getProjectDocumentation: { __typename?: 'GetProjectDocumentationResult', ProjectDocumentation?: { __typename?: 'ProjectDocumentation', idProjectDocumentation: number } | null } };

export type GetSubjectQueryVariables = Exact<{
  input: GetSubjectInput;
}>;


export type GetSubjectQuery = { __typename?: 'Query', getSubject: { __typename?: 'GetSubjectResult', Subject?: { __typename?: 'Subject', idSubject: number, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null } | null } };

export type GetSubjectsForUnitQueryVariables = Exact<{
  input: GetSubjectsForUnitInput;
}>;


export type GetSubjectsForUnitQuery = { __typename?: 'Query', getSubjectsForUnit: { __typename?: 'GetSubjectsForUnitResult', Subject: Array<{ __typename?: 'Subject', idSubject: number, Name: string }> } };

export type GetUnitQueryVariables = Exact<{
  input: GetUnitInput;
}>;


export type GetUnitQuery = { __typename?: 'Query', getUnit: { __typename?: 'GetUnitResult', Unit?: { __typename?: 'Unit', idUnit: number } | null } };

export type GetUnitsFromEdanAbbreviationQueryVariables = Exact<{
  input: GetUnitsFromEdanAbbreviationInput;
}>;


export type GetUnitsFromEdanAbbreviationQuery = { __typename?: 'Query', getUnitsFromEdanAbbreviation: { __typename?: 'GetUnitsFromEdanAbbreviationResult', Units: Array<{ __typename?: 'Unit', idUnit: number, Name: string }> } };

export type GetUnitsFromNameSearchQueryVariables = Exact<{
  input: GetUnitsFromNameSearchInput;
}>;


export type GetUnitsFromNameSearchQuery = { __typename?: 'Query', getUnitsFromNameSearch: { __typename?: 'GetUnitsFromNameSearchResult', Units: Array<{ __typename?: 'Unit', idUnit: number, Name: string, Abbreviation?: string | null, SystemObject?: { __typename?: 'SystemObject', idSystemObject: number } | null }> } };

export type SearchIngestionSubjectsQueryVariables = Exact<{
  input: SearchIngestionSubjectsInput;
}>;


export type SearchIngestionSubjectsQuery = { __typename?: 'Query', searchIngestionSubjects: { __typename?: 'SearchIngestionSubjectsResult', SubjectUnitIdentifier: Array<{ __typename?: 'SubjectUnitIdentifier', idSubject: number, idSystemObject: number, SubjectName: string, UnitAbbreviation: string, IdentifierPublic?: string | null, IdentifierCollection?: string | null }> } };

export type GetAllUsersQueryVariables = Exact<{
  input: GetAllUsersInput;
}>;


export type GetAllUsersQuery = { __typename?: 'Query', getAllUsers: { __typename?: 'GetAllUsersResult', User: Array<{ __typename?: 'User', idUser: number, Active: boolean, DateActivated: any, EmailAddress: string, Name: string, SecurityID: string, DateDisabled?: any | null, EmailSettings?: number | null, WorkflowNotificationTime?: any | null }> } };

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { __typename?: 'Query', getCurrentUser: { __typename?: 'GetCurrentUserResult', User?: { __typename?: 'User', idUser: number, Name: string, Active: boolean, DateActivated: any, DateDisabled?: any | null, EmailAddress: string, EmailSettings?: number | null, SecurityID: string, WorkflowNotificationTime?: any | null } | null } };

export type GetUserQueryVariables = Exact<{
  input: GetUserInput;
}>;


export type GetUserQuery = { __typename?: 'Query', getUser: { __typename?: 'GetUserResult', User?: { __typename?: 'User', idUser: number, Name: string, Active: boolean, DateActivated: any, DateDisabled?: any | null, EmailSettings?: number | null, EmailAddress: string, WorkflowNotificationTime?: any | null } | null } };

export type GetVocabularyQueryVariables = Exact<{
  input: GetVocabularyInput;
}>;


export type GetVocabularyQuery = { __typename?: 'Query', getVocabulary: { __typename?: 'GetVocabularyResult', Vocabulary?: { __typename?: 'Vocabulary', idVocabulary: number } | null } };

export type GetVocabularyEntriesQueryVariables = Exact<{
  input: GetVocabularyEntriesInput;
}>;


export type GetVocabularyEntriesQuery = { __typename?: 'Query', getVocabularyEntries: { __typename?: 'GetVocabularyEntriesResult', VocabularyEntries: Array<{ __typename?: 'VocabularyEntry', eVocabSetID: number, Vocabulary: Array<{ __typename?: 'Vocabulary', idVocabulary: number, Term: string, eVocabID?: number | null }> }> } };

export type GetWorkflowQueryVariables = Exact<{
  input: GetWorkflowInput;
}>;


export type GetWorkflowQuery = { __typename?: 'Query', getWorkflow: { __typename?: 'GetWorkflowResult', Workflow?: { __typename?: 'Workflow', idWorkflow: number } | null } };

export type GetWorkflowListQueryVariables = Exact<{
  input: GetWorkflowListInput;
}>;


export type GetWorkflowListQuery = { __typename?: 'Query', getWorkflowList: { __typename?: 'GetWorkflowListResult', WorkflowList?: Array<{ __typename?: 'WorkflowListResult', idWorkflow: number, idWorkflowSet?: number | null, idWorkflowReport?: number | null, idJobRun?: number | null, Type?: string | null, State?: string | null, DateStart?: any | null, DateLast?: any | null, Error?: string | null, Owner?: { __typename?: 'User', Name: string } | null } | null> | null } };


export const DiscardUploadedAssetVersionsDocument = gql`
    mutation discardUploadedAssetVersions($input: DiscardUploadedAssetVersionsInput!) {
  discardUploadedAssetVersions(input: $input) {
    success
  }
}
    `;
export type DiscardUploadedAssetVersionsMutationFn = Apollo.MutationFunction<DiscardUploadedAssetVersionsMutation, DiscardUploadedAssetVersionsMutationVariables>;

/**
 * __useDiscardUploadedAssetVersionsMutation__
 *
 * To run a mutation, you first call `useDiscardUploadedAssetVersionsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDiscardUploadedAssetVersionsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [discardUploadedAssetVersionsMutation, { data, loading, error }] = useDiscardUploadedAssetVersionsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDiscardUploadedAssetVersionsMutation(baseOptions?: Apollo.MutationHookOptions<DiscardUploadedAssetVersionsMutation, DiscardUploadedAssetVersionsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DiscardUploadedAssetVersionsMutation, DiscardUploadedAssetVersionsMutationVariables>(DiscardUploadedAssetVersionsDocument, options);
      }
export type DiscardUploadedAssetVersionsMutationHookResult = ReturnType<typeof useDiscardUploadedAssetVersionsMutation>;
export type DiscardUploadedAssetVersionsMutationResult = Apollo.MutationResult<DiscardUploadedAssetVersionsMutation>;
export type DiscardUploadedAssetVersionsMutationOptions = Apollo.BaseMutationOptions<DiscardUploadedAssetVersionsMutation, DiscardUploadedAssetVersionsMutationVariables>;
export const RollbackAssetVersionDocument = gql`
    mutation rollbackAssetVersion($input: RollbackAssetVersionInput!) {
  rollbackAssetVersion(input: $input) {
    success
    message
  }
}
    `;
export type RollbackAssetVersionMutationFn = Apollo.MutationFunction<RollbackAssetVersionMutation, RollbackAssetVersionMutationVariables>;

/**
 * __useRollbackAssetVersionMutation__
 *
 * To run a mutation, you first call `useRollbackAssetVersionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRollbackAssetVersionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rollbackAssetVersionMutation, { data, loading, error }] = useRollbackAssetVersionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRollbackAssetVersionMutation(baseOptions?: Apollo.MutationHookOptions<RollbackAssetVersionMutation, RollbackAssetVersionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RollbackAssetVersionMutation, RollbackAssetVersionMutationVariables>(RollbackAssetVersionDocument, options);
      }
export type RollbackAssetVersionMutationHookResult = ReturnType<typeof useRollbackAssetVersionMutation>;
export type RollbackAssetVersionMutationResult = Apollo.MutationResult<RollbackAssetVersionMutation>;
export type RollbackAssetVersionMutationOptions = Apollo.BaseMutationOptions<RollbackAssetVersionMutation, RollbackAssetVersionMutationVariables>;
export const UploadAssetDocument = gql`
    mutation uploadAsset($file: Upload!, $type: Int!, $idAsset: Int, $idSOAttachment: Int) {
  uploadAsset(
    file: $file
    type: $type
    idAsset: $idAsset
    idSOAttachment: $idSOAttachment
  ) {
    status
    idAssetVersions
    error
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
 *      idAsset: // value for 'idAsset'
 *      idSOAttachment: // value for 'idSOAttachment'
 *   },
 * });
 */
export function useUploadAssetMutation(baseOptions?: Apollo.MutationHookOptions<UploadAssetMutation, UploadAssetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UploadAssetMutation, UploadAssetMutationVariables>(UploadAssetDocument, options);
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCaptureDataMutation, CreateCaptureDataMutationVariables>(CreateCaptureDataDocument, options);
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateCaptureDataPhotoMutation, CreateCaptureDataPhotoMutationVariables>(CreateCaptureDataPhotoDocument, options);
      }
export type CreateCaptureDataPhotoMutationHookResult = ReturnType<typeof useCreateCaptureDataPhotoMutation>;
export type CreateCaptureDataPhotoMutationResult = Apollo.MutationResult<CreateCaptureDataPhotoMutation>;
export type CreateCaptureDataPhotoMutationOptions = Apollo.BaseMutationOptions<CreateCaptureDataPhotoMutation, CreateCaptureDataPhotoMutationVariables>;
export const IngestDataDocument = gql`
    mutation ingestData($input: IngestDataInput!) {
  ingestData(input: $input) {
    success
    message
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<IngestDataMutation, IngestDataMutationVariables>(IngestDataDocument, options);
      }
export type IngestDataMutationHookResult = ReturnType<typeof useIngestDataMutation>;
export type IngestDataMutationResult = Apollo.MutationResult<IngestDataMutation>;
export type IngestDataMutationOptions = Apollo.BaseMutationOptions<IngestDataMutation, IngestDataMutationVariables>;
export const AssignLicenseDocument = gql`
    mutation assignLicense($input: AssignLicenseInput!) {
  assignLicense(input: $input) {
    success
    message
  }
}
    `;
export type AssignLicenseMutationFn = Apollo.MutationFunction<AssignLicenseMutation, AssignLicenseMutationVariables>;

/**
 * __useAssignLicenseMutation__
 *
 * To run a mutation, you first call `useAssignLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignLicenseMutation, { data, loading, error }] = useAssignLicenseMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAssignLicenseMutation(baseOptions?: Apollo.MutationHookOptions<AssignLicenseMutation, AssignLicenseMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AssignLicenseMutation, AssignLicenseMutationVariables>(AssignLicenseDocument, options);
      }
export type AssignLicenseMutationHookResult = ReturnType<typeof useAssignLicenseMutation>;
export type AssignLicenseMutationResult = Apollo.MutationResult<AssignLicenseMutation>;
export type AssignLicenseMutationOptions = Apollo.BaseMutationOptions<AssignLicenseMutation, AssignLicenseMutationVariables>;
export const ClearLicenseAssignmentDocument = gql`
    mutation clearLicenseAssignment($input: ClearLicenseAssignmentInput!) {
  clearLicenseAssignment(input: $input) {
    success
    message
  }
}
    `;
export type ClearLicenseAssignmentMutationFn = Apollo.MutationFunction<ClearLicenseAssignmentMutation, ClearLicenseAssignmentMutationVariables>;

/**
 * __useClearLicenseAssignmentMutation__
 *
 * To run a mutation, you first call `useClearLicenseAssignmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useClearLicenseAssignmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [clearLicenseAssignmentMutation, { data, loading, error }] = useClearLicenseAssignmentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useClearLicenseAssignmentMutation(baseOptions?: Apollo.MutationHookOptions<ClearLicenseAssignmentMutation, ClearLicenseAssignmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ClearLicenseAssignmentMutation, ClearLicenseAssignmentMutationVariables>(ClearLicenseAssignmentDocument, options);
      }
export type ClearLicenseAssignmentMutationHookResult = ReturnType<typeof useClearLicenseAssignmentMutation>;
export type ClearLicenseAssignmentMutationResult = Apollo.MutationResult<ClearLicenseAssignmentMutation>;
export type ClearLicenseAssignmentMutationOptions = Apollo.BaseMutationOptions<ClearLicenseAssignmentMutation, ClearLicenseAssignmentMutationVariables>;
export const CreateLicenseDocument = gql`
    mutation createLicense($input: CreateLicenseInput!) {
  createLicense(input: $input) {
    License {
      idLicense
      Name
      Description
      RestrictLevel
    }
  }
}
    `;
export type CreateLicenseMutationFn = Apollo.MutationFunction<CreateLicenseMutation, CreateLicenseMutationVariables>;

/**
 * __useCreateLicenseMutation__
 *
 * To run a mutation, you first call `useCreateLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLicenseMutation, { data, loading, error }] = useCreateLicenseMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateLicenseMutation(baseOptions?: Apollo.MutationHookOptions<CreateLicenseMutation, CreateLicenseMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateLicenseMutation, CreateLicenseMutationVariables>(CreateLicenseDocument, options);
      }
export type CreateLicenseMutationHookResult = ReturnType<typeof useCreateLicenseMutation>;
export type CreateLicenseMutationResult = Apollo.MutationResult<CreateLicenseMutation>;
export type CreateLicenseMutationOptions = Apollo.BaseMutationOptions<CreateLicenseMutation, CreateLicenseMutationVariables>;
export const UpdateLicenseDocument = gql`
    mutation updateLicense($input: UpdateLicenseInput!) {
  updateLicense(input: $input) {
    License {
      idLicense
      Name
      Description
      RestrictLevel
    }
  }
}
    `;
export type UpdateLicenseMutationFn = Apollo.MutationFunction<UpdateLicenseMutation, UpdateLicenseMutationVariables>;

/**
 * __useUpdateLicenseMutation__
 *
 * To run a mutation, you first call `useUpdateLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLicenseMutation, { data, loading, error }] = useUpdateLicenseMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateLicenseMutation(baseOptions?: Apollo.MutationHookOptions<UpdateLicenseMutation, UpdateLicenseMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateLicenseMutation, UpdateLicenseMutationVariables>(UpdateLicenseDocument, options);
      }
export type UpdateLicenseMutationHookResult = ReturnType<typeof useUpdateLicenseMutation>;
export type UpdateLicenseMutationResult = Apollo.MutationResult<UpdateLicenseMutation>;
export type UpdateLicenseMutationOptions = Apollo.BaseMutationOptions<UpdateLicenseMutation, UpdateLicenseMutationVariables>;
export const CreateSubjectWithIdentifiersDocument = gql`
    mutation createSubjectWithIdentifiers($input: CreateSubjectWithIdentifiersInput!) {
  createSubjectWithIdentifiers(input: $input) {
    success
    message
  }
}
    `;
export type CreateSubjectWithIdentifiersMutationFn = Apollo.MutationFunction<CreateSubjectWithIdentifiersMutation, CreateSubjectWithIdentifiersMutationVariables>;

/**
 * __useCreateSubjectWithIdentifiersMutation__
 *
 * To run a mutation, you first call `useCreateSubjectWithIdentifiersMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSubjectWithIdentifiersMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSubjectWithIdentifiersMutation, { data, loading, error }] = useCreateSubjectWithIdentifiersMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSubjectWithIdentifiersMutation(baseOptions?: Apollo.MutationHookOptions<CreateSubjectWithIdentifiersMutation, CreateSubjectWithIdentifiersMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSubjectWithIdentifiersMutation, CreateSubjectWithIdentifiersMutationVariables>(CreateSubjectWithIdentifiersDocument, options);
      }
export type CreateSubjectWithIdentifiersMutationHookResult = ReturnType<typeof useCreateSubjectWithIdentifiersMutation>;
export type CreateSubjectWithIdentifiersMutationResult = Apollo.MutationResult<CreateSubjectWithIdentifiersMutation>;
export type CreateSubjectWithIdentifiersMutationOptions = Apollo.BaseMutationOptions<CreateSubjectWithIdentifiersMutation, CreateSubjectWithIdentifiersMutationVariables>;
export const DeleteIdentifierDocument = gql`
    mutation deleteIdentifier($input: DeleteIdentifierInput!) {
  deleteIdentifier(input: $input) {
    success
  }
}
    `;
export type DeleteIdentifierMutationFn = Apollo.MutationFunction<DeleteIdentifierMutation, DeleteIdentifierMutationVariables>;

/**
 * __useDeleteIdentifierMutation__
 *
 * To run a mutation, you first call `useDeleteIdentifierMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteIdentifierMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteIdentifierMutation, { data, loading, error }] = useDeleteIdentifierMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteIdentifierMutation(baseOptions?: Apollo.MutationHookOptions<DeleteIdentifierMutation, DeleteIdentifierMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteIdentifierMutation, DeleteIdentifierMutationVariables>(DeleteIdentifierDocument, options);
      }
export type DeleteIdentifierMutationHookResult = ReturnType<typeof useDeleteIdentifierMutation>;
export type DeleteIdentifierMutationResult = Apollo.MutationResult<DeleteIdentifierMutation>;
export type DeleteIdentifierMutationOptions = Apollo.BaseMutationOptions<DeleteIdentifierMutation, DeleteIdentifierMutationVariables>;
export const DeleteMetadataDocument = gql`
    mutation deleteMetadata($input: DeleteMetadataInput!) {
  deleteMetadata(input: $input) {
    success
  }
}
    `;
export type DeleteMetadataMutationFn = Apollo.MutationFunction<DeleteMetadataMutation, DeleteMetadataMutationVariables>;

/**
 * __useDeleteMetadataMutation__
 *
 * To run a mutation, you first call `useDeleteMetadataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMetadataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMetadataMutation, { data, loading, error }] = useDeleteMetadataMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteMetadataMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMetadataMutation, DeleteMetadataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMetadataMutation, DeleteMetadataMutationVariables>(DeleteMetadataDocument, options);
      }
export type DeleteMetadataMutationHookResult = ReturnType<typeof useDeleteMetadataMutation>;
export type DeleteMetadataMutationResult = Apollo.MutationResult<DeleteMetadataMutation>;
export type DeleteMetadataMutationOptions = Apollo.BaseMutationOptions<DeleteMetadataMutation, DeleteMetadataMutationVariables>;
export const DeleteObjectConnectionDocument = gql`
    mutation deleteObjectConnection($input: DeleteObjectConnectionInput!) {
  deleteObjectConnection(input: $input) {
    success
    details
  }
}
    `;
export type DeleteObjectConnectionMutationFn = Apollo.MutationFunction<DeleteObjectConnectionMutation, DeleteObjectConnectionMutationVariables>;

/**
 * __useDeleteObjectConnectionMutation__
 *
 * To run a mutation, you first call `useDeleteObjectConnectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteObjectConnectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteObjectConnectionMutation, { data, loading, error }] = useDeleteObjectConnectionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useDeleteObjectConnectionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteObjectConnectionMutation, DeleteObjectConnectionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteObjectConnectionMutation, DeleteObjectConnectionMutationVariables>(DeleteObjectConnectionDocument, options);
      }
export type DeleteObjectConnectionMutationHookResult = ReturnType<typeof useDeleteObjectConnectionMutation>;
export type DeleteObjectConnectionMutationResult = Apollo.MutationResult<DeleteObjectConnectionMutation>;
export type DeleteObjectConnectionMutationOptions = Apollo.BaseMutationOptions<DeleteObjectConnectionMutation, DeleteObjectConnectionMutationVariables>;
export const PublishDocument = gql`
    mutation publish($input: PublishInput!) {
  publish(input: $input) {
    success
    eState
    message
  }
}
    `;
export type PublishMutationFn = Apollo.MutationFunction<PublishMutation, PublishMutationVariables>;

/**
 * __usePublishMutation__
 *
 * To run a mutation, you first call `usePublishMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublishMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publishMutation, { data, loading, error }] = usePublishMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePublishMutation(baseOptions?: Apollo.MutationHookOptions<PublishMutation, PublishMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PublishMutation, PublishMutationVariables>(PublishDocument, options);
      }
export type PublishMutationHookResult = ReturnType<typeof usePublishMutation>;
export type PublishMutationResult = Apollo.MutationResult<PublishMutation>;
export type PublishMutationOptions = Apollo.BaseMutationOptions<PublishMutation, PublishMutationVariables>;
export const RollbackSystemObjectVersionDocument = gql`
    mutation rollbackSystemObjectVersion($input: RollbackSystemObjectVersionInput!) {
  rollbackSystemObjectVersion(input: $input) {
    success
    message
  }
}
    `;
export type RollbackSystemObjectVersionMutationFn = Apollo.MutationFunction<RollbackSystemObjectVersionMutation, RollbackSystemObjectVersionMutationVariables>;

/**
 * __useRollbackSystemObjectVersionMutation__
 *
 * To run a mutation, you first call `useRollbackSystemObjectVersionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRollbackSystemObjectVersionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rollbackSystemObjectVersionMutation, { data, loading, error }] = useRollbackSystemObjectVersionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRollbackSystemObjectVersionMutation(baseOptions?: Apollo.MutationHookOptions<RollbackSystemObjectVersionMutation, RollbackSystemObjectVersionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RollbackSystemObjectVersionMutation, RollbackSystemObjectVersionMutationVariables>(RollbackSystemObjectVersionDocument, options);
      }
export type RollbackSystemObjectVersionMutationHookResult = ReturnType<typeof useRollbackSystemObjectVersionMutation>;
export type RollbackSystemObjectVersionMutationResult = Apollo.MutationResult<RollbackSystemObjectVersionMutation>;
export type RollbackSystemObjectVersionMutationOptions = Apollo.BaseMutationOptions<RollbackSystemObjectVersionMutation, RollbackSystemObjectVersionMutationVariables>;
export const UpdateDerivedObjectsDocument = gql`
    mutation updateDerivedObjects($input: UpdateDerivedObjectsInput!) {
  updateDerivedObjects(input: $input) {
    success
    message
    status
  }
}
    `;
export type UpdateDerivedObjectsMutationFn = Apollo.MutationFunction<UpdateDerivedObjectsMutation, UpdateDerivedObjectsMutationVariables>;

/**
 * __useUpdateDerivedObjectsMutation__
 *
 * To run a mutation, you first call `useUpdateDerivedObjectsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDerivedObjectsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDerivedObjectsMutation, { data, loading, error }] = useUpdateDerivedObjectsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateDerivedObjectsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDerivedObjectsMutation, UpdateDerivedObjectsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDerivedObjectsMutation, UpdateDerivedObjectsMutationVariables>(UpdateDerivedObjectsDocument, options);
      }
export type UpdateDerivedObjectsMutationHookResult = ReturnType<typeof useUpdateDerivedObjectsMutation>;
export type UpdateDerivedObjectsMutationResult = Apollo.MutationResult<UpdateDerivedObjectsMutation>;
export type UpdateDerivedObjectsMutationOptions = Apollo.BaseMutationOptions<UpdateDerivedObjectsMutation, UpdateDerivedObjectsMutationVariables>;
export const UpdateObjectDetailsDocument = gql`
    mutation updateObjectDetails($input: UpdateObjectDetailsInput!) {
  updateObjectDetails(input: $input) {
    success
    message
  }
}
    `;
export type UpdateObjectDetailsMutationFn = Apollo.MutationFunction<UpdateObjectDetailsMutation, UpdateObjectDetailsMutationVariables>;

/**
 * __useUpdateObjectDetailsMutation__
 *
 * To run a mutation, you first call `useUpdateObjectDetailsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateObjectDetailsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateObjectDetailsMutation, { data, loading, error }] = useUpdateObjectDetailsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateObjectDetailsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateObjectDetailsMutation, UpdateObjectDetailsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateObjectDetailsMutation, UpdateObjectDetailsMutationVariables>(UpdateObjectDetailsDocument, options);
      }
export type UpdateObjectDetailsMutationHookResult = ReturnType<typeof useUpdateObjectDetailsMutation>;
export type UpdateObjectDetailsMutationResult = Apollo.MutationResult<UpdateObjectDetailsMutation>;
export type UpdateObjectDetailsMutationOptions = Apollo.BaseMutationOptions<UpdateObjectDetailsMutation, UpdateObjectDetailsMutationVariables>;
export const UpdateSourceObjectsDocument = gql`
    mutation updateSourceObjects($input: UpdateSourceObjectsInput!) {
  updateSourceObjects(input: $input) {
    success
    status
    message
  }
}
    `;
export type UpdateSourceObjectsMutationFn = Apollo.MutationFunction<UpdateSourceObjectsMutation, UpdateSourceObjectsMutationVariables>;

/**
 * __useUpdateSourceObjectsMutation__
 *
 * To run a mutation, you first call `useUpdateSourceObjectsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSourceObjectsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSourceObjectsMutation, { data, loading, error }] = useUpdateSourceObjectsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSourceObjectsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSourceObjectsMutation, UpdateSourceObjectsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSourceObjectsMutation, UpdateSourceObjectsMutationVariables>(UpdateSourceObjectsDocument, options);
      }
export type UpdateSourceObjectsMutationHookResult = ReturnType<typeof useUpdateSourceObjectsMutation>;
export type UpdateSourceObjectsMutationResult = Apollo.MutationResult<UpdateSourceObjectsMutation>;
export type UpdateSourceObjectsMutationOptions = Apollo.BaseMutationOptions<UpdateSourceObjectsMutation, UpdateSourceObjectsMutationVariables>;
export const CreateGeoLocationDocument = gql`
    mutation createGeoLocation($input: CreateGeoLocationInput!) {
  createGeoLocation(input: $input) {
    GeoLocation {
      idGeoLocation
    }
  }
}
    `;
export type CreateGeoLocationMutationFn = Apollo.MutationFunction<CreateGeoLocationMutation, CreateGeoLocationMutationVariables>;

/**
 * __useCreateGeoLocationMutation__
 *
 * To run a mutation, you first call `useCreateGeoLocationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateGeoLocationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createGeoLocationMutation, { data, loading, error }] = useCreateGeoLocationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateGeoLocationMutation(baseOptions?: Apollo.MutationHookOptions<CreateGeoLocationMutation, CreateGeoLocationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateGeoLocationMutation, CreateGeoLocationMutationVariables>(CreateGeoLocationDocument, options);
      }
export type CreateGeoLocationMutationHookResult = ReturnType<typeof useCreateGeoLocationMutation>;
export type CreateGeoLocationMutationResult = Apollo.MutationResult<CreateGeoLocationMutation>;
export type CreateGeoLocationMutationOptions = Apollo.BaseMutationOptions<CreateGeoLocationMutation, CreateGeoLocationMutationVariables>;
export const CreateProjectDocument = gql`
    mutation createProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    Project {
      idProject
      SystemObject {
        idSystemObject
      }
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateProjectMutation, CreateProjectMutationVariables>(CreateProjectDocument, options);
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSubjectMutation, CreateSubjectMutationVariables>(CreateSubjectDocument, options);
      }
export type CreateSubjectMutationHookResult = ReturnType<typeof useCreateSubjectMutation>;
export type CreateSubjectMutationResult = Apollo.MutationResult<CreateSubjectMutation>;
export type CreateSubjectMutationOptions = Apollo.BaseMutationOptions<CreateSubjectMutation, CreateSubjectMutationVariables>;
export const CreateUnitDocument = gql`
    mutation createUnit($input: CreateUnitInput!) {
  createUnit(input: $input) {
    Unit {
      idUnit
      SystemObject {
        idSystemObject
      }
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUnitMutation, CreateUnitMutationVariables>(CreateUnitDocument, options);
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
      WorkflowNotificationTime
      EmailSettings
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = gql`
    mutation updateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    User {
      idUser
      EmailAddress
      Name
      Active
      DateActivated
      DateDisabled
      EmailSettings
      WorkflowNotificationTime
    }
  }
}
    `;
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateVocabularyMutation, CreateVocabularyMutationVariables>(CreateVocabularyDocument, options);
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateVocabularySetMutation, CreateVocabularySetMutationVariables>(CreateVocabularySetDocument, options);
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
export function useGetAccessPolicyQuery(baseOptions: Apollo.QueryHookOptions<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>(GetAccessPolicyDocument, options);
      }
export function useGetAccessPolicyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>(GetAccessPolicyDocument, options);
        }
export type GetAccessPolicyQueryHookResult = ReturnType<typeof useGetAccessPolicyQuery>;
export type GetAccessPolicyLazyQueryHookResult = ReturnType<typeof useGetAccessPolicyLazyQuery>;
export type GetAccessPolicyQueryResult = Apollo.QueryResult<GetAccessPolicyQuery, GetAccessPolicyQueryVariables>;
export const GetAssetDocument = gql`
    query getAsset($input: GetAssetInput!) {
  getAsset(input: $input) {
    Asset {
      idAsset
      idVAssetType
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
export function useGetAssetQuery(baseOptions: Apollo.QueryHookOptions<GetAssetQuery, GetAssetQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAssetQuery, GetAssetQueryVariables>(GetAssetDocument, options);
      }
export function useGetAssetLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAssetQuery, GetAssetQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAssetQuery, GetAssetQueryVariables>(GetAssetDocument, options);
        }
export type GetAssetQueryHookResult = ReturnType<typeof useGetAssetQuery>;
export type GetAssetLazyQueryHookResult = ReturnType<typeof useGetAssetLazyQuery>;
export type GetAssetQueryResult = Apollo.QueryResult<GetAssetQuery, GetAssetQueryVariables>;
export const GetAssetVersionsDetailsDocument = gql`
    query getAssetVersionsDetails($input: GetAssetVersionsDetailsInput!) {
  getAssetVersionsDetails(input: $input) {
    valid
    Details {
      idAssetVersion
      SubjectUnitIdentifier {
        idSubject
        idSystemObject
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
      CaptureDataPhoto {
        idAssetVersion
        dateCaptured
        datasetType
        systemCreated
        description
        cameraSettingUniform
        datasetFieldId
        itemPositionType
        itemPositionFieldId
        itemArrangementFieldId
        focusType
        lightsourceType
        backgroundRemovalMethod
        clusterType
        clusterGeometryFieldId
        directory
        folders {
          name
          variantType
        }
        identifiers {
          identifier
          identifierType
          idIdentifier
        }
      }
      Model {
        idAssetVersion
        systemCreated
        name
        creationMethod
        modality
        purpose
        units
        dateCreated
        modelFileType
        directory
        identifiers {
          identifier
          identifierType
          idIdentifier
        }
      }
      Scene {
        idAssetVersion
        systemCreated
        name
        directory
        approvedForPublication
        posedAndQCd
        identifiers {
          identifier
          identifierType
          idIdentifier
        }
      }
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
export function useGetAssetVersionsDetailsQuery(baseOptions: Apollo.QueryHookOptions<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>(GetAssetVersionsDetailsDocument, options);
      }
export function useGetAssetVersionsDetailsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAssetVersionsDetailsQuery, GetAssetVersionsDetailsQueryVariables>(GetAssetVersionsDetailsDocument, options);
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
export function useGetContentsForAssetVersionsQuery(baseOptions: Apollo.QueryHookOptions<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>(GetContentsForAssetVersionsDocument, options);
      }
export function useGetContentsForAssetVersionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>(GetContentsForAssetVersionsDocument, options);
        }
export type GetContentsForAssetVersionsQueryHookResult = ReturnType<typeof useGetContentsForAssetVersionsQuery>;
export type GetContentsForAssetVersionsLazyQueryHookResult = ReturnType<typeof useGetContentsForAssetVersionsLazyQuery>;
export type GetContentsForAssetVersionsQueryResult = Apollo.QueryResult<GetContentsForAssetVersionsQuery, GetContentsForAssetVersionsQueryVariables>;
export const GetModelConstellationForAssetVersionDocument = gql`
    query getModelConstellationForAssetVersion($input: GetModelConstellationForAssetVersionInput!) {
  getModelConstellationForAssetVersion(input: $input) {
    idAssetVersion
    ModelConstellation {
      Model {
        idModel
        CountVertices
        CountFaces
        CountTriangles
        CountAnimations
        CountCameras
        CountLights
        CountMaterials
        CountMeshes
        CountEmbeddedTextures
        CountLinkedTextures
        FileEncoding
        IsDracoCompressed
        Name
        idVFileType
      }
      ModelObjects {
        idModelObject
        BoundingBoxP1X
        BoundingBoxP1Y
        BoundingBoxP1Z
        BoundingBoxP1Z
        BoundingBoxP2X
        BoundingBoxP2Y
        BoundingBoxP2Z
        CountVertices
        CountFaces
        CountTriangles
        CountColorChannels
        CountTextureCoordinateChannels
        HasBones
        HasFaceNormals
        HasTangents
        HasTextureCoordinates
        HasVertexNormals
        HasVertexColor
        IsTwoManifoldUnbounded
        IsTwoManifoldBounded
        IsWatertight
        SelfIntersecting
      }
      ModelMaterials {
        idModelMaterial
        Name
      }
      ModelMaterialChannels {
        Type
        Source
        Value
        AdditionalAttributes
        idModelMaterial
        idModelMaterialChannel
      }
      ModelObjectModelMaterialXref {
        idModelObjectModelMaterialXref
        idModelObject
        idModelMaterial
      }
      ModelAssets {
        AssetName
        AssetType
      }
    }
  }
}
    `;

/**
 * __useGetModelConstellationForAssetVersionQuery__
 *
 * To run a query within a React component, call `useGetModelConstellationForAssetVersionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetModelConstellationForAssetVersionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetModelConstellationForAssetVersionQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetModelConstellationForAssetVersionQuery(baseOptions: Apollo.QueryHookOptions<GetModelConstellationForAssetVersionQuery, GetModelConstellationForAssetVersionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetModelConstellationForAssetVersionQuery, GetModelConstellationForAssetVersionQueryVariables>(GetModelConstellationForAssetVersionDocument, options);
      }
export function useGetModelConstellationForAssetVersionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetModelConstellationForAssetVersionQuery, GetModelConstellationForAssetVersionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetModelConstellationForAssetVersionQuery, GetModelConstellationForAssetVersionQueryVariables>(GetModelConstellationForAssetVersionDocument, options);
        }
export type GetModelConstellationForAssetVersionQueryHookResult = ReturnType<typeof useGetModelConstellationForAssetVersionQuery>;
export type GetModelConstellationForAssetVersionLazyQueryHookResult = ReturnType<typeof useGetModelConstellationForAssetVersionLazyQuery>;
export type GetModelConstellationForAssetVersionQueryResult = Apollo.QueryResult<GetModelConstellationForAssetVersionQuery, GetModelConstellationForAssetVersionQueryVariables>;
export const GetUploadedAssetVersionDocument = gql`
    query getUploadedAssetVersion {
  getUploadedAssetVersion {
    AssetVersion {
      idAssetVersion
      StorageSize
      FileName
      DateCreated
      Asset {
        idAsset
        VAssetType {
          idVocabulary
          Term
        }
      }
      idSOAttachment
      SOAttachmentObjectType
    }
    idAssetVersionsUpdated
    UpdatedAssetVersionMetadata {
      idAssetVersion
      UpdatedObjectName
      Item {
        Name
      }
      CaptureDataPhoto {
        name
        dateCaptured
        datasetType
        description
        cameraSettingUniform
        datasetFieldId
        itemPositionType
        itemPositionFieldId
        itemArrangementFieldId
        focusType
        lightsourceType
        backgroundRemovalMethod
        clusterType
        clusterGeometryFieldId
        folders {
          name
          variantType
        }
      }
      Model {
        name
        creationMethod
        modality
        purpose
        units
        dateCreated
        modelFileType
      }
      Scene {
        name
        approvedForPublication
        posedAndQCd
        referenceModels {
          idSystemObject
          name
          usage
          quality
          fileSize
          resolution
          boundingBoxP1X
          boundingBoxP1Y
          boundingBoxP1Z
          boundingBoxP2X
          boundingBoxP2Y
          boundingBoxP2Z
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>(GetUploadedAssetVersionDocument, options);
      }
export function useGetUploadedAssetVersionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUploadedAssetVersionQuery, GetUploadedAssetVersionQueryVariables>(GetUploadedAssetVersionDocument, options);
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
export function useGetCaptureDataQuery(baseOptions: Apollo.QueryHookOptions<GetCaptureDataQuery, GetCaptureDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCaptureDataQuery, GetCaptureDataQueryVariables>(GetCaptureDataDocument, options);
      }
export function useGetCaptureDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCaptureDataQuery, GetCaptureDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCaptureDataQuery, GetCaptureDataQueryVariables>(GetCaptureDataDocument, options);
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
export function useGetCaptureDataPhotoQuery(baseOptions: Apollo.QueryHookOptions<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>(GetCaptureDataPhotoDocument, options);
      }
export function useGetCaptureDataPhotoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCaptureDataPhotoQuery, GetCaptureDataPhotoQueryVariables>(GetCaptureDataPhotoDocument, options);
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
export function useAreCameraSettingsUniformQuery(baseOptions: Apollo.QueryHookOptions<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>(AreCameraSettingsUniformDocument, options);
      }
export function useAreCameraSettingsUniformLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>(AreCameraSettingsUniformDocument, options);
        }
export type AreCameraSettingsUniformQueryHookResult = ReturnType<typeof useAreCameraSettingsUniformQuery>;
export type AreCameraSettingsUniformLazyQueryHookResult = ReturnType<typeof useAreCameraSettingsUniformLazyQuery>;
export type AreCameraSettingsUniformQueryResult = Apollo.QueryResult<AreCameraSettingsUniformQuery, AreCameraSettingsUniformQueryVariables>;
export const GetIngestTitleDocument = gql`
    query getIngestTitle($input: GetIngestTitleInput!) {
  getIngestTitle(input: $input) {
    ingestTitle {
      title
      forced
      subtitle
    }
  }
}
    `;

/**
 * __useGetIngestTitleQuery__
 *
 * To run a query within a React component, call `useGetIngestTitleQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIngestTitleQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIngestTitleQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetIngestTitleQuery(baseOptions: Apollo.QueryHookOptions<GetIngestTitleQuery, GetIngestTitleQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetIngestTitleQuery, GetIngestTitleQueryVariables>(GetIngestTitleDocument, options);
      }
export function useGetIngestTitleLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetIngestTitleQuery, GetIngestTitleQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetIngestTitleQuery, GetIngestTitleQueryVariables>(GetIngestTitleDocument, options);
        }
export type GetIngestTitleQueryHookResult = ReturnType<typeof useGetIngestTitleQuery>;
export type GetIngestTitleLazyQueryHookResult = ReturnType<typeof useGetIngestTitleLazyQuery>;
export type GetIngestTitleQueryResult = Apollo.QueryResult<GetIngestTitleQuery, GetIngestTitleQueryVariables>;
export const GetLicenseDocument = gql`
    query getLicense($input: GetLicenseInput!) {
  getLicense(input: $input) {
    License {
      idLicense
      Description
      Name
      RestrictLevel
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
export function useGetLicenseQuery(baseOptions: Apollo.QueryHookOptions<GetLicenseQuery, GetLicenseQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLicenseQuery, GetLicenseQueryVariables>(GetLicenseDocument, options);
      }
export function useGetLicenseLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLicenseQuery, GetLicenseQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLicenseQuery, GetLicenseQueryVariables>(GetLicenseDocument, options);
        }
export type GetLicenseQueryHookResult = ReturnType<typeof useGetLicenseQuery>;
export type GetLicenseLazyQueryHookResult = ReturnType<typeof useGetLicenseLazyQuery>;
export type GetLicenseQueryResult = Apollo.QueryResult<GetLicenseQuery, GetLicenseQueryVariables>;
export const GetLicenseListDocument = gql`
    query getLicenseList($input: GetLicenseListInput!) {
  getLicenseList(input: $input) {
    Licenses {
      idLicense
      Description
      Name
      RestrictLevel
    }
  }
}
    `;

/**
 * __useGetLicenseListQuery__
 *
 * To run a query within a React component, call `useGetLicenseListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLicenseListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLicenseListQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetLicenseListQuery(baseOptions: Apollo.QueryHookOptions<GetLicenseListQuery, GetLicenseListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLicenseListQuery, GetLicenseListQueryVariables>(GetLicenseListDocument, options);
      }
export function useGetLicenseListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLicenseListQuery, GetLicenseListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLicenseListQuery, GetLicenseListQueryVariables>(GetLicenseListDocument, options);
        }
export type GetLicenseListQueryHookResult = ReturnType<typeof useGetLicenseListQuery>;
export type GetLicenseListLazyQueryHookResult = ReturnType<typeof useGetLicenseListLazyQuery>;
export type GetLicenseListQueryResult = Apollo.QueryResult<GetLicenseListQuery, GetLicenseListQueryVariables>;
export const GetModelDocument = gql`
    query getModel($input: GetModelInput!) {
  getModel(input: $input) {
    Model {
      idModel
      SystemObject {
        idSystemObject
        idAsset
        idAssetVersion
      }
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
export function useGetModelQuery(baseOptions: Apollo.QueryHookOptions<GetModelQuery, GetModelQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetModelQuery, GetModelQueryVariables>(GetModelDocument, options);
      }
export function useGetModelLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetModelQuery, GetModelQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetModelQuery, GetModelQueryVariables>(GetModelDocument, options);
        }
export type GetModelQueryHookResult = ReturnType<typeof useGetModelQuery>;
export type GetModelLazyQueryHookResult = ReturnType<typeof useGetModelLazyQuery>;
export type GetModelQueryResult = Apollo.QueryResult<GetModelQuery, GetModelQueryVariables>;
export const GetModelConstellationDocument = gql`
    query getModelConstellation($input: GetModelConstellationInput!) {
  getModelConstellation(input: $input) {
    ModelConstellation {
      Model {
        idModel
        Name
        DateCreated
        VCreationMethod {
          Term
        }
        VModality {
          Term
        }
        VPurpose {
          Term
        }
        VUnits {
          Term
        }
        VFileType {
          Term
        }
        idAssetThumbnail
        CountAnimations
        CountCameras
        CountFaces
        CountTriangles
        CountLights
        CountMaterials
        CountMeshes
        CountVertices
        CountEmbeddedTextures
        CountLinkedTextures
        FileEncoding
        IsDracoCompressed
      }
      ModelObjects {
        idModelObject
        idModel
        BoundingBoxP1X
        BoundingBoxP1Y
        BoundingBoxP1Z
        BoundingBoxP2X
        BoundingBoxP2Y
        BoundingBoxP2Z
        CountVertices
        CountFaces
        CountTriangles
        CountColorChannels
        CountTextureCoordinateChannels
        HasBones
        HasFaceNormals
        HasTangents
        HasTextureCoordinates
        HasVertexNormals
        HasVertexColor
        IsTwoManifoldUnbounded
        IsTwoManifoldBounded
        IsWatertight
        SelfIntersecting
      }
      ModelMaterials {
        idModelMaterial
        Name
      }
      ModelMaterialChannels {
        idModelMaterialChannel
        idModelMaterial
        Type
        Source
        Value
        VMaterialType {
          Term
        }
        MaterialTypeOther
        idModelMaterialUVMap
        UVMapEmbedded
        ChannelPosition
        ChannelWidth
        Scalar1
        Scalar2
        Scalar3
        Scalar4
        AdditionalAttributes
      }
      ModelMaterialUVMaps {
        idModelMaterialUVMap
        idModel
        idAsset
        UVMapEdgeLength
      }
      ModelObjectModelMaterialXref {
        idModelObject
        idModelMaterial
      }
      ModelAssets {
        AssetName
        AssetType
        AssetVersion {
          idAsset
          idAssetVersion
          FileName
        }
      }
    }
  }
}
    `;

/**
 * __useGetModelConstellationQuery__
 *
 * To run a query within a React component, call `useGetModelConstellationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetModelConstellationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetModelConstellationQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetModelConstellationQuery(baseOptions: Apollo.QueryHookOptions<GetModelConstellationQuery, GetModelConstellationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetModelConstellationQuery, GetModelConstellationQueryVariables>(GetModelConstellationDocument, options);
      }
export function useGetModelConstellationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetModelConstellationQuery, GetModelConstellationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetModelConstellationQuery, GetModelConstellationQueryVariables>(GetModelConstellationDocument, options);
        }
export type GetModelConstellationQueryHookResult = ReturnType<typeof useGetModelConstellationQuery>;
export type GetModelConstellationLazyQueryHookResult = ReturnType<typeof useGetModelConstellationLazyQuery>;
export type GetModelConstellationQueryResult = Apollo.QueryResult<GetModelConstellationQuery, GetModelConstellationQueryVariables>;
export const GetFilterViewDataDocument = gql`
    query getFilterViewData {
  getFilterViewData {
    units {
      idUnit
      Name
      SystemObject {
        idSystemObject
      }
    }
    projects {
      idProject
      Name
      SystemObject {
        idSystemObject
      }
    }
  }
}
    `;

/**
 * __useGetFilterViewDataQuery__
 *
 * To run a query within a React component, call `useGetFilterViewDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFilterViewDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFilterViewDataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFilterViewDataQuery(baseOptions?: Apollo.QueryHookOptions<GetFilterViewDataQuery, GetFilterViewDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFilterViewDataQuery, GetFilterViewDataQueryVariables>(GetFilterViewDataDocument, options);
      }
export function useGetFilterViewDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFilterViewDataQuery, GetFilterViewDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFilterViewDataQuery, GetFilterViewDataQueryVariables>(GetFilterViewDataDocument, options);
        }
export type GetFilterViewDataQueryHookResult = ReturnType<typeof useGetFilterViewDataQuery>;
export type GetFilterViewDataLazyQueryHookResult = ReturnType<typeof useGetFilterViewDataLazyQuery>;
export type GetFilterViewDataQueryResult = Apollo.QueryResult<GetFilterViewDataQuery, GetFilterViewDataQueryVariables>;
export const GetObjectChildrenDocument = gql`
    query getObjectChildren($input: GetObjectChildrenInput!) {
  getObjectChildren(input: $input) {
    success
    error
    entries {
      idSystemObject
      name
      objectType
      idObject
      metadata
    }
    metadataColumns
    cursorMark
  }
}
    `;

/**
 * __useGetObjectChildrenQuery__
 *
 * To run a query within a React component, call `useGetObjectChildrenQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetObjectChildrenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetObjectChildrenQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetObjectChildrenQuery(baseOptions: Apollo.QueryHookOptions<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(GetObjectChildrenDocument, options);
      }
export function useGetObjectChildrenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>(GetObjectChildrenDocument, options);
        }
export type GetObjectChildrenQueryHookResult = ReturnType<typeof useGetObjectChildrenQuery>;
export type GetObjectChildrenLazyQueryHookResult = ReturnType<typeof useGetObjectChildrenLazyQuery>;
export type GetObjectChildrenQueryResult = Apollo.QueryResult<GetObjectChildrenQuery, GetObjectChildrenQueryVariables>;
export const GetIntermediaryFileDocument = gql`
    query getIntermediaryFile($input: GetIntermediaryFileInput!) {
  getIntermediaryFile(input: $input) {
    IntermediaryFile {
      idIntermediaryFile
    }
  }
}
    `;

/**
 * __useGetIntermediaryFileQuery__
 *
 * To run a query within a React component, call `useGetIntermediaryFileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIntermediaryFileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIntermediaryFileQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetIntermediaryFileQuery(baseOptions: Apollo.QueryHookOptions<GetIntermediaryFileQuery, GetIntermediaryFileQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetIntermediaryFileQuery, GetIntermediaryFileQueryVariables>(GetIntermediaryFileDocument, options);
      }
export function useGetIntermediaryFileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetIntermediaryFileQuery, GetIntermediaryFileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetIntermediaryFileQuery, GetIntermediaryFileQueryVariables>(GetIntermediaryFileDocument, options);
        }
export type GetIntermediaryFileQueryHookResult = ReturnType<typeof useGetIntermediaryFileQuery>;
export type GetIntermediaryFileLazyQueryHookResult = ReturnType<typeof useGetIntermediaryFileLazyQuery>;
export type GetIntermediaryFileQueryResult = Apollo.QueryResult<GetIntermediaryFileQuery, GetIntermediaryFileQueryVariables>;
export const GetSceneDocument = gql`
    query getScene($input: GetSceneInput!) {
  getScene(input: $input) {
    Scene {
      idScene
      Name
      CountCamera
      CountScene
      CountNode
      CountLight
      CountModel
      CountMeta
      CountSetup
      CountTour
      EdanUUID
      ApprovedForPublication
      PosedAndQCd
      CanBeQCd
      ModelSceneXref {
        idModelSceneXref
        idModel
        idScene
        Name
        Usage
        Quality
        FileSize
        UVResolution
        BoundingBoxP1X
        BoundingBoxP1Y
        BoundingBoxP1Z
        BoundingBoxP2X
        BoundingBoxP2Y
        BoundingBoxP2Z
      }
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
export function useGetSceneQuery(baseOptions: Apollo.QueryHookOptions<GetSceneQuery, GetSceneQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSceneQuery, GetSceneQueryVariables>(GetSceneDocument, options);
      }
export function useGetSceneLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSceneQuery, GetSceneQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSceneQuery, GetSceneQueryVariables>(GetSceneDocument, options);
        }
export type GetSceneQueryHookResult = ReturnType<typeof useGetSceneQuery>;
export type GetSceneLazyQueryHookResult = ReturnType<typeof useGetSceneLazyQuery>;
export type GetSceneQueryResult = Apollo.QueryResult<GetSceneQuery, GetSceneQueryVariables>;
export const GetSceneForAssetVersionDocument = gql`
    query getSceneForAssetVersion($input: GetSceneForAssetVersionInput!) {
  getSceneForAssetVersion(input: $input) {
    idAssetVersion
    success
    message
    SceneConstellation {
      Scene {
        idScene
        idAssetThumbnail
        Name
        CountScene
        CountNode
        CountCamera
        CountLight
        CountModel
        CountMeta
        CountSetup
        CountTour
        ApprovedForPublication
        PosedAndQCd
      }
      ModelSceneXref {
        idModelSceneXref
        idModel
        idScene
        Name
        Usage
        Quality
        FileSize
        UVResolution
        BoundingBoxP1X
        BoundingBoxP1Y
        BoundingBoxP1Z
        BoundingBoxP2X
        BoundingBoxP2Y
        BoundingBoxP2Z
        Model {
          SystemObject {
            idSystemObject
            idAsset
          }
        }
      }
      SvxNonModelAssets {
        uri
        type
        description
        size
        idAssetVersion
      }
    }
  }
}
    `;

/**
 * __useGetSceneForAssetVersionQuery__
 *
 * To run a query within a React component, call `useGetSceneForAssetVersionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSceneForAssetVersionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSceneForAssetVersionQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSceneForAssetVersionQuery(baseOptions: Apollo.QueryHookOptions<GetSceneForAssetVersionQuery, GetSceneForAssetVersionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSceneForAssetVersionQuery, GetSceneForAssetVersionQueryVariables>(GetSceneForAssetVersionDocument, options);
      }
export function useGetSceneForAssetVersionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSceneForAssetVersionQuery, GetSceneForAssetVersionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSceneForAssetVersionQuery, GetSceneForAssetVersionQueryVariables>(GetSceneForAssetVersionDocument, options);
        }
export type GetSceneForAssetVersionQueryHookResult = ReturnType<typeof useGetSceneForAssetVersionQuery>;
export type GetSceneForAssetVersionLazyQueryHookResult = ReturnType<typeof useGetSceneForAssetVersionLazyQuery>;
export type GetSceneForAssetVersionQueryResult = Apollo.QueryResult<GetSceneForAssetVersionQuery, GetSceneForAssetVersionQueryVariables>;
export const GetAssetDetailsForSystemObjectDocument = gql`
    query getAssetDetailsForSystemObject($input: GetAssetDetailsForSystemObjectInput!) {
  getAssetDetailsForSystemObject(input: $input) {
    columns {
      colName
      colDisplay
      colType
      colAlign
      colLabel
    }
    assetDetailRows
  }
}
    `;

/**
 * __useGetAssetDetailsForSystemObjectQuery__
 *
 * To run a query within a React component, call `useGetAssetDetailsForSystemObjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAssetDetailsForSystemObjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAssetDetailsForSystemObjectQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetAssetDetailsForSystemObjectQuery(baseOptions: Apollo.QueryHookOptions<GetAssetDetailsForSystemObjectQuery, GetAssetDetailsForSystemObjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAssetDetailsForSystemObjectQuery, GetAssetDetailsForSystemObjectQueryVariables>(GetAssetDetailsForSystemObjectDocument, options);
      }
export function useGetAssetDetailsForSystemObjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAssetDetailsForSystemObjectQuery, GetAssetDetailsForSystemObjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAssetDetailsForSystemObjectQuery, GetAssetDetailsForSystemObjectQueryVariables>(GetAssetDetailsForSystemObjectDocument, options);
        }
export type GetAssetDetailsForSystemObjectQueryHookResult = ReturnType<typeof useGetAssetDetailsForSystemObjectQuery>;
export type GetAssetDetailsForSystemObjectLazyQueryHookResult = ReturnType<typeof useGetAssetDetailsForSystemObjectLazyQuery>;
export type GetAssetDetailsForSystemObjectQueryResult = Apollo.QueryResult<GetAssetDetailsForSystemObjectQuery, GetAssetDetailsForSystemObjectQueryVariables>;
export const GetDetailsTabDataForObjectDocument = gql`
    query getDetailsTabDataForObject($input: GetDetailsTabDataForObjectInput!) {
  getDetailsTabDataForObject(input: $input) {
    Unit {
      Abbreviation
      ARKPrefix
    }
    Project {
      Description
    }
    Subject {
      Altitude
      Latitude
      Longitude
      R0
      R1
      R2
      R3
      TS0
      TS1
      TS2
      idIdentifierPreferred
    }
    Item {
      EntireSubject
      Altitude
      Latitude
      Longitude
      R0
      R1
      R2
      R3
      TS0
      TS1
      TS2
    }
    CaptureData {
      captureMethod
      dateCaptured
      datasetType
      description
      cameraSettingUniform
      datasetFieldId
      itemPositionType
      itemPositionFieldId
      itemArrangementFieldId
      focusType
      lightsourceType
      backgroundRemovalMethod
      clusterType
      clusterGeometryFieldId
      folders {
        name
        variantType
      }
      isValidData
    }
    Model {
      Model {
        idModel
        CountVertices
        CountFaces
        CountTriangles
        CountAnimations
        CountCameras
        CountLights
        CountMaterials
        CountMeshes
        CountEmbeddedTextures
        CountLinkedTextures
        FileEncoding
        IsDracoCompressed
        Name
        DateCreated
        idVCreationMethod
        idVModality
        idVUnits
        idVPurpose
        idVFileType
      }
      ModelObjects {
        idModelObject
        BoundingBoxP1X
        BoundingBoxP1Y
        BoundingBoxP1Z
        BoundingBoxP1Z
        BoundingBoxP2X
        BoundingBoxP2Y
        BoundingBoxP2Z
        CountVertices
        CountFaces
        CountTriangles
        CountColorChannels
        CountTextureCoordinateChannels
        HasBones
        HasFaceNormals
        HasTangents
        HasTextureCoordinates
        HasVertexNormals
        HasVertexColor
        IsTwoManifoldUnbounded
        IsTwoManifoldBounded
        IsWatertight
        SelfIntersecting
      }
      ModelMaterials {
        idModelMaterial
        Name
      }
      ModelMaterialChannels {
        Type
        Source
        Value
        AdditionalAttributes
        idModelMaterial
        idModelMaterialChannel
      }
      ModelObjectModelMaterialXref {
        idModelObjectModelMaterialXref
        idModelObject
        idModelMaterial
      }
      ModelAssets {
        AssetName
        AssetType
      }
    }
    Scene {
      Links
      AssetType
      Tours
      Annotation
      EdanUUID
      ApprovedForPublication
      PublicationApprover
      PosedAndQCd
      CanBeQCd
      idScene
    }
    IntermediaryFile {
      idIntermediaryFile
    }
    ProjectDocumentation {
      Description
    }
    Asset {
      AssetType
      idAsset
    }
    AssetVersion {
      Creator
      DateCreated
      StorageSize
      Ingested
      Version
      idAsset
      idAssetVersion
      FilePath
      StorageHash
    }
    Actor {
      OrganizationName
    }
    Stakeholder {
      OrganizationName
      EmailAddress
      PhoneNumberMobile
      PhoneNumberOffice
      MailingAddress
    }
  }
}
    `;

/**
 * __useGetDetailsTabDataForObjectQuery__
 *
 * To run a query within a React component, call `useGetDetailsTabDataForObjectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDetailsTabDataForObjectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDetailsTabDataForObjectQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetDetailsTabDataForObjectQuery(baseOptions: Apollo.QueryHookOptions<GetDetailsTabDataForObjectQuery, GetDetailsTabDataForObjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDetailsTabDataForObjectQuery, GetDetailsTabDataForObjectQueryVariables>(GetDetailsTabDataForObjectDocument, options);
      }
export function useGetDetailsTabDataForObjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDetailsTabDataForObjectQuery, GetDetailsTabDataForObjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDetailsTabDataForObjectQuery, GetDetailsTabDataForObjectQueryVariables>(GetDetailsTabDataForObjectDocument, options);
        }
export type GetDetailsTabDataForObjectQueryHookResult = ReturnType<typeof useGetDetailsTabDataForObjectQuery>;
export type GetDetailsTabDataForObjectLazyQueryHookResult = ReturnType<typeof useGetDetailsTabDataForObjectLazyQuery>;
export type GetDetailsTabDataForObjectQueryResult = Apollo.QueryResult<GetDetailsTabDataForObjectQuery, GetDetailsTabDataForObjectQueryVariables>;
export const GetProjectListDocument = gql`
    query getProjectList($input: GetProjectListInput!) {
  getProjectList(input: $input) {
    projects {
      idProject
      Name
      SystemObject {
        idSystemObject
      }
    }
  }
}
    `;

/**
 * __useGetProjectListQuery__
 *
 * To run a query within a React component, call `useGetProjectListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectListQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetProjectListQuery(baseOptions: Apollo.QueryHookOptions<GetProjectListQuery, GetProjectListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProjectListQuery, GetProjectListQueryVariables>(GetProjectListDocument, options);
      }
export function useGetProjectListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectListQuery, GetProjectListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProjectListQuery, GetProjectListQueryVariables>(GetProjectListDocument, options);
        }
export type GetProjectListQueryHookResult = ReturnType<typeof useGetProjectListQuery>;
export type GetProjectListLazyQueryHookResult = ReturnType<typeof useGetProjectListLazyQuery>;
export type GetProjectListQueryResult = Apollo.QueryResult<GetProjectListQuery, GetProjectListQueryVariables>;
export const GetSourceObjectIdentiferDocument = gql`
    query getSourceObjectIdentifer($input: GetSourceObjectIdentiferInput!) {
  getSourceObjectIdentifer(input: $input) {
    sourceObjectIdentifiers {
      idSystemObject
      identifier
    }
  }
}
    `;

/**
 * __useGetSourceObjectIdentiferQuery__
 *
 * To run a query within a React component, call `useGetSourceObjectIdentiferQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSourceObjectIdentiferQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSourceObjectIdentiferQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSourceObjectIdentiferQuery(baseOptions: Apollo.QueryHookOptions<GetSourceObjectIdentiferQuery, GetSourceObjectIdentiferQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSourceObjectIdentiferQuery, GetSourceObjectIdentiferQueryVariables>(GetSourceObjectIdentiferDocument, options);
      }
export function useGetSourceObjectIdentiferLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSourceObjectIdentiferQuery, GetSourceObjectIdentiferQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSourceObjectIdentiferQuery, GetSourceObjectIdentiferQueryVariables>(GetSourceObjectIdentiferDocument, options);
        }
export type GetSourceObjectIdentiferQueryHookResult = ReturnType<typeof useGetSourceObjectIdentiferQuery>;
export type GetSourceObjectIdentiferLazyQueryHookResult = ReturnType<typeof useGetSourceObjectIdentiferLazyQuery>;
export type GetSourceObjectIdentiferQueryResult = Apollo.QueryResult<GetSourceObjectIdentiferQuery, GetSourceObjectIdentiferQueryVariables>;
export const GetSubjectListDocument = gql`
    query getSubjectList($input: GetSubjectListInput!) {
  getSubjectList(input: $input) {
    subjects {
      idSubject
      idSystemObject
      UnitAbbreviation
      SubjectName
      IdentifierPublic
    }
  }
}
    `;

/**
 * __useGetSubjectListQuery__
 *
 * To run a query within a React component, call `useGetSubjectListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSubjectListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSubjectListQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSubjectListQuery(baseOptions: Apollo.QueryHookOptions<GetSubjectListQuery, GetSubjectListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSubjectListQuery, GetSubjectListQueryVariables>(GetSubjectListDocument, options);
      }
export function useGetSubjectListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubjectListQuery, GetSubjectListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSubjectListQuery, GetSubjectListQueryVariables>(GetSubjectListDocument, options);
        }
export type GetSubjectListQueryHookResult = ReturnType<typeof useGetSubjectListQuery>;
export type GetSubjectListLazyQueryHookResult = ReturnType<typeof useGetSubjectListLazyQuery>;
export type GetSubjectListQueryResult = Apollo.QueryResult<GetSubjectListQuery, GetSubjectListQueryVariables>;
export const GetSystemObjectDetailsDocument = gql`
    query getSystemObjectDetails($input: GetSystemObjectDetailsInput!) {
  getSystemObjectDetails(input: $input) {
    idSystemObject
    idObject
    name
    subTitle
    retired
    objectType
    allowed
    publishedState
    publishedEnum
    publishable
    thumbnail
    identifiers {
      identifier
      identifierType
      idIdentifier
    }
    unit {
      idSystemObject
      name
      objectType
    }
    project {
      idSystemObject
      name
      objectType
    }
    subject {
      idSystemObject
      name
      objectType
    }
    item {
      idSystemObject
      name
      objectType
    }
    asset {
      idSystemObject
      name
      objectType
    }
    assetOwner {
      idSystemObject
      name
      objectType
    }
    objectAncestors {
      idSystemObject
      name
      objectType
    }
    sourceObjects {
      idSystemObject
      name
      identifier
      objectType
    }
    derivedObjects {
      idSystemObject
      name
      identifier
      objectType
    }
    objectVersions {
      idSystemObjectVersion
      idSystemObject
      PublishedState
      DateCreated
      Comment
      CommentLink
    }
    metadata {
      idMetadata
      Name
      ValueShort
      ValueExtended
      idAssetVersionValue
      idVMetadataSource
      Value
      Label
    }
    licenseInheritance
    license {
      idLicense
      Name
      Description
      RestrictLevel
    }
  }
}
    `;

/**
 * __useGetSystemObjectDetailsQuery__
 *
 * To run a query within a React component, call `useGetSystemObjectDetailsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSystemObjectDetailsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSystemObjectDetailsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetSystemObjectDetailsQuery(baseOptions: Apollo.QueryHookOptions<GetSystemObjectDetailsQuery, GetSystemObjectDetailsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSystemObjectDetailsQuery, GetSystemObjectDetailsQueryVariables>(GetSystemObjectDetailsDocument, options);
      }
export function useGetSystemObjectDetailsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSystemObjectDetailsQuery, GetSystemObjectDetailsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSystemObjectDetailsQuery, GetSystemObjectDetailsQueryVariables>(GetSystemObjectDetailsDocument, options);
        }
export type GetSystemObjectDetailsQueryHookResult = ReturnType<typeof useGetSystemObjectDetailsQuery>;
export type GetSystemObjectDetailsLazyQueryHookResult = ReturnType<typeof useGetSystemObjectDetailsLazyQuery>;
export type GetSystemObjectDetailsQueryResult = Apollo.QueryResult<GetSystemObjectDetailsQuery, GetSystemObjectDetailsQueryVariables>;
export const GetVersionsForAssetDocument = gql`
    query getVersionsForAsset($input: GetVersionsForAssetInput!) {
  getVersionsForAsset(input: $input) {
    versions {
      idSystemObject
      idAssetVersion
      version
      name
      creator
      dateCreated
      size
      hash
      ingested
      Comment
      CommentLink
    }
  }
}
    `;

/**
 * __useGetVersionsForAssetQuery__
 *
 * To run a query within a React component, call `useGetVersionsForAssetQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetVersionsForAssetQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetVersionsForAssetQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetVersionsForAssetQuery(baseOptions: Apollo.QueryHookOptions<GetVersionsForAssetQuery, GetVersionsForAssetQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetVersionsForAssetQuery, GetVersionsForAssetQueryVariables>(GetVersionsForAssetDocument, options);
      }
export function useGetVersionsForAssetLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetVersionsForAssetQuery, GetVersionsForAssetQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetVersionsForAssetQuery, GetVersionsForAssetQueryVariables>(GetVersionsForAssetDocument, options);
        }
export type GetVersionsForAssetQueryHookResult = ReturnType<typeof useGetVersionsForAssetQuery>;
export type GetVersionsForAssetLazyQueryHookResult = ReturnType<typeof useGetVersionsForAssetLazyQuery>;
export type GetVersionsForAssetQueryResult = Apollo.QueryResult<GetVersionsForAssetQuery, GetVersionsForAssetQueryVariables>;
export const GetEdanUnitsNamedDocument = gql`
    query getEdanUnitsNamed {
  getEdanUnitsNamed {
    UnitEdan {
      idUnitEdan
      Name
      Abbreviation
      idUnit
    }
  }
}
    `;

/**
 * __useGetEdanUnitsNamedQuery__
 *
 * To run a query within a React component, call `useGetEdanUnitsNamedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEdanUnitsNamedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEdanUnitsNamedQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetEdanUnitsNamedQuery(baseOptions?: Apollo.QueryHookOptions<GetEdanUnitsNamedQuery, GetEdanUnitsNamedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEdanUnitsNamedQuery, GetEdanUnitsNamedQueryVariables>(GetEdanUnitsNamedDocument, options);
      }
export function useGetEdanUnitsNamedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEdanUnitsNamedQuery, GetEdanUnitsNamedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEdanUnitsNamedQuery, GetEdanUnitsNamedQueryVariables>(GetEdanUnitsNamedDocument, options);
        }
export type GetEdanUnitsNamedQueryHookResult = ReturnType<typeof useGetEdanUnitsNamedQuery>;
export type GetEdanUnitsNamedLazyQueryHookResult = ReturnType<typeof useGetEdanUnitsNamedLazyQuery>;
export type GetEdanUnitsNamedQueryResult = Apollo.QueryResult<GetEdanUnitsNamedQuery, GetEdanUnitsNamedQueryVariables>;
export const GetIngestionItemsDocument = gql`
    query getIngestionItems($input: GetIngestionItemsInput!) {
  getIngestionItems(input: $input) {
    IngestionItem {
      idItem
      EntireSubject
      MediaGroupName
      idProject
      ProjectName
    }
  }
}
    `;

/**
 * __useGetIngestionItemsQuery__
 *
 * To run a query within a React component, call `useGetIngestionItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIngestionItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIngestionItemsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetIngestionItemsQuery(baseOptions: Apollo.QueryHookOptions<GetIngestionItemsQuery, GetIngestionItemsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetIngestionItemsQuery, GetIngestionItemsQueryVariables>(GetIngestionItemsDocument, options);
      }
export function useGetIngestionItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetIngestionItemsQuery, GetIngestionItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetIngestionItemsQuery, GetIngestionItemsQueryVariables>(GetIngestionItemsDocument, options);
        }
export type GetIngestionItemsQueryHookResult = ReturnType<typeof useGetIngestionItemsQuery>;
export type GetIngestionItemsLazyQueryHookResult = ReturnType<typeof useGetIngestionItemsLazyQuery>;
export type GetIngestionItemsQueryResult = Apollo.QueryResult<GetIngestionItemsQuery, GetIngestionItemsQueryVariables>;
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
export function useGetItemQuery(baseOptions: Apollo.QueryHookOptions<GetItemQuery, GetItemQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetItemQuery, GetItemQueryVariables>(GetItemDocument, options);
      }
export function useGetItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemQuery, GetItemQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetItemQuery, GetItemQueryVariables>(GetItemDocument, options);
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
export function useGetItemsForSubjectQuery(baseOptions: Apollo.QueryHookOptions<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>(GetItemsForSubjectDocument, options);
      }
export function useGetItemsForSubjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetItemsForSubjectQuery, GetItemsForSubjectQueryVariables>(GetItemsForSubjectDocument, options);
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
      DateCreated
    }
    Scene {
      idScene
      Name
      ApprovedForPublication
      PosedAndQCd
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
export function useGetObjectsForItemQuery(baseOptions: Apollo.QueryHookOptions<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>(GetObjectsForItemDocument, options);
      }
export function useGetObjectsForItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>(GetObjectsForItemDocument, options);
        }
export type GetObjectsForItemQueryHookResult = ReturnType<typeof useGetObjectsForItemQuery>;
export type GetObjectsForItemLazyQueryHookResult = ReturnType<typeof useGetObjectsForItemLazyQuery>;
export type GetObjectsForItemQueryResult = Apollo.QueryResult<GetObjectsForItemQuery, GetObjectsForItemQueryVariables>;
export const GetProjectDocument = gql`
    query getProject($input: GetProjectInput!) {
  getProject(input: $input) {
    Project {
      idProject
      SystemObject {
        idSystemObject
      }
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
export function useGetProjectQuery(baseOptions: Apollo.QueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
      }
export function useGetProjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectQuery, GetProjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProjectQuery, GetProjectQueryVariables>(GetProjectDocument, options);
        }
export type GetProjectQueryHookResult = ReturnType<typeof useGetProjectQuery>;
export type GetProjectLazyQueryHookResult = ReturnType<typeof useGetProjectLazyQuery>;
export type GetProjectQueryResult = Apollo.QueryResult<GetProjectQuery, GetProjectQueryVariables>;
export const GetProjectDocumentationDocument = gql`
    query getProjectDocumentation($input: GetProjectDocumentationInput!) {
  getProjectDocumentation(input: $input) {
    ProjectDocumentation {
      idProjectDocumentation
    }
  }
}
    `;

/**
 * __useGetProjectDocumentationQuery__
 *
 * To run a query within a React component, call `useGetProjectDocumentationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProjectDocumentationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProjectDocumentationQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetProjectDocumentationQuery(baseOptions: Apollo.QueryHookOptions<GetProjectDocumentationQuery, GetProjectDocumentationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProjectDocumentationQuery, GetProjectDocumentationQueryVariables>(GetProjectDocumentationDocument, options);
      }
export function useGetProjectDocumentationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProjectDocumentationQuery, GetProjectDocumentationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProjectDocumentationQuery, GetProjectDocumentationQueryVariables>(GetProjectDocumentationDocument, options);
        }
export type GetProjectDocumentationQueryHookResult = ReturnType<typeof useGetProjectDocumentationQuery>;
export type GetProjectDocumentationLazyQueryHookResult = ReturnType<typeof useGetProjectDocumentationLazyQuery>;
export type GetProjectDocumentationQueryResult = Apollo.QueryResult<GetProjectDocumentationQuery, GetProjectDocumentationQueryVariables>;
export const GetSubjectDocument = gql`
    query getSubject($input: GetSubjectInput!) {
  getSubject(input: $input) {
    Subject {
      idSubject
      SystemObject {
        idSystemObject
      }
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
export function useGetSubjectQuery(baseOptions: Apollo.QueryHookOptions<GetSubjectQuery, GetSubjectQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSubjectQuery, GetSubjectQueryVariables>(GetSubjectDocument, options);
      }
export function useGetSubjectLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubjectQuery, GetSubjectQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSubjectQuery, GetSubjectQueryVariables>(GetSubjectDocument, options);
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
export function useGetSubjectsForUnitQuery(baseOptions: Apollo.QueryHookOptions<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>(GetSubjectsForUnitDocument, options);
      }
export function useGetSubjectsForUnitLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSubjectsForUnitQuery, GetSubjectsForUnitQueryVariables>(GetSubjectsForUnitDocument, options);
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
export function useGetUnitQuery(baseOptions: Apollo.QueryHookOptions<GetUnitQuery, GetUnitQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUnitQuery, GetUnitQueryVariables>(GetUnitDocument, options);
      }
export function useGetUnitLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUnitQuery, GetUnitQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUnitQuery, GetUnitQueryVariables>(GetUnitDocument, options);
        }
export type GetUnitQueryHookResult = ReturnType<typeof useGetUnitQuery>;
export type GetUnitLazyQueryHookResult = ReturnType<typeof useGetUnitLazyQuery>;
export type GetUnitQueryResult = Apollo.QueryResult<GetUnitQuery, GetUnitQueryVariables>;
export const GetUnitsFromEdanAbbreviationDocument = gql`
    query getUnitsFromEdanAbbreviation($input: GetUnitsFromEdanAbbreviationInput!) {
  getUnitsFromEdanAbbreviation(input: $input) {
    Units {
      idUnit
      Name
    }
  }
}
    `;

/**
 * __useGetUnitsFromEdanAbbreviationQuery__
 *
 * To run a query within a React component, call `useGetUnitsFromEdanAbbreviationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUnitsFromEdanAbbreviationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUnitsFromEdanAbbreviationQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetUnitsFromEdanAbbreviationQuery(baseOptions: Apollo.QueryHookOptions<GetUnitsFromEdanAbbreviationQuery, GetUnitsFromEdanAbbreviationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUnitsFromEdanAbbreviationQuery, GetUnitsFromEdanAbbreviationQueryVariables>(GetUnitsFromEdanAbbreviationDocument, options);
      }
export function useGetUnitsFromEdanAbbreviationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUnitsFromEdanAbbreviationQuery, GetUnitsFromEdanAbbreviationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUnitsFromEdanAbbreviationQuery, GetUnitsFromEdanAbbreviationQueryVariables>(GetUnitsFromEdanAbbreviationDocument, options);
        }
export type GetUnitsFromEdanAbbreviationQueryHookResult = ReturnType<typeof useGetUnitsFromEdanAbbreviationQuery>;
export type GetUnitsFromEdanAbbreviationLazyQueryHookResult = ReturnType<typeof useGetUnitsFromEdanAbbreviationLazyQuery>;
export type GetUnitsFromEdanAbbreviationQueryResult = Apollo.QueryResult<GetUnitsFromEdanAbbreviationQuery, GetUnitsFromEdanAbbreviationQueryVariables>;
export const GetUnitsFromNameSearchDocument = gql`
    query getUnitsFromNameSearch($input: GetUnitsFromNameSearchInput!) {
  getUnitsFromNameSearch(input: $input) {
    Units {
      idUnit
      Name
      Abbreviation
      SystemObject {
        idSystemObject
      }
    }
  }
}
    `;

/**
 * __useGetUnitsFromNameSearchQuery__
 *
 * To run a query within a React component, call `useGetUnitsFromNameSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUnitsFromNameSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUnitsFromNameSearchQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetUnitsFromNameSearchQuery(baseOptions: Apollo.QueryHookOptions<GetUnitsFromNameSearchQuery, GetUnitsFromNameSearchQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUnitsFromNameSearchQuery, GetUnitsFromNameSearchQueryVariables>(GetUnitsFromNameSearchDocument, options);
      }
export function useGetUnitsFromNameSearchLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUnitsFromNameSearchQuery, GetUnitsFromNameSearchQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUnitsFromNameSearchQuery, GetUnitsFromNameSearchQueryVariables>(GetUnitsFromNameSearchDocument, options);
        }
export type GetUnitsFromNameSearchQueryHookResult = ReturnType<typeof useGetUnitsFromNameSearchQuery>;
export type GetUnitsFromNameSearchLazyQueryHookResult = ReturnType<typeof useGetUnitsFromNameSearchLazyQuery>;
export type GetUnitsFromNameSearchQueryResult = Apollo.QueryResult<GetUnitsFromNameSearchQuery, GetUnitsFromNameSearchQueryVariables>;
export const SearchIngestionSubjectsDocument = gql`
    query searchIngestionSubjects($input: SearchIngestionSubjectsInput!) {
  searchIngestionSubjects(input: $input) {
    SubjectUnitIdentifier {
      idSubject
      idSystemObject
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
export function useSearchIngestionSubjectsQuery(baseOptions: Apollo.QueryHookOptions<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>(SearchIngestionSubjectsDocument, options);
      }
export function useSearchIngestionSubjectsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>(SearchIngestionSubjectsDocument, options);
        }
export type SearchIngestionSubjectsQueryHookResult = ReturnType<typeof useSearchIngestionSubjectsQuery>;
export type SearchIngestionSubjectsLazyQueryHookResult = ReturnType<typeof useSearchIngestionSubjectsLazyQuery>;
export type SearchIngestionSubjectsQueryResult = Apollo.QueryResult<SearchIngestionSubjectsQuery, SearchIngestionSubjectsQueryVariables>;
export const GetAllUsersDocument = gql`
    query getAllUsers($input: GetAllUsersInput!) {
  getAllUsers(input: $input) {
    User {
      idUser
      Active
      DateActivated
      EmailAddress
      Name
      SecurityID
      DateDisabled
      EmailSettings
      WorkflowNotificationTime
    }
  }
}
    `;

/**
 * __useGetAllUsersQuery__
 *
 * To run a query within a React component, call `useGetAllUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllUsersQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetAllUsersQuery(baseOptions: Apollo.QueryHookOptions<GetAllUsersQuery, GetAllUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAllUsersQuery, GetAllUsersQueryVariables>(GetAllUsersDocument, options);
      }
export function useGetAllUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAllUsersQuery, GetAllUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAllUsersQuery, GetAllUsersQueryVariables>(GetAllUsersDocument, options);
        }
export type GetAllUsersQueryHookResult = ReturnType<typeof useGetAllUsersQuery>;
export type GetAllUsersLazyQueryHookResult = ReturnType<typeof useGetAllUsersLazyQuery>;
export type GetAllUsersQueryResult = Apollo.QueryResult<GetAllUsersQuery, GetAllUsersQueryVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
      }
export function useGetCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
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
      DateDisabled
      EmailSettings
      EmailAddress
      WorkflowNotificationTime
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
export function useGetUserQuery(baseOptions: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
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
export function useGetVocabularyQuery(baseOptions: Apollo.QueryHookOptions<GetVocabularyQuery, GetVocabularyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetVocabularyQuery, GetVocabularyQueryVariables>(GetVocabularyDocument, options);
      }
export function useGetVocabularyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetVocabularyQuery, GetVocabularyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetVocabularyQuery, GetVocabularyQueryVariables>(GetVocabularyDocument, options);
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
        eVocabID
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
export function useGetVocabularyEntriesQuery(baseOptions: Apollo.QueryHookOptions<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>(GetVocabularyEntriesDocument, options);
      }
export function useGetVocabularyEntriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetVocabularyEntriesQuery, GetVocabularyEntriesQueryVariables>(GetVocabularyEntriesDocument, options);
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
export function useGetWorkflowQuery(baseOptions: Apollo.QueryHookOptions<GetWorkflowQuery, GetWorkflowQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWorkflowQuery, GetWorkflowQueryVariables>(GetWorkflowDocument, options);
      }
export function useGetWorkflowLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWorkflowQuery, GetWorkflowQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWorkflowQuery, GetWorkflowQueryVariables>(GetWorkflowDocument, options);
        }
export type GetWorkflowQueryHookResult = ReturnType<typeof useGetWorkflowQuery>;
export type GetWorkflowLazyQueryHookResult = ReturnType<typeof useGetWorkflowLazyQuery>;
export type GetWorkflowQueryResult = Apollo.QueryResult<GetWorkflowQuery, GetWorkflowQueryVariables>;
export const GetWorkflowListDocument = gql`
    query getWorkflowList($input: GetWorkflowListInput!) {
  getWorkflowList(input: $input) {
    WorkflowList {
      idWorkflow
      idWorkflowSet
      idWorkflowReport
      idJobRun
      Type
      State
      Owner {
        Name
      }
      DateStart
      DateLast
      Error
    }
  }
}
    `;

/**
 * __useGetWorkflowListQuery__
 *
 * To run a query within a React component, call `useGetWorkflowListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorkflowListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorkflowListQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetWorkflowListQuery(baseOptions: Apollo.QueryHookOptions<GetWorkflowListQuery, GetWorkflowListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWorkflowListQuery, GetWorkflowListQueryVariables>(GetWorkflowListDocument, options);
      }
export function useGetWorkflowListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWorkflowListQuery, GetWorkflowListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWorkflowListQuery, GetWorkflowListQueryVariables>(GetWorkflowListDocument, options);
        }
export type GetWorkflowListQueryHookResult = ReturnType<typeof useGetWorkflowListQuery>;
export type GetWorkflowListLazyQueryHookResult = ReturnType<typeof useGetWorkflowListLazyQuery>;
export type GetWorkflowListQueryResult = Apollo.QueryResult<GetWorkflowListQuery, GetWorkflowListQueryVariables>;