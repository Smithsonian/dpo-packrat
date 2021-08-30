/**
 * Identifier store for managing IdentifierList
 */
import create, { GetState, SetState } from 'zustand';
import { eIdentifierIdentifierType } from '../types/server';
import lodash from 'lodash';

type Identifier = {
    identifier: string;
    identifierType: number;
    idIdentifier: number;
};

type StateIdentifier = {
    id: number;
    identifier: string;
    identifierType: number;
    selected: boolean;
    idIdentifier: number;
};

type IdentifierStore = {
    stateIdentifiers: StateIdentifier[];
    originalIdentifiers: StateIdentifier[];
    subjectDetailView: boolean;
    idIdentifierPreferred: number | null;
    areIdentifiersUpdated: () => boolean;
    getIdentifierState: () => StateIdentifier[];
    addNewIdentifier: () => void;
    initializeIdentifierState: (identifiers: Identifier[]) => void;
    removeTargetIdentifier: (id: number, idInd?: boolean | number) => void;
    updateIdentifier: (id: number, name: string, value: string | number | boolean) => void;
    checkIdentifiersBeforeUpdate: () => string[];
    initializeSubjectDetailView: (isSubject: boolean) => void;
    updateIdIdentifierPreferred: (id: number) => void;
};

export const useIdentifierStore = create<IdentifierStore>((set: SetState<IdentifierStore>, get: GetState<IdentifierStore>) => ({
    stateIdentifiers: [],
    originalIdentifiers: [],
    subjectDetailView: false,
    idIdentifierPreferred: null,
    areIdentifiersUpdated: () => {
        const { stateIdentifiers, originalIdentifiers } = get();
        // return areIdentifiersUpdated(stateIdentifiers, originalIdentifiers);
        return !lodash.isEqual(stateIdentifiers, originalIdentifiers);
    },
    getIdentifierState: () => {
        const { stateIdentifiers } = get();
        return stateIdentifiers;
    },
    addNewIdentifier: () => {
        const { stateIdentifiers } = get();
        const newIdentifier: StateIdentifier = {
            id: stateIdentifiers.length + 1,
            identifier: '',
            identifierType: eIdentifierIdentifierType.eARK,
            selected: true,
            idIdentifier: 0
        };
        const updatedIdentifiers = lodash.concat(stateIdentifiers, [newIdentifier]);
        set({ stateIdentifiers: updatedIdentifiers });
    },
    initializeIdentifierState: identifiers => {
        const initialIdentifiers: StateIdentifier[] = identifiers.map((identifier, ind) => {
            return {
                id: ind,
                identifier: identifier.identifier,
                identifierType: identifier.identifierType,
                selected: true,
                idIdentifier: identifier.idIdentifier
            };
        });
        set({ stateIdentifiers: initialIdentifiers, originalIdentifiers: initialIdentifiers });
    },
    removeTargetIdentifier: (id: number, idInd = false) => {
        const { stateIdentifiers } = get();
        let updatedIdentifiers;
        if (id !== 0) {
            updatedIdentifiers = stateIdentifiers.filter(identifier => identifier.idIdentifier !== id);
        } else {
            updatedIdentifiers = stateIdentifiers.filter(identifier => identifier.id !== idInd);
        }
        set({ stateIdentifiers: updatedIdentifiers });
    },
    updateIdentifier: (id, name, value): void => {
        const { stateIdentifiers } = get();

        const updatedIdentifiers = stateIdentifiers.map(identifier => {
            if (identifier.id === id) {
                return {
                    ...identifier,
                    [name]: value
                };
            }
            return identifier;
        });
        set({ stateIdentifiers: updatedIdentifiers });
    },
    checkIdentifiersBeforeUpdate: (): string[] => {
        // this check gives users a more actionable messages about how to modify
        // identifiers before they can be successfully updated/created
        const { stateIdentifiers } = get();
        const errors = {};
        const result: string[] = [];
        stateIdentifiers.forEach(identifier => {
            if (!identifier.identifier) {
                errors['Missing identifier field'] = 'Missing identifier field';
            }
            if (!identifier.identifierType) {
                errors['Missing identifier type'] = 'Missing identifier type';
            }
            if (!identifier.selected) {
                errors['Identifiers should not be unchecked'] = 'Identifiers should not be unchecked';
            }
        });
        for (const error in errors) {
            result.push(error);
        }
        return result;
    },
    initializeSubjectDetailView: (isSubject): void => {
        set({ subjectDetailView: isSubject });
    },
    updateIdIdentifierPreferred: (id: number) => {
        const { idIdentifierPreferred } = get();
        set({ idIdentifierPreferred: idIdentifierPreferred === id ? null : idIdentifierPreferred });
    }
}));
