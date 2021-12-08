/**
 * object metadata tab state store
 */
import create, { GetState, SetState } from 'zustand';
import { MetadataInput, Metadata } from '../types/graphql';
import { toast } from 'react-toastify';
import { deleteMetadata } from '../pages/Repository/hooks/useDetailsView';
import lodash from 'lodash';


export enum eObjectMetadataType {
    eSubjectView = 1,
    eSubjectCreation = 2,
    eDetailView = 3
}

export interface MetadataState extends MetadataInput {
    isImmutable: boolean;
}

interface MetadataWithId extends Metadata {
    id: number;
}

type ObjectMetadataStore = {
    metadataControl: MetadataState[];
    metadataDisplay: MetadataWithId[];
    initialControl: MetadataState[];
    initialDisplay: MetadataWithId[];
    mdmFields: Set<string>;
    initializeMdmEntries: (entries: string[]) => void;
    initializeMetadata: (type: eObjectMetadataType, metadata?: Metadata[]) => void;
    resetMetadata: () => void;
    updateMetadata: (id: number, index: number, field: string, value: string) => void;
    getAllMetadataEntries: () => MetadataInput[];
    getAllMdmFieldsArr: () => string[];
    createMetadata: () => void;
    deleteMetadata: (id: number, index: number) => Promise<void>;
    areMetadataUpdated: () => boolean;
    validateMetadataFields: (type?: eObjectMetadataType) => string[];
};

export const isUniqueSubjectFields = new Set(['Label', 'Title', 'Record ID', 'Access', 'License', 'License Text']);
export const isRequired = new Set(['Label', 'Title', 'Record ID', 'Access', 'License']);
export const noLabel = new Set(['Label', 'Title', 'Record ID', 'Access', 'License', 'License Text', 'Object Type', 'Date', 'Place', 'Topic']);

