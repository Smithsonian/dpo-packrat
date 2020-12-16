/**
 * RepositoryFilterOptions
 *
 * Default options for repository filter view.
 */
import { GetFilterViewDataQuery, Vocabulary } from '../../../../types/graphql';
import { eMetadata, eSystemObjectType, eVocabularySetID } from '../../../../types/server';
import { getTermForSystemObjectType } from '../../../../utils/repository';

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
        { label: getTermForSystemObjectType(eSystemObjectType.eUnknown), value: eSystemObjectType.eUnknown },
    ];

    const chipsOptions: ChipOption[] = [];
    let unitsOptions: FilterOption[] = [];
    let projectsOptions: FilterOption[] = [];

    const getFilterViewData = data?.getFilterViewData;

    if (getFilterViewData?.units && getFilterViewData.units.length) {
        unitsOptions = getFilterViewData?.units.map(({ Name, SystemObject }) => ({ label: Name, value: SystemObject?.idSystemObject ?? 0 }));
        chipsOptions.push(...filterOptionToChipOption(units, unitsOptions, eSystemObjectType.eUnit));
    }

    if (getFilterViewData?.projects && getFilterViewData.projects.length) {
        projectsOptions = getFilterViewData?.projects.map(({ Name, SystemObject }) => ({ label: Name, value: SystemObject?.idSystemObject ?? 0 }));
        chipsOptions.push(...filterOptionToChipOption(projects, projectsOptions, eSystemObjectType.eProject));
    }

    const repositoryRootTypesOptions: FilterOption[] = systemObjectTypes.slice(0, 2);

    const objectToDisplayOptions: FilterOption[] = systemObjectTypes.slice(0, 2);

    const metadataToDisplayOptions: FilterOption[] = [
        { label: 'Unit Abbreviation', value: eMetadata.eUnitAbbreviation },
        { label: 'Subject Identifier', value: eMetadata.eSubjectIdentifier },
        { label: 'Item Name', value: eMetadata.eItemName }
    ];

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