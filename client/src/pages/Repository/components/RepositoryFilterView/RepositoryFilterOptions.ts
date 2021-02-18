/**
 * RepositoryFilterOptions
 *
 * Default options for repository filter view.
 */
import { GetFilterViewDataQuery, Vocabulary } from '../../../../types/graphql';
import { eMetadata, eSystemObjectType, eVocabularySetID } from '../../../../types/server';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import lodash from 'lodash';

export type FilterOption = {
    label: string;
    value: number;
};

export type ChipOption = {
    id: number;
    type: eSystemObjectType;
    name: string;
};

type RepositoryFilterOptionsInput = {
    units: number[];
    projects: number[];
    data: GetFilterViewDataQuery | undefined;
    getEntries: (eVocabularySetID: eVocabularySetID) => Pick<Vocabulary, 'idVocabulary' | 'Term'>[]
};

type RepositoryFilterOptionsResult = {
    chipsOptions: ChipOption[];
    unitsOptions: FilterOption[];
    projectsOptions: FilterOption[];
    repositoryRootTypesOptions: FilterOption[];
    objectToDisplayOptions: FilterOption[];
    metadataToDisplayOptions: FilterOption[];
    captureMethodOptions: FilterOption[];
    variantTypeOptions: FilterOption[];
    modelPurposeOptions: FilterOption[];
    fileTypeOptions: FilterOption[];
    hasOptions: FilterOption[];
    missingOptions: FilterOption[];
};

export const metadataToDisplayOptions: FilterOption[] = [
    { label: 'Unit', value: eMetadata.eHierarchyUnit },
    { label: 'Project', value: eMetadata.eHierarchyProject },
    { label: 'Subject', value: eMetadata.eHierarchySubject },
    { label: 'Item', value: eMetadata.eHierarchyItem },
    { label: 'Identifier', value: eMetadata.eCommonIdentifier },
    { label: 'Name', value: eMetadata.eCommonName },
    { label: 'Description', value: eMetadata.eCommonDescription },
    { label: 'Date Created', value: eMetadata.eCommonDateCreated },
    { label: 'Unit ARK Prefix', value: eMetadata.eUnitARKPrefix },
    { label: 'Subject Identifier', value: eMetadata.eSubjectIdentifierPreferred },
    { label: 'Item Entire Subject', value: eMetadata.eItemEntireSubject },
    { label: 'Capture Method', value: eMetadata.eCDCaptureMethod },
    { label: 'Capture Dataset Type', value: eMetadata.eCDDatasetType },
    { label: 'Capture Dataset Field ID', value: eMetadata.eCDDatasetFieldID },
    { label: 'Capture Item Position Type', value: eMetadata.eCDItemPositionType },
    { label: 'Capture Item Position Field ID', value: eMetadata.eCDItemPositionFieldID },
    { label: 'Capture Item Arrangement Field ID', value: eMetadata.eCDItemArrangementFieldID },
    { label: 'Capture Focus Type', value: eMetadata.eCDFocusType },
    { label: 'Capture Light Source Type', value: eMetadata.eCDLightSourceType },
    { label: 'Capture Background Removal Method', value: eMetadata.eCDBackgroundRemovalMethod },
    { label: 'Capture Cluster Type', value: eMetadata.eCDClusterType },
    { label: 'Capture Cluster Geometry Field ID', value: eMetadata.eCDClusterGeometryFieldID },
    { label: 'Capture Camera Settings Uniform', value: eMetadata.eCDCameraSettingsUniform },
    { label: 'Capture Variant Type', value: eMetadata.eCDVariantType },
    { label: 'Model Creation Method', value: eMetadata.eModelCreationMethod },
    { label: 'Model Master', value: eMetadata.eModelMaster },
    { label: 'Model Authoritative', value: eMetadata.eModelAuthoritative },
    { label: 'Model Modality', value: eMetadata.eModelModality },
    { label: 'Model Units', value: eMetadata.eModelUnits },
    { label: 'Model Purpose', value: eMetadata.eModelPurpose },
    { label: 'Model File Type', value: eMetadata.eModelFileType },
    { label: 'Model Roughness', value: eMetadata.eModelRoughness },
    { label: 'Model Metalness', value: eMetadata.eModelMetalness },
    { label: 'Model Point Count', value: eMetadata.eModelPointCount },
    { label: 'Model Face Count', value: eMetadata.eModelFaceCount },
    { label: 'Model Is Watertight', value: eMetadata.eModelIsWatertight },
    { label: 'Model Has Normals', value: eMetadata.eModelHasNormals },
    { label: 'Model Has VertexColor', value: eMetadata.eModelHasVertexColor },
    { label: 'Model Has UV Space', value: eMetadata.eModelHasUVSpace },
    { label: 'Model BoundingBoxP1X', value: eMetadata.eModelBoundingBoxP1X },
    { label: 'Model BoundingBoxP1Y', value: eMetadata.eModelBoundingBoxP1Y },
    { label: 'Model BoundingBoxP1Z', value: eMetadata.eModelBoundingBoxP1Z },
    { label: 'Model BoundingBoxP2X', value: eMetadata.eModelBoundingBoxP2X },
    { label: 'Model BoundingBoxP2Y', value: eMetadata.eModelBoundingBoxP2Y },
    { label: 'Model BoundingBoxP2Z', value: eMetadata.eModelBoundingBoxP2Z },
    { label: 'Model UV Map Edge Length', value: eMetadata.eModelUVMapEdgeLength },
    { label: 'Model Channel Position', value: eMetadata.eModelChannelPosition },
    { label: 'Model Channel Width', value: eMetadata.eModelChannelWidth },
    { label: 'Model UV Map Type', value: eMetadata.eModelUVMapType },
    { label: 'Scene Is Oriented', value: eMetadata.eSceneIsOriented },
    { label: 'Scene Has Been QCd', value: eMetadata.eSceneHasBeenQCd },
    { label: 'Asset File Name', value: eMetadata.eAssetFileName },
    { label: 'Asset File Path', value: eMetadata.eAssetFilePath },
    { label: 'Asset Type', value: eMetadata.eAssetType },
    { label: 'Asset Creator', value: eMetadata.eAVUserCreator },
    { label: 'Asset Storage Hash', value: eMetadata.eAVStorageHash },
    { label: 'Asset Storage Size', value: eMetadata.eAVStorageSize },
    { label: 'Asset Ingested', value: eMetadata.eAVIngested },
    { label: 'Bulk Asset Ingest', value: eMetadata.eAVBulkIngest },
    { label: 'Organization Name', value: eMetadata.eCommonOrganizationName },
    { label: 'Stakeholder Email Address', value: eMetadata.eStakeholderEmailAddress },
    { label: 'Stakeholder Phone Number Mobile', value: eMetadata.eStakeholderPhoneNumberMobile },
    { label: 'Stakeholder Phone Number Office', value: eMetadata.eStakeholderPhoneNumberOffice },
    { label: 'Stakeholder Mailing Address', value: eMetadata.eStakeholderMailingAddress },
];

