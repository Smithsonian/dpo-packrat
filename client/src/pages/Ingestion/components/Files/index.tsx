import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { resolveRoute, HOME_ROUTES, resolveSubRoute, INGESTION_ROUTE } from '../../../../constants';
import { SidebarBottomNavigator } from '../../../../components';

import { Colors } from '../../../../theme';
import FileUploadList from './FileUploadList';
import IngestionFilesPicker from './IngestionFilesPicker';

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column'
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: '40px 0px 0px 40px'
    },
    fileDrop: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '30vh',
        width: '40vw',
        border: `1px dashed ${palette.primary.main}`,
        borderRadius: 10,
        backgroundColor: palette.primary.light
    },
    uploadIcon: {
        color: palette.primary.main
    },
    uploadTitle: {
        margin: '2% 0px',
        fontSize: '1.2em',
        fontWeight: typography.fontWeightMedium
    },
    uploadButton: {
        width: 120,
        fontSize: typography.caption.fontSize,
        marginTop: spacing(1),
        color: Colors.defaults.white
    },
}));

function Files(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                <IngestionFilesPicker />
                <FileUploadList />
            </Box>
            <SidebarBottomNavigator
                leftLabel='Cancel'
                leftRoute={resolveRoute(HOME_ROUTES.DASHBOARD)}
                rightLabel='Next'
                rightRoute={resolveSubRoute(HOME_ROUTES.INGESTION, INGESTION_ROUTE.ROUTES.SUBJECT_ITEM)}
            />
        </Box>
    );
}

export default Files;