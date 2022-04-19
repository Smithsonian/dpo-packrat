/**
 * RepositoryFilterOptions
 *
 * Default options for repository filter view.
 */
import { GetFilterViewDataQuery, Vocabulary } from '../../../../types/graphql';
import { eMetadata, eSystemObjectType, eVocabularySetID } from '@dpo-packrat/common';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import lodash from 'lodash';

export enum eRepositoryChipFilterType {
    eProject,
    eUnit,
    eHas,
    eMissing,
    eCaptureMethod,
    eVariantType,
    eModelPurpose,
    eModelFileType,
    eDateCreatedFrom,
    eDateCreatedTo
}

export type FilterOption = {
    label: string;
    value: number;
};

export type ChipOption = {
    id: number;
    type: eRepositoryChipFilterType;
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
    { label: 'Media Group', value: eMetadata.eHierarchyItem },
    { label: 'Identifier', value: eMetadata.eCommonIdentifier },
    { label: 'Name', value: eMetadata.eCommonName },
    { label: 'Description', value: eMetadata.eCommonDescription },
    { label: 'Date Created', value: eMetadata.eCommonDateCreated },
    { label: 'Unit ARK Prefix', value: eMetadata.eUnitARKPrefix },
    { label: 'Subject Identifier', value: eMetadata.eSubjectIdentifierPreferred },
    { label: 'Media Group Entire Subject', value: eMetadata.eItemEntireSubject },
    { label: 'Capture Method', value: eMetadata.eCDCaptureMethod },
    { label: 'Capture Dataset Type', value: eMetadata.eCDDatasetType },
    { label: 'Capture Dataset Field ID', value: eMetadata.eCDDatasetFieldID },
    { label: 'Capture Position Type', value: eMetadata.eCDItemPositionType },
    { label: 'Capture Position Field ID', value: eMetadata.eCDItemPositionFieldID },
    { label: 'Capture Arrangement Field ID', value: eMetadata.eCDItemArrangementFieldID },
    { label: 'Capture Focus Type', value: eMetadata.eCDFocusType },
    { label: 'Capture Light Source Type', value: eMetadata.eCDLightSourceType },
    { label: 'Capture Background Removal Method', value: eMetadata.eCDBackgroundRemovalMethod },
    { label: 'Capture Cluster Type', value: eMetadata.eCDClusterType },
    { label: 'Capture Cluster Geometry Field ID', value: eMetadata.eCDClusterGeometryFieldID },
    { label: 'Capture Camera Settings Uniform', value: eMetadata.eCDCameraSettingsUniform },
    { label: 'Capture Variant Type', value: eMetadata.eCDVariantType },
    { label: 'M Creation Method', value: eMetadata.eModelCreationMethod },
    { label: 'M Modality', value: eMetadata.eModelModality },
    { label: 'M Units', value: eMetadata.eModelUnits },
    { label: 'M Purpose', value: eMetadata.eModelPurpose },
    { label: 'M File Type', value: eMetadata.eModelFileType },
    { label: 'M Animation Ct', value: eMetadata.eModelCountAnimations },
    { label: 'M Camera Ct', value: eMetadata.eModelCountCameras },
    { label: 'M Face Ct', value: eMetadata.eModelCountFaces },
    { label: 'M Triangle Ct', value: eMetadata.eModelCountTriangles },
    { label: 'M Light Ct', value: eMetadata.eModelCountLights },
    { label: 'M Material Ct', value: eMetadata.eModelCountMaterials },
    { label: 'M Mesh Ct', value: eMetadata.eModelCountMeshes },
    { label: 'M Vertex Ct', value: eMetadata.eModelCountVertices },
    { label: 'M Embedded Texture Ct', value: eMetadata.eModelCountEmbeddedTextures },
    { label: 'M Linked Texture Ct', value: eMetadata.eModelCountLinkedTextures },
    { label: 'M File Encoding', value: eMetadata.eModelFileEncoding },
    { label: 'M Is Draco Compr', value: eMetadata.eModelIsDracoCompressed },
    { label: 'M Mtl Name', value: eMetadata.eModelMaterialName },
    { label: 'M Mtl Chnl Type', value: eMetadata.eModelMaterialChannelType },
    { label: 'M Mtl Chnl Type Other', value: eMetadata.eModelMaterialChannelTypeOther },
    { label: 'M Mtl Chnl UV Map Embedded', value: eMetadata.eModelMaterialChannelUVMapEmbedded },
    { label: 'M Mtl Chnl Postion', value: eMetadata.eModelMaterialChannelPosition },
    { label: 'M Mtl Chnl Width', value: eMetadata.eModelMaterialChannelWidth },
    { label: 'M Mtl Chnl Values', value: eMetadata.eModelMaterialChannelValues },
    { label: 'M Mtl Chnl Addl Attr', value: eMetadata.eModelMaterialChannelAdditionalAttributes },
    { label: 'M Mtl UV Map Edge Len', value: eMetadata.eModelMaterialUVMapEdgeLength },
    { label: 'M Obj BB P1X', value: eMetadata.eModelObjectBoundingBoxP1X },
    { label: 'M Obj BB P1Y', value: eMetadata.eModelObjectBoundingBoxP1Y },
    { label: 'M Obj BB P1Z', value: eMetadata.eModelObjectBoundingBoxP1Z },
    { label: 'M Obj BB P2X', value: eMetadata.eModelObjectBoundingBoxP2X },
    { label: 'M Obj BB P2Y', value: eMetadata.eModelObjectBoundingBoxP2Y },
    { label: 'M Obj BB P2Z', value: eMetadata.eModelObjectBoundingBoxP2Z },
    { label: 'M Obj Vertex Ct', value: eMetadata.eModelObjectCountVertices },
    { label: 'M Obj Face Ct', value: eMetadata.eModelObjectCountFaces },
    { label: 'M Obj Traingle Ct', value: eMetadata.eModelObjectCountTriangles },
    { label: 'M Obj Color Chnl Ct', value: eMetadata.eModelObjectCountColorChannels },
    { label: 'M Obj Texture Coord Chnl Ct', value: eMetadata.eModelObjectCountTextureCoordinateChannels },
    { label: 'M Obj Bones', value: eMetadata.eModelObjectHasBones },
    { label: 'M Obj Face Normals', value: eMetadata.eModelObjectHasFaceNormals },
    { label: 'M Obj Tangents', value: eMetadata.eModelObjectHasTangents },
    { label: 'M Obj Texture Coord', value: eMetadata.eModelObjectHasTextureCoordinates },
    { label: 'M Obj Vertex Normals', value: eMetadata.eModelObjectHasVertexNormals },
    { label: 'M Obj Vertex Color', value: eMetadata.eModelObjectHasVertexColor },
    { label: 'M Obj Two Manifold Unbounded', value: eMetadata.eModelObjectIsTwoManifoldUnbounded },
    { label: 'M Obj Two Manifold Bounded', value: eMetadata.eModelObjectIsTwoManifoldBounded },
    { label: 'M Obj Watertight', value: eMetadata.eModelObjectIsWatertight },
    { label: 'M Obj Self Intersecting', value: eMetadata.eModelObjectSelfIntersecting },
    { label: 'Scene Count', value: eMetadata.eSceneCountScene },
    { label: 'Scene Node Count', value: eMetadata.eSceneCountNode },
    { label: 'Scene Camera Count', value: eMetadata.eSceneCountCamera },
    { label: 'Scene Light Count', value: eMetadata.eSceneCountLight },
    { label: 'Scene Model Count', value: eMetadata.eSceneCountModel },
    { label: 'Scene Meta Count', value: eMetadata.eSceneCountMeta },
    { label: 'Scene Setup Count', value: eMetadata.eSceneCountSetup },
    { label: 'Scene Tour Count', value: eMetadata.eSceneCountTour },
    { label: 'Scene Edan UUID', value: eMetadata.eSceneEdanUUID },
    { label: 'Scene Posed And QCd', value: eMetadata.eScenePosedAndQCd },
    { label: 'Scene Approved For Publication', value: eMetadata.eSceneApprovedForPublication },
    { label: 'Asset Type', value: eMetadata.eAssetType },
    { label: 'Asset File Name', value: eMetadata.eAVFileName },
    { label: 'Asset File Path', value: eMetadata.eAVFilePath },
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
        chipsOptions.push(...filterOptionToChipOption(units, unitsOptions, eRepositoryChipFilterType.eUnit));
    }

    if (getFilterViewData?.projects && getFilterViewData.projects.length) {
        projectsOptions = sortOptionsAlphabetically(getFilterViewData?.projects.map(({ Name, SystemObject }) => ({ label: Name, value: SystemObject?.idSystemObject ?? 0 })));
        chipsOptions.push(...filterOptionToChipOption(projects, projectsOptions, eRepositoryChipFilterType.eProject));
    }

    const repositoryRootTypesOptions: FilterOption[] = systemObjectTypes;
    const objectToDisplayOptions: FilterOption[] = systemObjectTypes;
    const captureMethodOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eCaptureDataCaptureMethod));
    const variantTypeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eCaptureDataFileVariantType));
    const modelPurposeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eModelPurpose));
    const fileTypeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eModelFileType));
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

