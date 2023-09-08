import React from 'react';
import { FieldType } from '../../../../components';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Colors } from '../../../../theme';
import { BsFileEarmark } from 'react-icons/bs';

const useStyles = makeStyles(() => ({
    container: {
        flexDirection: 'column',
        flex: 2,
        padding: '0em 0em 0em 1.5em'
    },
    selectBox: {
        color: '#aca8a8',
        width: '100%',
        minHeight: '200px',
        maxHeight: '500px',
        border: '2px solid #d8eaf9',
        borderRadius: '3px',
        textAlign: 'center',
        fontSize: '0.875rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    icon: {
        color: '#d0e7fb',
        padding: '1em'
    },
}));

function SelectForIngestBox(): React.ReactElement {
    const classes = useStyles();
    return (
        <Box className={classes.container}>
            <FieldType
                required
                align='left'
                label='3. Select for Ingestion'
                labelTooltip='Select assets to ingest which belong to the same Subject &amp; Item'
                labelProps={{ style: { fontSize: '1.1em', fontWeight: 'bold', color: Colors.defaults.dark, backgroundColor: 'rgb(255, 255, 255)', padding: '1em 0em' } }}
                //width={'calc(100% - 20px)'}
                padding='0em'
            >
            </FieldType>
            <div className={classes.selectBox}>
                <BsFileEarmark className={classes.icon} size='50px' />
                Select Valid Files from Step 2 <br /> to Ingest.
            </div>
        </Box>
    );
}

export default SelectForIngestBox;