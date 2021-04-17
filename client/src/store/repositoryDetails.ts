/**
 * Repository Details Model Store
 */
import create, { GetState, SetState } from 'zustand';

interface FormFields {
    dateCaptured?: Date | null;
    master?: boolean | null;
    authoritative?: boolean | null;
    creationMethod?: number | null;
    modality?: number | null;
    purpose?: number | null;
    units?: number | null;
    fileType?: number | null;
}

type RepositoryDetailsFormStore = {
    dateCaptured: Date | null;
    master: boolean | null;
    authoritative: boolean | null;
    creationMethod: number | null;
    modality: number | null;
    purpose: number | null;
    units: number | null;
    fileType: number | null;
    getFormState: () => FormFields;
    setFormField: (name: string, value: number | string | boolean | null) => void;
    setFormDateField: (date: Date | null) => void;
};

export const useRepositoryDetailsFormStore = create<RepositoryDetailsFormStore>((set: SetState<RepositoryDetailsFormStore>, get: GetState<RepositoryDetailsFormStore>) => ({
    dateCaptured: null,
    master: null,
    authoritative: null,
    creationMethod: null,
    modality: null,
    purpose: null,
    units: null,
    fileType: null,
    getFormState: () => {
        const {
            dateCaptured,
            master,
            authoritative,
            creationMethod,
            modality,
            purpose,
            units,
            fileType
        } = get();

        return {
            dateCaptured,
            master,
            authoritative,
            creationMethod,
            modality,
            purpose,
            units,
            fileType
        };
    },
    setFormField: (name: string, value: number | string | boolean | null): void => {
        set({ [name]: value });
    },
    setFormDateField: (date: Date | null): void => {
        set({ 'dateCaptured': date });
    }
}));