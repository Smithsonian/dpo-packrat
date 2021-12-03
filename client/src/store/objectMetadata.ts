/**
 * object metadata tab state store
 */
import create, { GetState, SetState } from 'zustand';
import { MetadataInput } from '../types/graphql';
import { toast } from 'react-toastify';
//  import lodash from 'lodash';
import { deleteMetadata } from '../pages/Repository/hooks/useDetailsView'; 

export enum eObjectMetadataType {
    eSubjectView = 1,
    eSubjectCreation = 2,
    eDetailView = 3
};

export interface MetadataState extends MetadataInput {
    isImmutable: boolean;
};

type ObjectMetadataStore = {
    metadataControl: MetadataState[];
    metadataDisplay: MetadataState[];
    initializeMetadata: (type: eObjectMetadataType) => void;
    resetMetadata: () => void;
    updateMetadata: (id: number, index: number, field: string, value: string) => void;
    getAllMetadataEntries: () => MetadataInput[];
    createMetadata: () => void;
    deleteMetadata: (id: number, index: number) => Promise<void>;
};
 
export const useObjectMetadataStore = create<ObjectMetadataStore>((set: SetState<ObjectMetadataStore>, get: GetState<ObjectMetadataStore>) => ({
    metadataControl: [],
    metadataDisplay: [],
    initializeMetadata: (type) => {
        /*
            make sure to initialize the fields
            if we're working for a subject,
            make sure it's populated with the following 
            Label
            Title
            Record ID
            Unit, "DPO" selected from a Unit drop down
            Access
            License:  this is a special case in which we show the license selector drop down (the same control that we have on detail/edit pages)
            License Text (Not Required!)
        */

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
        } else if (type === eObjectMetadataType.eSubjectView) {
            // TODO: use the data that's fed through the function to populate it
        }
    },
    resetMetadata: () => { 
        set({ metadataControl: [], metadataDisplay: [] });
    },
    updateMetadata: (id, index, field, value) => {
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
            }
        });
        const metadataInputDisplay = metadataDisplay.map(({ idMetadata, Label, Name, Value }) => {
            return {
                idMetadata,
                Label,
                Name,
                Value
            }
        })
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
 