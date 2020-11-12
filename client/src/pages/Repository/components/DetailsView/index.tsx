/**
 * DetailsView
 *
 * This component renders repository details view for the Repository UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useParams } from 'react-router';
import { eSystemObjectType } from '../../../../types/server';
import DetailsHeader from './DetailsHeader';
import ObjectNotFoundView from './ObjectNotFoundView';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            padding: 10
        }
    }
}));

const mockData = {
    1: {
        name: 'PhotoSet1.zip',
        retired: true,
        objectType: eSystemObjectType.eCaptureData,
        path: [
            {
                idSystemObject: 0,
                name: 'USNM',
                objectType: eSystemObjectType.eUnit,
            }, {
                idSystemObject: 1,
                name: 'Armstrong Suit',
                objectType: eSystemObjectType.eProject,
            }, {
                idSystemObject: 0,
                name: 'Armstrong Glove',
                objectType: eSystemObjectType.eSubject,
            }, {
                idSystemObject: 0,
                name: 'Armstrong Glove Full',
                objectType: eSystemObjectType.eItem,
            }, {
                idSystemObject: 0,
                name: 'PhotoSet1.zip',
                objectType: eSystemObjectType.eCaptureData,
            }
        ]
    }
};

type DetailsParams = {
    idSystemObject: string;
};

function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const data = mockData[params.idSystemObject];

    if (!data) {
        return <ObjectNotFoundView loading={false} />;
    }

    const { name, objectType, path, retired } = data;

    return (
        <Box className={classes.container}>
            <DetailsHeader
                name={name}
                objectType={objectType}
                path={path}
                retired={retired}
                editable
            />
        </Box>
    );
}

export default DetailsView;