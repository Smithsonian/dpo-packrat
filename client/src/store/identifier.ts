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
    idIdentifier: number;
    preferred?: boolean;
};

type IdentifierStore = {
    stateIdentifiers: StateIdentifier[];
    originalIdentifiers: StateIdentifier[];
    areIdentifiersUpdated: () => boolean;
    getIdentifierState: () => StateIdentifier[];
    addNewIdentifier: () => void;
    initializeIdentifierState: (identifiers: Identifier[]) => void;
    initializeIdentifierPreferred: () => void;
    removeTargetIdentifier: (id: number, idInd?: boolean | number) => void;
    updateIdentifier: (id: number, name: string, value: string | number | boolean) => void;
    checkIdentifiersBeforeUpdate: () => string[];
    initializePreferredIdentifier: (idIdentifier: number) => void;
    updateIdentifierPreferred: (id: number) => void;
};

export const useIdentifierStore = create<IdentifierStore>((set: SetState<IdentifierStore>, get: GetState<IdentifierStore>) => ({
    stateIdentifiers: [],
    originalIdentifiers: [],
    areIdentifiersUpdated: () => {
        const { stateIdentifiers, originalIdentifiers } = get();
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
            idIdentifier: 0,
            preferred: false
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
                idIdentifier: identifier.idIdentifier
            };
        });
        set({ stateIdentifiers: initialIdentifiers, originalIdentifiers: initialIdentifiers });
    },
    initializeIdentifierPreferred: () => {},
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
        });
        for (const error in errors) {
            result.push(error);
        }
        return result;
    },
    // this method will be responsible for setting the preferred identifier
    initializePreferredIdentifier: (idIdentifier: number): void => {
        const { stateIdentifiers } = get();
        const stateIdentifiersCopy = stateIdentifiers.map(identifier => {
            if (identifier.idIdentifier === idIdentifier) identifier.preferred = true;
            return identifier;
        });
        set({ stateIdentifiers: stateIdentifiersCopy });
    },
    updateIdentifierPreferred: (id: number): void => {
        const { stateIdentifiers } = get();
        const stateIdentifiersCopy = stateIdentifiers.map(identifier => {
            if (id === identifier.id) {
                if (identifier.preferred) {
                    identifier.preferred = undefined;
                } else {
                    identifier.preferred = true;
                }
                return identifier;
            }
            identifier.preferred = undefined;
            return identifier;
        });
        set({ stateIdentifiers: stateIdentifiersCopy });
    }
}));
