/**
 * object metadata tab state store
 */
import create, { GetState, SetState } from 'zustand';
import { MetadataInput, Metadata } from '../types/graphql';
import { toast } from 'react-toastify';
import { deleteMetadata } from '../pages/Repository/hooks/useDetailsView';

export enum eObjectMetadataType {
    eSubjectView = 1,
    eSubjectCreation = 2,
    eDetailView = 3
}

export interface MetadataState extends MetadataInput {
    isImmutable: boolean;
}

/*
    idMetadata
    Name
    ValueShort
    ValuExtended
    idAssetVersionValue
    idVMetadataSource
*/
/*
    idMetadata: Scalars['Int'];
    Name: Scalars['String'];
    ValueShort?: Maybe<Scalars['String']>;
    ValueExtended?: Maybe<Scalars['String']>;
    idAssetVersionValue?: Maybe<Scalars['Int']>;
    idUser?: Maybe<Scalars['Int']>;
    idVMetadataSource?: Maybe<Scalars['Int']>;
    idSystemObject?: Maybe<Scalars['Int']>;
    idSystemObjectParent?: Maybe<Scalars['Int']>;
    AssetVersionValue?: Maybe<AssetVersion>;
    SystemObject?: Maybe<SystemObject>;
    SystemObjectParent?: Maybe<SystemObject>;
    User?: Maybe<User>;
    VMetadataSource?: Maybe<Vocabulary>;
*/

type ObjectMetadataStore = {
    metadataControl: MetadataState[];
    metadataDisplay: Metadata[];
    initializeMetadata: (type: eObjectMetadataType, metadata?: Metadata[]) => void;
    resetMetadata: () => void;
    updateMetadata: (id: number, index: number, field: string, value: string) => void;
    getAllMetadataEntries: () => MetadataInput[];
    createMetadata: () => void;
    deleteMetadata: (id: number, index: number) => Promise<void>;
};

export const useObjectMetadataStore = create<ObjectMetadataStore>((set: SetState<ObjectMetadataStore>, get: GetState<ObjectMetadataStore>) => ({
    metadataControl: [],
    metadataDisplay: [],
    initializeMetadata: (type, metadata) => {
        console.log('metadata', metadata, 'type', type);
        // TODO: populate the metadataDisplay array too
        if (type === eObjectMetadataType.eSubjectCreation) {
            const defaultMetadataFields = [{
                idMetadata: 0, Label: '', Name: 'Label', Value: '', isImmutable: true
            }, {
                idMetadata: 0, Label: '', Name: 'Title', Value: '', isImmutable: true
            }, {
                idMetadata: 0, Label: '', Name: 'Record ID', Value: '', isImmutable: true
            }, {
                idMetadata: 0, Label: '', Name: 'Unit', Value: '', isImmutable: true
            }, {
                idMetadata: 0, Label: '', Name: 'Access', Value: '', isImmutable: true
            }, {
                idMetadata: 0, Label: '', Name: 'License', Value: '', isImmutable: true
            }, {
                idMetadata: 0, Label: '', Name: 'License Text', Value: '', isImmutable: true
            }];
            set({ metadataControl: defaultMetadataFields });
        }
        if (type === eObjectMetadataType.eSubjectView) {
            // TODO: use the data that's fed through the function to populate it
            // metadata should only be populated into the MetadataControl arr
            // note: make sure to keep those default fields immutable
        }
        if (type === eObjectMetadataType.eDetailView) {
            // TODO: populate the metadata into the metadataDisplay
            // alter the metadata to fit metadataControl
            // metadata should only populated into the MetadataDisplay arr
        }
    },
    resetMetadata: () => {
        set({ metadataControl: [], metadataDisplay: [] });
    },
    updateMetadata: (id, index, field, value) => {
        // TODO: update this function to know which array to look at.
        const { metadataControl, metadataDisplay } = get();
        if (id > 0) {
            const metadataCopy = [...metadataDisplay];
            const target = metadataCopy.find(metadata => metadata.idMetadata === id);
            if (!target) {
                toast.error(`Cannot update metadata row of id ${id}`);
                return;
            }
            target[field] = value;
            set({ metadataDisplay: metadataCopy });
        } else {
            const metadataCopy = [...metadataControl];
            const target = metadataCopy[index];
            target[field] = value;
            set({ metadataControl: metadataCopy });
        }
    },
    getAllMetadataEntries: () => {
        const { metadataControl, metadataDisplay } = get();
        const metadataInputControl = metadataControl.map(({ idMetadata, Label, Name, Value }) => {
            return {
                idMetadata,
                Label,
                Name,
                Value
            };
        });
        // TODO: filter the metadataInputDisplay to match MetadataInput type
        const metadataInputDisplay = metadataDisplay.map((metadata) => {
            return convertMetadataToMetadataInput(metadata);
        });
        return [...metadataInputControl, ...metadataInputDisplay];
    },
    createMetadata: () => {
        const { metadataControl } = get();
        const metadataCopy = [...metadataControl];
        const newEntry = {
            idMetadata: 0,
            Name: '',
            Label: '',
            Value: '',
            isImmutable: false
        };
        metadataCopy.push(newEntry);
        set({ metadataControl: metadataCopy });
    },
    deleteMetadata: async (id, index) => {
        const { metadataControl, metadataDisplay } = get();
        if (id > 0) {
            const metadataCopy = [...metadataDisplay];
            const result = await deleteMetadata(id);
            if (result.data.success) {
                toast.success(`Metadata with id ${id} successfully deleted`);
            } else {
                toast.error(`An error occurred when deleting metadata with id ${id}`);
            }
            set({ metadataDisplay: metadataCopy.filter(metadata => metadata.idMetadata !== id) });
        } else {
            const metadataCopy = [...metadataControl];
            set({ metadataControl: [...metadataCopy.slice(0, index), ...metadataCopy.slice(index + 1)] });
        }
    }
}));

const convertMetadataToMetadataInput = (metadata: Metadata): MetadataInput => {
    const { idMetadata, Name, ValueShort, ValueExtended } = metadata;
    return {
        idMetadata,
        Name,
        Label: '',
        Value: ValueExtended ? ValueExtended : ValueShort ? ValueShort : ''
    };
};