/**
 * Subject Store
 *
 * This store manages state for subject used in Ingestion flow.
 */
import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';
import { ApolloQueryResult } from '@apollo/client';
import { toast } from 'react-toastify';
import { parseProjectToState, parseItemToState } from './utils';
import { apolloClient } from '../graphql';
import {
    GetIngestionProjectsForSubjectsQuery,
    GetIngestionProjectsForSubjectsDocument,
    Project,
    GetIngestionItemsForSubjectsQuery,
    GetIngestionItemsForSubjectsDocument,
    Item,
    GetProjectListQuery,
    GetProjectListDocument,
} from '../types/graphql';
import { useItemStore, StateItem } from './item';
import { useProjectStore, StateProject } from './project';

export type StateSubject = {
    id: number;
    arkId: string;
    unit: string;
    name: string;
    collectionId: string; // collectionId is used as an identifier in admin subject view
};

type SubjectStore = {
    subjects: StateSubject[];
    addSubject: (subject: StateSubject) => Promise<void>;
    addSubjects: (subjects: StateSubject[]) => void;
    removeSubject: (arkId: string) => void;
    updateProjectsAndItemsForSubjects: (selectedSubjects: StateSubject[]) => Promise<void>;
    reset: () => void;
};

export const useSubjectStore = create<SubjectStore>((set: SetState<SubjectStore>, get: GetState<SubjectStore>) => ({
    subjects: [],
    addSubjects: async (fetchedSubjects: StateSubject[]): Promise<void> => {
        // console.log(`subjectStore.addSubjects ${JSON.stringify(fetchedSubjects)}`);
        const { subjects, updateProjectsAndItemsForSubjects } = get();
        const newSubjects: StateSubject[] = lodash.concat(subjects, fetchedSubjects);
        set({ subjects: newSubjects });
        updateProjectsAndItemsForSubjects(newSubjects);
    },
    addSubject: async (subject: StateSubject): Promise<void> => {
        // console.log(`subjectStore.addSubject ${JSON.stringify(subject)}`);
        const { subjects, addSubjects } = get();
        const alreadyExists = subject.arkId ? !!lodash.find(subjects, { arkId: subject.arkId }) : false;

        if (!alreadyExists)
            addSubjects([subject]);
        else
            toast.info(`Subject ${subject.name} has already been added`);
    },
    removeSubject: (arkId: string) => {
        const { subjects, updateProjectsAndItemsForSubjects } = get();

        const updatedSubjects = lodash.filter(subjects, (subject: StateSubject) => subject.arkId !== arkId);
        set({ subjects: updatedSubjects });

        const selectedSubjects = lodash.filter(subjects, subject => subject.arkId !== arkId);
        updateProjectsAndItemsForSubjects(selectedSubjects);
    },
    updateProjectsAndItemsForSubjects: async (selectedSubjects: StateSubject[]): Promise<void> => {
        const { addProjects, loadingProjects } = useProjectStore.getState();
        const { addItems, loadingItems } = useItemStore.getState();

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
            loadingProjects();
            loadingItems();

            // fetch list of all projects
            const projectListQuery: ApolloQueryResult<GetProjectListQuery> = await apolloClient.query({
                query: GetProjectListDocument,
                variables: {
                    input: {
                        search: ''
                    }
                },
                fetchPolicy: 'no-cache'
            });
            const { data: { getProjectList: { projects: defaultProjectsList } } } = projectListQuery;
            // console.log(`defaultProjectsList = ${JSON.stringify(defaultProjectsList)}`);

            // fetch list of projects associated with subject
            const projectsQueryResult: ApolloQueryResult<GetIngestionProjectsForSubjectsQuery> = await apolloClient.query({
                query: GetIngestionProjectsForSubjectsDocument,
                variables,
                fetchPolicy: 'no-cache'
            });

            // hash the associated projects and push the rest of projects
            const projectQueryResultMap = new Map();
            const { data } = projectsQueryResult;
            if (data) {
                // console.log(`GetIngestionProjectsForSubjectsDocument = ${JSON.stringify(data)}`);

                const { Project: foundProjects, Default } = data.getIngestionProjectsForSubjects;
                foundProjects.forEach((project) => projectQueryResultMap.set(project.idProject, project));

                const projects: StateProject[] = foundProjects.map((project: Project, index: number) => parseProjectToState(project, Default ? false : !index));

                for (let i = 0; i < defaultProjectsList.length; i++) {
                    if (projectQueryResultMap.has(defaultProjectsList[i].idProject)) continue;

                    projects.push(parseProjectToState(defaultProjectsList[i] as Project, false));
                }

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
                const items: StateItem[] = foundItems.map((item: Item, index: number) => parseItemToState(item, false, index));
                addItems(items);
            }
        } catch (error) {
            toast.error('Failed to get items for subjects');
        }
    },
    reset: () => {
        set({ subjects: [] });
    }
}));
