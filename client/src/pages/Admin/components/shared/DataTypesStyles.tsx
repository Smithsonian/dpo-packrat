import { makeStyles } from '@material-ui/core/styles';

export type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};
export type ColumnHeader = {
    key: string,
    label: string,
    align?: 'left' | 'right' | 'inherit' | 'center' | 'justify' | undefined,
    tooltip?: string,
    link?: boolean
};

// TODO: add enums and types to library and/or COMMON as needed
// NOTE: 'Summary' types/objects are intended for return via the API and for external use
//       so non-standard types (e.g. enums) are converted to strings for clarity/accessibility.
export type AssetSummary = DBReference & {
    downloadable: boolean,
    quality: string,
    usage: string,
    dateCreated: Date,
    dateModified: Date,
    creator: {                      // who created the asset
        idUser: number,
        email: string,
        name: string,
    },
};
export type AssetList = {
    status: string,
    items: AssetSummary[],
    expected?: number,
};
export type SceneSummary = DBReference & {
    publishedState: string,
    datePublished: Date,
    isReviewed: boolean
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    dateCreated: Date,
    dateModified: Date,
    downloads: AssetList,
    derivatives:    {
        models: AssetList,          // holds all derivative models
        downloads: AssetList,       // specific models for download
        ar: AssetList,              // models specific to AR
    },
    sources: {
        models: AssetList,
        captureData: AssetList
    }
};
export type ValidationSummary = DBReference & {
};

export const useStyles = makeStyles(({ palette }) => ({
    btn: {
        height: 30,
        width: 90,
        backgroundColor: palette.primary.main,
        color: 'white',
        margin: '10px'
    },
    btnDisabled: {
        height: 30,
        width: 90,
        backgroundColor: palette.grey[500],
        color: 'white',
        margin: '10px'
    },
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
    },
    fieldSizing: {
        width: '240px',
        padding: 0,
        boxSizing: 'border-box',
        textAlign: 'center'
    },
    fieldLabel: {
        width: '7rem'
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
    expandedRow: {
        border: `1px solid ${palette.primary.dark}`,
        borderStyle: 'double',
        backgroundColor: palette.primary.main,
        color: 'white'
    },
    expandedPanel: {
        backgroundColor: 'rgba(0, 54, 97, 0.12)'
    }
}));