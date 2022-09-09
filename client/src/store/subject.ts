/**
 * Subject Store
 *
 * This store manages state for subject used in Ingestion flow.
 */
import create, { SetState, GetState } from 'zustand';
import lodash from 'lodash';
import { toast } from 'react-toastify';
import { useItemStore } from './item';

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
        const { subjects, updateProjectsAndItemsForSubjects } = get();
        const newSubjects: StateSubject[] = lodash.concat(subjects, fetchedSubjects);
        set({ subjects: newSubjects });
        updateProjectsAndItemsForSubjects(newSubjects);
    },
    addSubject: async (subject: StateSubject): Promise<void> => {
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
        const { addItems, fetchAndInitializeIngestionItems, updateNewItemEntireSubject } = useItemStore.getState();

        if (!selectedSubjects.length) {
            addItems([]);
            return;
        }

        if (selectedSubjects.length > 1)
            updateNewItemEntireSubject(false);

        try {
            await fetchAndInitializeIngestionItems(selectedSubjects.map(subject => subject.id));
        } catch (error) {
            toast.error('Failed to get ingestion items');
        }
    },
    reset: () => {
        set({ subjects: [] });
    }
}));
