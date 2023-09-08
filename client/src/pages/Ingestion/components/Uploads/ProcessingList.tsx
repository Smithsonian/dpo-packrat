/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UploadCompleteList
 *
 * This component renders upload list for completed files only.
 */
import React from 'react';
import { FieldType } from '../../../../components';
import { makeStyles } from '@material-ui/core/styles';
import { scrollBarProperties } from '../../../../utils/shared';
import { Colors } from '../../../../theme';
import { Box } from '@material-ui/core';

const useStyles = makeStyles(({ palette /*, breakpoints*/ }) => ({
    container: {
        display: 'flex',
        flexBasis: '50%',
        flexDirection: 'column',
        //marginBottom: '50px'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '12vh',
        //height: '30vh',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
        width: '100%',
        ...scrollBarProperties(true, false, palette.text.disabled)
    },
    listDetail: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: '8%'
    }
}));

function ProcessingList() {
    const classes = useStyles();
    return (
        <>
            <Box className={classes.container}>
                <FieldType
                    required
                    align='left'
                    label='2. Validate Files'
                    labelTooltip='Select assets to ingest which belong to the same Subject &amp; Item'
                    labelProps={{ style: { fontSize: '1em', fontWeight: 500, margin: '1% 0px', color: Colors.defaults.dark, backgroundColor: 'none' } }}
                    //width={'calc(100% - 20px)'}
                    //padding='10px'
                >
                </FieldType>
            </Box>
        </>
    );
}

export default ProcessingList;
