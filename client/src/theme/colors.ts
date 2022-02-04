/**
 * Colors
 *
 * Custom colors used in client.
 */
import { eSystemObjectType } from '@dpo-packrat/common';

type ColorMap = Record<string, string>;

type ColorType = {
    defaults: ColorMap;
    sidebarOptions: ColorMap;
    upload: ColorMap;
    repository: Record<string | number, ColorMap>;
};

const Colors: ColorType = {
    defaults: {
        white: '#FFFFFF',
        contrast: 'rgb(110, 110, 170)',
        dark: '#000000'
    },
    sidebarOptions: {
        dashboard: '#EEAF00',
        repository: '#AB7DF6',
        ingestion: '#FACA00',
        workflow: '#0093EE',
        reporting: '#81C926',
        admin: '#FD7B1F'
    },
    upload: {
        success: '#AFFFA9'
    },
    repository: {
        default: {
            dark: '#82b6e0',
            regular: '#e9f4fe',
            light: '#f4fafe'
        },
        [eSystemObjectType.eUnit]: {
            dark: '#82b6e0',
            regular: '#e9f4fe',
            light: '#f4fafe'
        },
        [eSystemObjectType.eProject]: {
            dark: '#b39ddb',
            regular: '#f6f3fb',
            light: '#faf9fd'
        },
        [eSystemObjectType.eSubject]: {
            dark: '#ffe082',
            regular: '#fff9e6',
            light: '#fffcf3'
        },
        [eSystemObjectType.eItem]: {
            dark: '#ffab91',
            regular: '#ffe6de',
            light: '#ffeee9'
        },
        [eSystemObjectType.eCaptureData]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eModel]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eScene]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eIntermediaryFile]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eProjectDocumentation]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eAsset]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eAssetVersion]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eActor]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        },
        [eSystemObjectType.eStakeholder]: {
            dark: '#a5d6a7',
            regular: '#edf7ed',
            light: '#f6fbf6'
        }
    }
};

export enum RepositoryColorVariant {
    dark = 'dark',
    regular = 'regular',
    light = 'light'
}

export default Colors;