function filterOptionToChipOption(selectedIds: number[], options: FilterOption[], type: eRepositoryChipFilterType): ChipOption[] {
    const selectedOptions: FilterOption[] = options.filter(({ value }) => selectedIds.includes(value));
    return selectedOptions.map(({ label: name, value: id }: FilterOption) => ({ id, name, type }));
}

function sortOptionsAlphabetically(options: FilterOption[]): FilterOption[] {
    return lodash.orderBy(options, [({ label }: FilterOption) => label.toLowerCase().trim()], ['asc']);
}

export function getTermForRepositoryFilterType(filterType: eRepositoryChipFilterType): string {
    switch (filterType) {
        case eRepositoryChipFilterType.eUnit:                   return 'Unit';
        case eRepositoryChipFilterType.eProject:                return 'Project';
        case eRepositoryChipFilterType.eHas:                    return 'Has';
        case eRepositoryChipFilterType.eMissing:                return 'Missing';
        case eRepositoryChipFilterType.eCaptureMethod:          return 'Capture Method';
        case eRepositoryChipFilterType.eVariantType:            return 'Variant Type';
        case eRepositoryChipFilterType.eModelPurpose:           return 'Model Purpose';
        case eRepositoryChipFilterType.eModelFileType:          return 'Model File Type';
        case eRepositoryChipFilterType.eDateCreatedFrom:        return 'Created From';
        case eRepositoryChipFilterType.eDateCreatedTo:          return 'Created To';
    }
}