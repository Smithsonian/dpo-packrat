/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */

/**
* MetadataDisplayTable
*
* This component renders the display table for metadata in repository details.
* This is the top table
*/

import React from 'react';
import { Typography, Tooltip, TextField } from '@material-ui/core';
import clsx from 'clsx';
import { DataGrid, GridColumns } from '@material-ui/data-grid';
import { useObjectMetadataStore, useVocabularyStore } from '../../../../../store';
import { eVocabularySetID } from '@dpo-packrat/common';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { makeStyles } from '@material-ui/core/styles';
import { truncateWithEllipses } from '../../../../../constants';
import { ToolTip } from '../../../../../components';
import { getDownloadValueForMetadata, getDownloadAssetVersionUrlForObject } from '../../../../../utils/repository';
import API from '../../../../../api';

const useStyles = makeStyles(({ palette, typography }) => ({
    btn: {
        width: 'fit-content'
    },
    container: {
        backgroundColor: palette.secondary.light,
        marginTop: '2px',
        minHeight: '10vh'
    },
    headerRow: {
        borderBottom: '1.5px solid black'
    },
    textField: {
        width: '100%'
    },
    text: {
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '1em'
    }
}));

function MetadataDisplayTable(): React.ReactElement {
    const serverEndpoint = API.serverEndpoint();
    const classes = useStyles();
    const [getEntries] = useVocabularyStore(state => [state.getEntries]);
    const sources = getEntries(eVocabularySetID.eMetadataMetadataSource);
    const sourcesMap = new Map();
    sources.forEach(source => {
        if (!sourcesMap.has(source.idVocabulary)) {
            sourcesMap.set(source.idVocabulary, source.Term);
        }
    });
    const [metadataDisplay, updateMetadata, deleteMetadata] = useObjectMetadataStore(state => [state.metadataDisplay, state.updateMetadata, state.deleteMetadata]);

    const columnHeader: GridColumns = [
        {
            field: 'Name',
            headerName: 'Name',
            flex: 1.5,
            renderCell: params => (
                <Typography className={clsx(classes.textField, classes.text)}>{params.row.Name}</Typography>
            )
        },
        {
            field: 'Value',
            headerName: 'Value',
            flex: 6,
            sortable: false,
            renderCell: ({ row: { ValueExtended, Value, idAssetVersionValue, idMetadata } }) => {
                let content: React.ReactElement;
                if (ValueExtended) {
                    content = (
                        <Tooltip arrow title={ <ToolTip text={truncateWithEllipses(Value, 1000)} /> }>
                            <a href={getDownloadValueForMetadata(serverEndpoint, idMetadata)} rel='noopener noreferrer' target='_blank'>
                                <Typography className={clsx(classes.textField, classes.text)}>{truncateWithEllipses(Value, 90)}</Typography>
                            </a>
                        </Tooltip>
                    );
                } else if (idAssetVersionValue) {
                    content = (
                        <a href={getDownloadAssetVersionUrlForObject(serverEndpoint, idAssetVersionValue)} rel='noopener noreferrer' target='_blank'>
                            <Typography className={clsx(classes.textField, classes.text)}>{`Asset Version ${idAssetVersionValue}`}</Typography>
                        </a>
                    );
                } else {
                    content = (
                        <TextField onChange={(e) => updateMetadata(idMetadata, 0, 'Value', e.target.value)} value={Value} InputProps={{ className: classes.text }} style={{ width: '100%' }} />
                    );
                }

                return content;
            }
        },
        {
            field: 'Source',
            headerName: 'Source',
            flex: 1.5,
            sortable: false,
            renderCell: params => params.row.VMetadataSource && params.row.VMetadataSource.idVocabulary && (
                <Typography className={clsx(classes.textField, classes.text)}>{sourcesMap.get(params.row.VMetadataSource.idVocabulary)}</Typography>
            )
        },
        {
            field: ' ',
            headerName: '',
            flex: 0.5,
            sortable: false,
            renderCell: params => (
                <MdRemoveCircleOutline onClick={() => deleteMetadata(params.row.idMetadata, 0)} style={{ cursor: 'pointer' }} />
            )
        }
    ];

    return (
        <DataGrid
            rows={metadataDisplay}
            columns={columnHeader}
            rowHeight={40}
            scrollbarSize={5}
            density='compact'
            disableSelectionOnClick
            hideFooter
            className={classes.container}
            autoHeight
        />
    );
}

export default MetadataDisplayTable;
