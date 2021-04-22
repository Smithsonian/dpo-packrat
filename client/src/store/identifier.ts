/**
 * Identifier store for managing IdentifierList
 */
import create, { GetState, SetState } from 'zustand';
import { eVocabularySetID } from '../types/server';
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
}

type IdentifierStore = {
    stateIdentifiers: StateIdentifier[];
    getIdentifierState: () => StateIdentifier[];
    addNewIdentifier: () => void;
    initializeIdentifierState: (identifiers: Identifier[]) => void;
    removeTargetIdentifier: (id: number) => void;
    updateIdentifier: (id: number, name: string, value: string | number | boolean) => void;
};

export const useIdentifierStore = create<IdentifierStore>((set: SetState<IdentifierStore>, get: GetState<IdentifierStore>) => ({
    stateIdentifiers: [],
    getIdentifierState: () => {
        const { stateIdentifiers } = get();
        return stateIdentifiers;
    },
    addNewIdentifier: () => {
        const { stateIdentifiers } = get();
        const newIdentifier: StateIdentifier = {
            id: stateIdentifiers.length + 1,
            identifier: '',
            identifierType: eVocabularySetID.eIdentifierIdentifierType[0],
            selected: false,
            idIdentifier: 0
        };
        const updatedIdentifiers = lodash.concat(stateIdentifiers, [newIdentifier]);
        set({ stateIdentifiers: updatedIdentifiers });
    },
    initializeIdentifierState: (identifiers) => {
        const initialIdentifiers: StateIdentifier[] = identifiers.map((identifier, ind) => {
            return {
                id: ind,
                identifier: identifier.identifier,
                identifierType: identifier.identifierType,
                selected: true,
                idIdentifier: identifier.idIdentifier
            }
        })
        set({ stateIdentifiers: initialIdentifiers });
    },
    removeTargetIdentifier: (id: number) => {
        const { stateIdentifiers } = get();
        const updatedIdentifiers = stateIdentifiers.filter(identifier => identifier.id !== id);
        set({ stateIdentifiers: updatedIdentifiers });
    },
    updateIdentifier: (id, name, value): void => {
        const { stateIdentifiers } = get();

        const updatedIdentifiers = stateIdentifiers.map(identifier => {
            if (identifier.id === id) {
                return {
                    ...identifier,
                    [name]: value,
                }
            }
            return identifier;
        })
        set({ stateIdentifiers: updatedIdentifiers });
    }
}));