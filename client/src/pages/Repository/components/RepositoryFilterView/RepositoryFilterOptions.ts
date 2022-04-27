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
    { label: 'MG Entire Subject', value: eMetadata.eItemEntireSubject },
    { label: 'CD Method', value: eMetadata.eCDCaptureMethod },
    { label: 'CD Dataset Type', value: eMetadata.eCDDatasetType },
    { label: 'CD Dataset Field ID', value: eMetadata.eCDDatasetFieldID },
    { label: 'CD Position Type', value: eMetadata.eCDItemPositionType },
    { label: 'CD Position Field ID', value: eMetadata.eCDItemPositionFieldID },
    { label: 'CD Arrangement Field ID', value: eMetadata.eCDItemArrangementFieldID },
    { label: 'CD Focus Type', value: eMetadata.eCDFocusType },
    { label: 'CD Light Source Type', value: eMetadata.eCDLightSourceType },
    { label: 'CD Background Removal Method', value: eMetadata.eCDBackgroundRemovalMethod },
    { label: 'CD Cluster Type', value: eMetadata.eCDClusterType },
    { label: 'CD Cluster Geometry Field ID', value: eMetadata.eCDClusterGeometryFieldID },
    { label: 'CD Camera Settings Uniform', value: eMetadata.eCDCameraSettingsUniform },
    { label: 'CD Variant Type', value: eMetadata.eCDVariantType },
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
    // { label: 'M Obj BB P1X', value: eMetadata.eModelObjectBoundingBoxP1X },
    // { label: 'M Obj BB P1Y', value: eMetadata.eModelObjectBoundingBoxP1Y },
    // { label: 'M Obj BB P1Z', value: eMetadata.eModelObjectBoundingBoxP1Z },
    // { label: 'M Obj BB P2X', value: eMetadata.eModelObjectBoundingBoxP2X },
    // { label: 'M Obj BB P2Y', value: eMetadata.eModelObjectBoundingBoxP2Y },
    // { label: 'M Obj BB P2Z', value: eMetadata.eModelObjectBoundingBoxP2Z },
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
    { label: 'SC Count', value: eMetadata.eSceneCountScene },
    { label: 'SC Node Count', value: eMetadata.eSceneCountNode },
    { label: 'SC Camera Count', value: eMetadata.eSceneCountCamera },
    { label: 'SC Light Count', value: eMetadata.eSceneCountLight },
    { label: 'SC Model Count', value: eMetadata.eSceneCountModel },
    { label: 'SC Meta Count', value: eMetadata.eSceneCountMeta },
    { label: 'SC Setup Count', value: eMetadata.eSceneCountSetup },
    { label: 'SC Tour Count', value: eMetadata.eSceneCountTour },
    { label: 'SC Edan UUID', value: eMetadata.eSceneEdanUUID },
    { label: 'SC Posed And QCd', value: eMetadata.eScenePosedAndQCd },
    { label: 'SC Pub Approved', value: eMetadata.eSceneApprovedForPublication },
    { label: 'Asset Type', value: eMetadata.eAssetType },
    { label: 'Asset File Name', value: eMetadata.eAVFileName },
    { label: 'Asset File Path', value: eMetadata.eAVFilePath },
    { label: 'Asset Creator', value: eMetadata.eAVUserCreator },
    { label: 'Asset Storage Hash', value: eMetadata.eAVStorageHash },
    { label: 'Asset Storage Size', value: eMetadata.eAVStorageSize },
    { label: 'Asset Ingested', value: eMetadata.eAVIngested },
    { label: 'Bulk Asset Ingest', value: eMetadata.eAVBulkIngest },
    { label: 'Organization Name', value: eMetadata.eCommonOrganizationName },
    { label: 'Stakeholder Email', value: eMetadata.eStakeholderEmailAddress },
    { label: 'Stakeholder Mobile #', value: eMetadata.eStakeholderPhoneNumberMobile },
    { label: 'Stakeholder Office #', value: eMetadata.eStakeholderPhoneNumberOffice },
    { label: 'Stakeholder Mailing Address', value: eMetadata.eStakeholderMailingAddress },
];

