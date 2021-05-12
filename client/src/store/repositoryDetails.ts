/**
 * Repository Details Model Store
 * This store manages all the possible form inputs as states
 * so that it can be passed upstreams
 */
import create, { GetState, SetState } from 'zustand';

interface ModelFormFields {
    dateCaptured?: Date | null;
    authoritative?: boolean | null;
    creationMethod?: number | null;
    modality?: number | null;
    purpose?: number | null;
    units?: number | null;
    fileType?: number | null;
}

interface SubjectFormFields {
    R0?: number | null;
    R1?: number | null;
    R2?: number | null;
    R3?: number | null;
    TS0?: number | null;
    TS1?: number | null;
    TS2?: number | null;
}

type RepositoryDetailsFormStore = {
    dateCaptured: Date | null;
    authoritative: boolean | null;
    creationMethod: number | null;
    modality: number | null;
    purpose: number | null;
    units: number | null;
    fileType: number | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    R0: number | null;
    R1: number | null;
    R2: number | null;
    R3: number | null;
    TS0: number | null;
    TS1: number | null;
    TS2: number | null;
    getModelFormState: () => ModelFormFields;
    getSubjectFormState: () => SubjectFormFields;
    setFormField: (name: string, value: number | string | boolean | null) => void;
    setFormDateField: (date: Date | null) => void;
};

export const useRepositoryDetailsFormStore = create<RepositoryDetailsFormStore>((set: SetState<RepositoryDetailsFormStore>, get: GetState<RepositoryDetailsFormStore>) => ({
    dateCaptured: null,
    authoritative: null,
    creationMethod: null,
    modality: null,
    purpose: null,
    units: null,
    fileType: null,
    latitude: null,
    longitude: null,
    altitude: null,
    R0: null,
    R1: null,
    R2: null,
    R3: null,
    TS0: null,
    TS1: null,
    TS2: null,
    getModelFormState: () => {
        const {
            dateCaptured,
            authoritative,
            creationMethod,
            modality,
            purpose,
            units,
            fileType
        } = get();

        return {
            dateCaptured,
            authoritative,
            creationMethod,
            modality,
            purpose,
            units,
            fileType
        };
    },
    getSubjectFormState: () => {
        const {
            latitude,
            longitude,
            altitude,
            R0,
            R1,
            R2,
            R3,
            TS0,
            TS1,
            TS2
        } = get();

        return {
            latitude,
            longitude,
            altitude,
            R0,
            R1,
            R2,
            R3,
            TS0,
            TS1,
            TS2
        };
    },
    setFormField: (name: string, value: number | string | boolean | null): void => {
        set({ [name]: value });
    },
    setFormDateField: (date: Date | null): void => {
        set({ 'dateCaptured': date });
    }
}));