import create from 'zustand';
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
    Item
} from '../types/graphql';
import { useItem, StateItem } from './item';
import { useProject, StateProject } from './project';

export type StateSubject = {
    id: number;
    arkId: string;
    unit: string;
    name: string;
};

type SubjectStore = {
    subjects: StateSubject[];
    addSubject: (subject: StateSubject) => Promise<void>;
    addSubjects: (subjects: StateSubject[]) => void;
    removeSubject: (arkId: string) => void;
    updateProjectsAndItemsForSubjects: (selectedSubjects: StateSubject[]) => Promise<void>;
    reset: () => void;
};

export const useSubject = create<SubjectStore>((set, get) => ({
    subjects: [],
    addSubjects: async (fetchedSubjects: StateSubject[]): Promise<void> => {
        const { subjects } = get();
        const newSubjects: StateSubject[] = lodash.concat(subjects, fetchedSubjects);
        set({ subjects: newSubjects });
    },
    addSubject: async (subject: StateSubject): Promise<void> => {
        const { subjects, addSubjects, updateProjectsAndItemsForSubjects } = get();
        const alreadyExists = !!lodash.find(subjects, { arkId: subject.arkId });

        if (!alreadyExists) {
            addSubjects([subject]);
            const selectedSubjects = [...subjects, subject];

            updateProjectsAndItemsForSubjects(selectedSubjects);
        } else {
            toast.info(`Subject ${subject.name} has already been added`);
        }
    },
    removeSubject: (arkId: string) => {
        const { subjects, updateProjectsAndItemsForSubjects } = get();

        const updatedSubjects = lodash.filter(subjects, (subject: StateSubject) => subject.arkId !== arkId);
        set({ subjects: updatedSubjects });

        const selectedSubjects = lodash.filter(subjects, subject => subject.arkId !== arkId);
        updateProjectsAndItemsForSubjects(selectedSubjects);
    },
    updateProjectsAndItemsForSubjects: async (selectedSubjects: StateSubject[]): Promise<void> => {
        const { addItems } = useItem.getState();
        const { addProjects } = useProject.getState();

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