export const defaultDisplayMetadataAndWidth = {
    [eMetadata.eCommonName]: { name: 'Name', width: 200 },
    [eMetadata.eCommonDescription]: { name: 'Description', width: 120 },
    [eMetadata.eCommonIdentifier]: { name: 'Identifier', width: 180 },
    [eMetadata.eCommonDateCreated]: { name: 'Date Created', width: 80 },
    [eMetadata.eCommonOrganizationName]: { name: 'Organization Name', width: 120 },
    [eMetadata.eHierarchyUnit]: { name: 'Unit', width: 80 },
    [eMetadata.eHierarchyProject]: { name: 'Project', width: 150 },
    [eMetadata.eHierarchySubject]: { name: 'Subject', width: 200 },
    [eMetadata.eHierarchyItem]: { name: 'Media Group', width: 200 },
    [eMetadata.eUnitARKPrefix]: { name: 'Unit ARK Prefix', width: 100 },
    [eMetadata.eSubjectIdentifierPreferred]: { name: 'Subject Identifier', width: 110 },
    [eMetadata.eItemEntireSubject]: { name: 'Media Group Entire Subject', width: 120 },
    [eMetadata.eCDCaptureMethod]: { name: 'Capture Method', width: 80 },
    [eMetadata.eCDDatasetType]: { name: 'Capture Dataset Type', width: 150 },
    [eMetadata.eCDDatasetFieldID]: { name: 'Capture Dataset Field ID', width: 120 },
    [eMetadata.eCDItemPositionType]: { name: 'Capture Position Type', width: 110 },
    [eMetadata.eCDItemPositionFieldID]: { name: 'Capture Item Position Field ID', width: 120 },
    [eMetadata.eCDItemArrangementFieldID]: { name: 'Capture Item Arrangement Field ID', width: 150 },
    [eMetadata.eCDFocusType]: { name: 'Capture Focus Type', width: 90 },
    [eMetadata.eCDLightSourceType]: { name: 'Capture Light Source Type', width: 130 },
    [eMetadata.eCDBackgroundRemovalMethod]: { name: 'Capture Background Removal Method', width: 200 },
    [eMetadata.eCDClusterType]: { name: 'Capture Cluster Type', width: 140 },
    [eMetadata.eCDClusterGeometryFieldID]: { name: 'Capture Cluster Geometry Field ID', width: 200 },
    [eMetadata.eCDCameraSettingsUniform]: { name: 'Capture Camera Settings Uniform', width: 180 },
    [eMetadata.eCDVariantType]: { name: 'Capture Variant Type', width: 100 },
    [eMetadata.eModelCreationMethod]: { name: 'Model Creation Method', width: 120 },
    [eMetadata.eModelModality]: { name: 'Model Modality', width: 80 },
    [eMetadata.eModelUnits]: { name: 'Model Units', width: 90 },
    [eMetadata.eModelPurpose]: { name: 'Model Purpose', width: 130 },
    [eMetadata.eModelFileType]: { name: 'Model File Type', width: 200 },
    [eMetadata.eModelCountAnimations]: { name: 'Model Animation Count', width: 90 },
    [eMetadata.eModelCountCameras]: { name: 'Model Camera Count', width: 80 },
    [eMetadata.eModelCountFaces]: { name: 'Model Face Count', width: 80 },
    [eMetadata.eModelCountTriangles]: { name: 'Model Triangle Count', width: 80 },
    [eMetadata.eModelCountLights]: { name: 'Model Light Count', width: 70 },
    [eMetadata.eModelCountMaterials]: { name: 'Model Material Count', width: 80 },
    [eMetadata.eModelCountMeshes]: { name: 'Model Mesh Count', width: 70 },
    [eMetadata.eModelCountVertices]: { name: 'Model Vertex Count', width: 80 },
    [eMetadata.eModelCountEmbeddedTextures]: { name: 'Model Embedded Texture Count', width: 150 },
    [eMetadata.eModelCountLinkedTextures]: { name: 'Model Linked Texture Count', width: 120 },
    [eMetadata.eModelFileEncoding]: { name: 'Model File Encoding', width: 120 },
    [eMetadata.eModelIsDracoCompressed]: { name: 'Model Is Draco Compressed', width: 110 },
    [eMetadata.eModelMaterialName]: { name: 'Model Material Name', width: 80 },
    [eMetadata.eModelMaterialChannelType]: { name: 'Model Material Channel Type', width: 100 },
    [eMetadata.eModelMaterialChannelTypeOther]: { name: 'Model Material Channel Type Other', width: 140 },
    [eMetadata.eModelMaterialChannelUVMapEmbedded]: { name: 'Model Material Channel UV Map Embedded', width: 190 },
    [eMetadata.eModelMaterialChannelPosition]: { name: 'Model Material Channel Position', width: 120 },
    [eMetadata.eModelMaterialChannelWidth]: { name: 'Model Material Channel Width', width: 110 },
    [eMetadata.eModelMaterialChannelValues]: { name: 'Model Material Channel Values', width: 110 },
    [eMetadata.eModelMaterialChannelAdditionalAttributes]: { name: 'Model Material Channel Additional Attributes', width: 120 },
    [eMetadata.eModelMaterialUVMapEdgeLength]: { name: 'Model Material UV Map Edge Length', width: 150 },
    [eMetadata.eModelObjectBoundingBoxP1X]: { name: 'Model Object Bounding Box P1X', width: 100 },
    [eMetadata.eModelObjectBoundingBoxP1Y]: { name: 'Model Object Bounding Box P1Y', width: 100 },
    [eMetadata.eModelObjectBoundingBoxP1Z]: { name: 'Model Object Bounding Box P1Z', width: 100 },
    [eMetadata.eModelObjectBoundingBoxP2X]: { name: 'Model Object Bounding Box P2X', width: 100 },
    [eMetadata.eModelObjectBoundingBoxP2Y]: { name: 'Model Object Bounding Box P2Y', width: 100 },
    [eMetadata.eModelObjectBoundingBoxP2Z]: { name: 'Model Object Bounding Box P2Z', width: 100 },
    [eMetadata.eModelObjectCountVertices]: { name: 'Model Object Vertex Count', width: 100 },
    [eMetadata.eModelObjectCountFaces]: { name: 'Model Object Face Count', width: 90 },
    [eMetadata.eModelObjectCountTriangles]: { name: 'Model Object Triangle Count', width: 110 },
    [eMetadata.eModelObjectCountColorChannels]: { name: 'Model Object Color Channel Count', width: 120 },
    [eMetadata.eModelObjectCountTextureCoordinateChannels]: { name: 'Model Object Texture Coordinate Channel Count', width: 170 },
    [eMetadata.eModelObjectHasBones]: { name: 'Model Object Has Bones', width: 80 },
    [eMetadata.eModelObjectHasFaceNormals]: { name: 'Model Object Has Normal Face', width: 120 },
    [eMetadata.eModelObjectHasTangents]: { name: 'Model Object Has Tangent', width: 100 },
    [eMetadata.eModelObjectHasTextureCoordinates]: { name: 'Model Object Has Texture Coordinate', width: 130 },
    [eMetadata.eModelObjectHasVertexNormals]: { name: 'Model Object Has Normal Vertex', width: 130 },
    [eMetadata.eModelObjectHasVertexColor]: { name: 'Model Object Has Vertex Color', width: 120 },
    [eMetadata.eModelObjectIsTwoManifoldUnbounded]: { name: 'Model Object Is Two Manifold Unbounded', width: 190 },
    [eMetadata.eModelObjectIsTwoManifoldBounded]: { name: 'Model Object Is Two Manifold Bounded', width: 180 },
    [eMetadata.eModelObjectIsWatertight]: { name: 'Model Object Is Watertight', width: 110 },
    [eMetadata.eModelObjectSelfIntersecting]: { name: 'Model Object Self Intersecting', width: 140 },
    [eMetadata.eSceneCountScene]: { name: 'Scene Count', width: 60 },
    [eMetadata.eSceneCountNode]: { name: 'Scene Node Count', width: 100 },
    [eMetadata.eSceneCountCamera]: { name: 'Scene Camera Count', width: 110 },
    [eMetadata.eSceneCountLight]: { name: 'Scene Light Count', width: 90 },
    [eMetadata.eSceneCountModel]: { name: 'Scene Model Count', width: 100 },
    [eMetadata.eSceneCountMeta]: { name: 'Scene Meta Count', width: 90 },
    [eMetadata.eSceneCountSetup]: { name: 'Scene Setup Count', width: 100 },
    [eMetadata.eSceneCountTour]: { name: 'Scene Tour Count', width: 90 },
    [eMetadata.eSceneEdanUUID]: { name: 'Scene Edan UUID', width: 100 },
    [eMetadata.eScenePosedAndQCd]: { name: 'Scene Posed And QCd', width: 120 },
    [eMetadata.eSceneApprovedForPublication]: { name: 'Scene Approved For Publication', width: 110 },
    [eMetadata.eAssetType]: { name: 'Asset Type', width: 100 },
    [eMetadata.eAVFileName]: { name: 'Asset Version File Name', width: 100 },
    [eMetadata.eAVFilePath]: { name: 'Asset Version File Path', width: 90 },
    [eMetadata.eAVUserCreator]: { name: 'Asset Version Creator', width: 90 },
    [eMetadata.eAVStorageHash]: { name: 'Asset Version Storage Hash', width: 120 },
    [eMetadata.eAVStorageSize]: { name: 'Asset Version Storage Size', width: 110 },
    [eMetadata.eAVIngested]: { name: 'Asset Version Ingested', width: 90 },
    [eMetadata.eAVBulkIngest]: { name: 'Asset Version Bulk Ingest', width: 110 },
    [eMetadata.eStakeholderEmailAddress]: { name: 'Stakeholder Email Address', width: 110 },
    [eMetadata.eStakeholderPhoneNumberMobile]: { name: 'Stakeholder Phone Number Mobile', width: 130 },
    [eMetadata.eStakeholderPhoneNumberOffice]: { name: 'Stakeholder Phone Number Office', width: 130 },
    [eMetadata.eStakeholderMailingAddress]: { name: 'Stakeholder Mailing Address', width: 170 }
};

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

    const metadataOptions = metadataToDisplayOptions.map(({ value }) => ({ value, label: defaultDisplayMetadataAndWidth[value]['name'] }));
    return {
        chipsOptions,
        unitsOptions,
        projectsOptions,
        repositoryRootTypesOptions,
        objectToDisplayOptions,
        metadataToDisplayOptions: metadataOptions,
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