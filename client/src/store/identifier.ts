/**
 * Identifier store for managing IdentifierList
 */
import create, { GetState, SetState } from 'zustand';
import { StateIdentifier } from './metadata/index';
import { eVocabularySetID } from '../types/server';
import lodash from 'lodash';

type Identifier = {
    identifier: string;
    identifierType: number;
};

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
            selected: false
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
                selected: true
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

        // double check that this is working and optimized
        const updatedIdentifiers = stateIdentifiers.map(identifier => {
            if (identifier.id === id) {
                return {
                    ...identifier,
                    [name]: value,
                }
            }
            return identifier;
        })
        console.log(updatedIdentifiers);
        set({ stateIdentifiers: updatedIdentifiers });
    }
}));