export const useObjectMetadataStore = create<ObjectMetadataStore>((set: SetState<ObjectMetadataStore>, get: GetState<ObjectMetadataStore>) => ({
    metadataControl: [],
    metadataDisplay: [],
    initialControl: [],
    initialDisplay: [],
    mdmFields: new Set(),
    initializeMdmEntries: (entries): void => {
        const mdmFields = new Set<string>();
        entries.forEach(entry => mdmFields.add(entry));
        set({ mdmFields });
    },
    initializeMetadata: (type, metadata) => {
        const { mdmFields } = get();
        const uniqueFieldSet = new Set(['Label', 'Title', 'Record ID', 'Access', 'License', 'License Text']);
        // subject creation will default with a set array of fields
        if (type === eObjectMetadataType.eSubjectCreation) {
            const defaultMetadataFields: MetadataState[] = [];
            uniqueFieldSet.forEach(immutable => defaultMetadataFields.push({
                idMetadata: 0, Label: '', Name: immutable, Value: '', isImmutable: true
            }));
            set({ metadataControl: defaultMetadataFields, metadataDisplay: [], initialControl: defaultMetadataFields, initialDisplay: [] });
        }
        // subject view will render MDM fields in control and everything else in display
        if (type === eObjectMetadataType.eSubjectView) {
            const metadataControl: MetadataState[] = [];
            const metadataDisplay: MetadataWithId[] = [];
            metadata?.forEach((entry) => {
                if (mdmFields.has(entry.Name)) {
                    metadataControl.push({
                        idMetadata: entry.idMetadata,
                        Name: entry.Name,
                        Label: entry?.Label ?? '',
                        Value: entry?.Value ?? '',
                        isImmutable: false
                    });
                } else {
                    metadataDisplay.push({
                        ...entry,
                        id: entry.idMetadata
                    });
                }
            });
            set({ metadataControl, metadataDisplay, initialDisplay: metadataDisplay, initialControl: metadataControl });
        }
        // detail view will render everything in the metadataDisplay array
        if (type === eObjectMetadataType.eDetailView) {
            const metadataWithId: MetadataWithId[] = metadata?.map((metadata) => {
                return {
                    ...metadata,
                    id: metadata.idMetadata
                };
            }) ?? [];
            set({ metadataDisplay: metadataWithId, metadataControl: [], initialDisplay: metadataWithId, initialControl: [] });
        }
    },
    resetMetadata: () => {
        set({ metadataControl: [], metadataDisplay: [] });
    },
    updateMetadata: (id, index, field, value) => {
        const { metadataControl, metadataDisplay } = get();
        if (id > 0) {
            const controlIndex = metadataControl.findIndex(metadata => metadata.idMetadata === id);
            const displayIndex = metadataDisplay.findIndex(metadata => metadata.idMetadata === id);
            if (controlIndex > -1) {
                const controlCopy = lodash.cloneDeep(metadataControl);
                controlCopy[controlIndex][field] = value;
                set({ metadataControl: controlCopy });
            } else if (displayIndex > -1) {
                const displayCopy = lodash.cloneDeep(metadataDisplay);
                displayCopy[displayIndex][field] = value;
                set({ metadataDisplay: displayCopy });
            } else {
                toast.error(`Cannot update metadata row of id ${id}`);
                return;
            }
        } else {
            const controlCopy = [...metadataControl];
            controlCopy[index][field] = value;
            set({ metadataControl: controlCopy });
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

        const metadataInputDisplay: MetadataInput[] = [];
        metadataDisplay.forEach(metadata => {
            if (metadata.ValueShort)
                metadataInputDisplay.push(convertMetadataToMetadataInput(metadata));
        });
        return [...metadataInputControl, ...metadataInputDisplay];
    },
    getAllMdmFieldsArr: () => {
        const { mdmFields } = get();
        const result: string[] = [];
        mdmFields.forEach(field => result.push(field));
        return result;
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
            const confirm = window.confirm('Are you sure you wish to remove this metadata entry?');
            if (!confirm) return;

            const controlIndex = metadataControl.findIndex(metadata => metadata.idMetadata === id);
            const displayIndex = metadataDisplay.findIndex(metadata => metadata.idMetadata === id);
            const result = await deleteMetadata(id);
            if (result.data.deleteMetadata.success) {
                toast.success(`Metadata with id ${id} successfully deleted`);
                if (controlIndex > -1)
                    set({ metadataControl: [...metadataControl.slice(0, controlIndex), ...metadataControl.slice(controlIndex + 1)] });
                if (displayIndex > -1)
                    set({ metadataDisplay: [...metadataDisplay.slice(0, displayIndex), ...metadataDisplay.slice(displayIndex + 1)] });
            } else {
                toast.error(`An error occurred when deleting metadata with id ${id}`);
            }
        } else {
            set({ metadataControl: [...metadataControl.slice(0, index), ...metadataControl.slice(index + 1)] });
        }
    },
    areMetadataUpdated: () => {
        const { metadataControl, initialControl, metadataDisplay, initialDisplay } = get();
        const controlChange = !lodash.isEqual(metadataControl, initialControl);
        const displayChange = !lodash.isEqual(metadataDisplay, initialDisplay);

        return controlChange || displayChange;
    },
    validateMetadataFields: (type) => {
        const { metadataControl } = get();
        const errorArr: string[] = [];
        // for now, we have a subject creation case and a generic case
        if (type === eObjectMetadataType.eSubjectCreation) {
            const uniqueMap = new Map();
            isUniqueSubjectFields.forEach(field => {
                uniqueMap.set(field, true);
            });
            metadataControl.forEach(metadata => {
                const isUnique = isUniqueSubjectFields.has(metadata.Name);
                if (isUnique) {
                    const inMap = uniqueMap.get(metadata.Name);
                    if (inMap) {
                        if (!metadata.Value && metadata.Name !== 'License Text')
                            errorArr.push(`${metadata.Name} requires a value`);
                        uniqueMap.delete(metadata.Name);
                    } else {
                        errorArr.push(`${metadata.Name} field should only have 1 entry`);
                    }
                }
                if (!metadata.Name && (metadata.Value || metadata.Label)) {
                    if (metadata.Value) {
                        errorArr.push(`Row with value ${metadata.Value} requires a name`);
                    } else {
                        errorArr.push(`Row with label ${metadata.Label} requires a name`);
                    }
                }
            });

            uniqueMap.forEach((_value, key) => {
                if (key !== 'License Text')
                    errorArr.push(`${key} field is required in subject creation`);
            });
        } else {
            metadataControl.forEach(metadata => {
                if (!metadata.Name && (metadata.Value || metadata.Label)) {
                    if (metadata.Value) {
                        errorArr.push(`Row with value ${metadata.Value} requires a name`);
                    } else {
                        errorArr.push(`Row with label ${metadata.Label} requires a name`);
                    }
                }
            });
        }

        return errorArr;
    }
}));

const convertMetadataToMetadataInput = (metadata: Metadata): MetadataInput => {
    const { idMetadata, Name, ValueShort, ValueExtended, Label, Value } = metadata;
    return {
        idMetadata,
        Name,
        Label: Label ?? '',
        Value: ValueExtended ? ValueExtended : ValueShort && Value ? Value : ''
    };
};