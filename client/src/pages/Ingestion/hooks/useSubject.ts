import { StateSubject, AppContext, IngestionDispatchAction, SUBJECT_ACTIONS, StateItem, StateProject } from '../../../context';
import { parseItemToState, parseProjectToState } from '../../../context';
import { useContext } from 'react';
import lodash from 'lodash';
import { toast } from 'react-toastify';
import useItem from './useItem';
import useProject from './useProject';
import { apolloClient } from '../../../graphql';
import {
    GetIngestionItemsForSubjectsDocument,
    GetIngestionProjectsForSubjectsDocument,
    GetIngestionItemsForSubjectsQuery,
    GetIngestionProjectsForSubjectsQuery
} from '../../../types/graphql';
import { Item, Project } from '../../../types/graphql';
import { ApolloQueryResult } from '@apollo/client';

interface UseSubject {
    addSubject: (subject: StateSubject) => Promise<void>;
    addSubjects: (subjects: StateSubject[]) => Promise<void>;
    removeSubject: (arkId: string) => void;
}

function useSubject(): UseSubject {
    const {
        ingestion: { subjects },
        ingestionDispatch
    } = useContext(AppContext);

    const { addItems } = useItem();
    const { addProjects } = useProject();

    const addSubjects = async (subjects: StateSubject[]): Promise<void> => {
        subjects.forEach((subject: StateSubject) => {
            const alreadyExists = !!lodash.find(subjects, { arkId: subject.arkId });

            if (!alreadyExists) {
                const addSubjectAction: IngestionDispatchAction = {
                    type: SUBJECT_ACTIONS.ADD_SUBJECT,
                    subject
                };

                ingestionDispatch(addSubjectAction);
            } else {
                toast.info(`Subject ${subject.name} has already been added`);
            }
        });
    };

    const addSubject = async (subject: StateSubject): Promise<void> => {
        const alreadyExists = !!lodash.find(subjects, { arkId: subject.arkId });

        if (!alreadyExists) {
            const addSubjectAction: IngestionDispatchAction = {
                type: SUBJECT_ACTIONS.ADD_SUBJECT,
                subject
            };

            ingestionDispatch(addSubjectAction);

            const selectedSubjects = [...subjects, subject];
            updateProjectsAndItemsForSubjects(selectedSubjects, addItems, addProjects);
        } else {
            toast.info(`Subject ${subject.name} has already been added`);
        }
    };

    const removeSubject = (arkId: string) => {
        const removeSubjectAction: IngestionDispatchAction = {
            type: SUBJECT_ACTIONS.REMOVE_SUBJECT,
            arkId
        };

        ingestionDispatch(removeSubjectAction);

        const selectedSubjects = lodash.filter(subjects, subject => subject.arkId !== arkId);
        updateProjectsAndItemsForSubjects(selectedSubjects, addItems, addProjects);
    };

    return {
        addSubject,
        addSubjects,
        removeSubject
    };
}

async function updateProjectsAndItemsForSubjects(selectedSubjects: StateSubject[], addItems, addProjects): Promise<void> {
    if (!selectedSubjects.length) {
        addItems([]);
        addProjects([]);
        return;
    }

    const idSubjects = selectedSubjects.map(({ id }) => id);

    const variables = {
        input: {
            idSubjects
        }
    };

    try {
        const projectsQueryResult: ApolloQueryResult<GetIngestionProjectsForSubjectsQuery> = await apolloClient.query({
            query: GetIngestionProjectsForSubjectsDocument,
            variables
        });

        const { data } = projectsQueryResult;
        if (data) {
            const { Project: foundProjects } = data.getIngestionProjectsForSubjects;

            const projects: StateProject[] = foundProjects.map((project: Project, index: number) => parseProjectToState(project, !index));

            addProjects(projects);
        }
    } catch (error) {
        toast.error('Failed to get projects for subjects');
    }

    try {
        const itemsQueryResult: ApolloQueryResult<GetIngestionItemsForSubjectsQuery> = await apolloClient.query({
            query: GetIngestionItemsForSubjectsDocument,
            variables
        });

        const { data } = itemsQueryResult;

        if (data) {
            const { Item: foundItems } = data.getIngestionItemsForSubjects;

            const items: StateItem[] = foundItems.map((item: Item) => parseItemToState(item, false));

            addItems(items);
        }
    } catch (error) {
        toast.error('Failed to get items for subjects');
    }
}

export default useSubject;