export function getRepositoryFilterOptions({ units, projects, data, getEntries }: RepositoryFilterOptionsInput): RepositoryFilterOptionsResult {
    const systemObjectTypes: FilterOption[] = [
        { label: getTermForSystemObjectType(eSystemObjectType.eUnit), value: eSystemObjectType.eUnit },
        { label: getTermForSystemObjectType(eSystemObjectType.eProject), value: eSystemObjectType.eProject },
        { label: getTermForSystemObjectType(eSystemObjectType.eSubject), value: eSystemObjectType.eSubject },
        { label: getTermForSystemObjectType(eSystemObjectType.eItem), value: eSystemObjectType.eItem },
        { label: getTermForSystemObjectType(eSystemObjectType.eCaptureData), value: eSystemObjectType.eCaptureData },
        { label: getTermForSystemObjectType(eSystemObjectType.eModel), value: eSystemObjectType.eModel },
        { label: getTermForSystemObjectType(eSystemObjectType.eScene), value: eSystemObjectType.eScene },
        { label: getTermForSystemObjectType(eSystemObjectType.eIntermediaryFile), value: eSystemObjectType.eIntermediaryFile },
        { label: getTermForSystemObjectType(eSystemObjectType.eProjectDocumentation), value: eSystemObjectType.eProjectDocumentation },
        { label: getTermForSystemObjectType(eSystemObjectType.eAsset), value: eSystemObjectType.eAsset },
        { label: getTermForSystemObjectType(eSystemObjectType.eAssetVersion), value: eSystemObjectType.eAssetVersion },
        { label: getTermForSystemObjectType(eSystemObjectType.eActor), value: eSystemObjectType.eActor },
        { label: getTermForSystemObjectType(eSystemObjectType.eStakeholder), value: eSystemObjectType.eStakeholder },
    ];

    const chipsOptions: ChipOption[] = [];
    let unitsOptions: FilterOption[] = [];
    let projectsOptions: FilterOption[] = [];

    const getFilterViewData = data?.getFilterViewData;

    if (getFilterViewData?.units && getFilterViewData.units.length) {
        unitsOptions = sortOptionsAlphabetically(getFilterViewData?.units.map(({ Name, SystemObject }) => ({ label: Name, value: SystemObject?.idSystemObject ?? 0 })));
        chipsOptions.push(...filterOptionToChipOption(units, unitsOptions, eSystemObjectType.eUnit));
    }

    if (getFilterViewData?.projects && getFilterViewData.projects.length) {
        projectsOptions = sortOptionsAlphabetically(getFilterViewData?.projects.map(({ Name, SystemObject }) => ({ label: Name, value: SystemObject?.idSystemObject ?? 0 })));
        chipsOptions.push(...filterOptionToChipOption(projects, projectsOptions, eSystemObjectType.eProject));
    }

    const repositoryRootTypesOptions: FilterOption[] = systemObjectTypes;
    const objectToDisplayOptions: FilterOption[] = systemObjectTypes;
    const captureMethodOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eCaptureDataCaptureMethod));
    const variantTypeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eCaptureDataFileVariantType));
    const modelPurposeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eModelPurpose));
    const fileTypeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eModelGeometryFileModelFileType));
    const hasOptions: FilterOption[] = systemObjectTypes;
    const missingOptions: FilterOption[] = systemObjectTypes;

    return {
        chipsOptions,
        unitsOptions,
        projectsOptions,
        repositoryRootTypesOptions,
        objectToDisplayOptions,
        metadataToDisplayOptions,
        captureMethodOptions,
        variantTypeOptions,
        modelPurposeOptions,
        fileTypeOptions,
        hasOptions,
        missingOptions
    };
}

function vocabulariesToFilterOption(vocabularies: Pick<Vocabulary, 'idVocabulary' | 'Term'>[]): FilterOption[] {
    return vocabularies.map(({ idVocabulary, Term }) => ({ label: Term, value: idVocabulary }));
}

function filterOptionToChipOption(selectedIds: number[], options: FilterOption[], type: eSystemObjectType): ChipOption[] {
    const selectedOptions: FilterOption[] = options.filter(({ value }) => selectedIds.includes(value));
    return selectedOptions.map(({ label: name, value: id }: FilterOption) => ({ id, name, type }));
}

function sortOptionsAlphabetically(options: FilterOption[]): FilterOption[] {
    return lodash.orderBy(options, [({ label }: FilterOption) => label.toLowerCase().trim()], ['asc']);
}