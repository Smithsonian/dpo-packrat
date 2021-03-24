/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

/**
This component is responsible for creating new SystemObjects and will handle the appropriate SystemObject type. Currently handles:
    Units
    Projects
 */

import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useParams } from 'react-router';
import AddProjectForm from './AddProjectForm';
import AddUnitForm from './AddUnitForm';

const useStyles = makeStyles(({ breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 60px)',
        width: '1200px',
        overflowY: 'scroll',
        marginLeft: '1%',
        marginTop: '1%',
        [breakpoints.down('lg')]: {
            maxHeight: 'calc(100vh - 120px)',
            padding: 10
        }
    }
}));

type ParamsProperties = {
    systemObjectType: string;
};

function AddSystemObjectForm(): React.ReactElement {
    const classes = useStyles();
    const params: ParamsProperties = useParams();
    const systemObjectType = params.systemObjectType;

    // renders the appropriate form based on the system object type
    let form;
    switch (systemObjectType) {
        case 'units':
            form = <AddUnitForm />;
            break;
        case 'projects':
            form = <AddProjectForm />;
            break;
    }

    return <Box className={classes.container}>{form}</Box>;
}

export default AddSystemObjectForm;
