import { StateItem, PhotogrammetryFields } from './ingestion';

export const defaultItem: StateItem = {
    id: 'default',
    name: '',
    entireSubject: false,
    selected: true
};

export const defaultPhotogrammetryFields: PhotogrammetryFields = {
    systemCreated: true,
    identifiers: [],
    description: '',
    dateCaptured: new Date(),
    datasetType: null,
    datasetFieldId: null,
    itemPositionType: null,
    itemPositionFieldId: null,
    itemArrangementFieldId: null,
    focusType: null,
    lightsourceType: null,
    backgroundRemovalMethod: null,
    clusterType: null,
    clusterGeometryFieldId: null,
    cameraSettingUniform: false
};
