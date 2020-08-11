import { StateItem } from './ingestion';

export const defaultItem: StateItem = {
    id: 'default',
    name: '',
    entireSubject: false,
    selected: true
};

export const PhotogrammetrySelectOptions = {
    DatasetType: ['Background Removal Image Set'],
    ItemPositionType: ['Relative To Environment'],
    FocusType: ['Fixed'],
    LightsourceType: ['Ambient'],
    BackgroundRemovalMethod: ['Clip back'],
    ClusterType: ['Spherical Image Station']
};

export const defaultPhotogrammetryFields = {
    description: '',
    dateCaptured: new Date(),
    datasetType: PhotogrammetrySelectOptions.DatasetType[0],
    datasetFieldId: '',
    itemPositionType: PhotogrammetrySelectOptions.ItemPositionType[0],
    itemPositionFieldId: '',
    itemArrangementFieldId: '',
    focusType: PhotogrammetrySelectOptions.FocusType[0],
    lightsourceType: PhotogrammetrySelectOptions.LightsourceType[0],
    backgroundRemovalMethod: PhotogrammetrySelectOptions.BackgroundRemovalMethod[0],
    clusterType: PhotogrammetrySelectOptions.ClusterType[0],
    clusterGeometryFieldId: '',
    cameraSettingUniform: false
};
