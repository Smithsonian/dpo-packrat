import { eVocabularySetID, eWorkflowJobRunStatus } from '@dpo-packrat/common';
import { Vocabulary } from '../../../types/graphql';

export type FilterOption = {
    label: string;
    value: number;
};

type WorkflowFilterOptionsResult = {
    workflowTypeOptions: FilterOption[];
    jobTypeOptions: FilterOption[];
    stateOptions: FilterOption[];
    initiatorOptions: FilterOption[];
    ownerOptions: FilterOption[];
};

export function getWorkflowFilterOptions(
    users: FilterOption[],
    getEntries: (eVocabularySetID: eVocabularySetID) => Pick<Vocabulary, 'idVocabulary' | 'Term'>[]
): WorkflowFilterOptionsResult {
    const workflowTypeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eWorkflowType));
    const jobTypeOptions: FilterOption[] = vocabulariesToFilterOption(getEntries(eVocabularySetID.eJobJobType));

    return {
        workflowTypeOptions,
        jobTypeOptions,
        stateOptions: [
            { label: 'Uninitialized', value: eWorkflowJobRunStatus.eUnitialized },
            { label: 'Created', value: eWorkflowJobRunStatus.eCreated },
            { label: 'Running', value: eWorkflowJobRunStatus.eRunning },
            { label: 'Waiting', value: eWorkflowJobRunStatus.eWaiting },
            { label: 'Done', value: eWorkflowJobRunStatus.eDone },
            { label: 'Error', value: eWorkflowJobRunStatus.eError },
            { label: 'Cancelled', value: eWorkflowJobRunStatus.eCancelled }
        ],
        initiatorOptions: users,
        ownerOptions: users
    };
}

function vocabulariesToFilterOption(vocabularies: Pick<Vocabulary, 'idVocabulary' | 'Term'>[]): FilterOption[] {
    return vocabularies.map(({ idVocabulary, Term }) => ({ label: Term, value: idVocabulary }));
}
