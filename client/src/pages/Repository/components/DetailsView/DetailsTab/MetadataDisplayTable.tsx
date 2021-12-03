/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */

/**
* MetadataDisplayTable
*
* This component renders the display table for metadata in repository details.
* This is the top table
*/

import React, { useEffect } from 'react';
import { Typography } from '@material-ui/core';
import { DataGrid, GridColumns } from '@material-ui/data-grid';
import { useObjectMetadataStore, useVocabularyStore, eObjectMetadataType } from '../../../../../store';
import { eVocabularySetID } from '../../../../../types/server';
import { MetadataInput } from '../../../../../types/graphql';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(({ palette }) => ({
    btn: {
        width: 'fit-content'
    },
    container: {
        backgroundColor: palette.secondary.light,
        marginTop: '2px'
    },
    headerRow: {
        borderBottom: '1.5px solid black'
    }
}));

type MetadataDisplayTableProps = {
    type: eObjectMetadataType;
    metadata?: MetadataInput[]
};

/*
Create a "Metadata" control which can be used on a new "Metadata" tab on Detail/Edit pages, as well as in the Admin > Subject > New Subject UI.  This control will display a sortable table of Metadata where Metadata.idSystemObject matches the idSystemObject of the edited item (or is empty, for new subjects), with the following columns:

"Name": Metadata.Name
"Value": one of the following, based on whichever is non-null:
Metadata.ValueShort:  display the value in a textarea edit field, allowing the user to edit the content.
Metadata.ValueExtended:  display the first 30 characters, followed by "...". Render this as a hyperlink to a download page for the metadata, via RouteBuilder.DownloadMetadata(Metadata.idMetadata, eHrefMode.ePrependServerURL)
Metadata.idAssetVersionValue: render "Asset Version ${Metadata.idAssetVersionValue}" as a download link for the asset version.  Use RouteBuilder.DownloadAssetVersion(Metadata.idAssetVersionValue, eHrefMode.ePrependServerURL), similar to what we do in the AssetGrid.
"Source": translation of idVMetadataSource to Vocabulary
A minus button; when clicked, the metadata row is removed; prompt the user to confirm this change with the message "Are you sure you want to remove this metadata?".  If the user says "Yes", persist this change and refresh the grid.
Note that metadata with "ValueShort" content can be edited and need to be persisted at the appropriate time – most likely when the user clicks the "Update" button on the detail/edit form.  Provide text next to the button indicating that an "Update" is needed to save these edits, similar to what happens when an identifier is edited.
*/

function MetadataDisplayTable(props: MetadataDisplayTableProps): React.ReactElement {
    const { type } = props;
    const classes = useStyles();
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);
    const sources = getEntries(eVocabularySetID.eMetadataMetadataSource);
    console.log('sources', sources);
    const [metadata /*, updateMetadata, deleteMetadata*/, initializeMetadata] = useObjectMetadataStore(state => [state.metadataDisplay /*, state.updateMetadata, state.deleteMetadata*/, state.initializeMetadata]);


    const columnHeader: GridColumns = [
        {
            field: 'Name',
            headerName: 'Name',
            flex: 2,
            renderCell: params => (
                <Typography>{params.row.Name}</Typography>
            )
        },
        {
            field: 'Value',
            headerName: 'Value',
            flex: 5,
            renderCell: params => (
                <Typography>{params.row.ValueShort}</Typography>
            )
        },
        {
            field: 'Source',
            headerName: 'Source',
            flex: 3,
            renderCell: params => (
                <Typography>{params.row.idvMetadataSource}</Typography>
            )
        },
        {
            field: '',
            headerName: '',
            flex: 1,
            renderCell: params => (
                <MdRemoveCircleOutline onClick={() => console.log(params.row.idMetadata)} />
            )
        }
    ];
    useEffect(() => {
    // TODO include the metadata rows to be initialized
        initializeMetadata(type);
    }, []);

    return (
        <React.Fragment>
            <DataGrid
                rows={metadata}
                columns={columnHeader}
                rowHeight={30}
                scrollbarSize={5}
                density='compact'
                disableSelectionOnClick
                hideFooter
                className={classes.container}
            />
        </React.Fragment>
    );
}

export default MetadataDisplayTable;
