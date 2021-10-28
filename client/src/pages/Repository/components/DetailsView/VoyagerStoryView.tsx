/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */

/**
 * VoyagerStoryDetails
 *
 * This component is a special Details View for depicting models using Voyager Story UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router';
import { useObjectDetails  } from '../../hooks/useDetailsView';
import DetailsHeader from './DetailsHeader';
import ObjectNotFoundView from './ObjectNotFoundView';
import VoyagerExplorer from './DetailsTab/VoyagerExplorer';
import * as qs from 'query-string';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        // maxHeight: 'calc(100vh - 140px)',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            // maxHeight: 'calc(100vh - 120px)',
            padding: 10
        }
    },
    updateButton: {
        height: 35,
        width: 100,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        }
    }
}));

type DetailsParams = {
    idSystemObject: string;
};

type QueryParams = {
    document: string;
    root: string;
};


function VoyagerStoryView(): React.ReactElement {
    const classes = useStyles();
    // NOTE: params gives you access to the idSystemObject as defined in the route
    const params = useParams<DetailsParams>();
    const location = useLocation();
    // NOTE: qs.parse gives you the object of query strings you use, such as document and root
    const { document, root } = qs.parse(location.search) as QueryParams;
    const idSystemObject: number = Number.parseInt(params.idSystemObject, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    const [objectName, setObjectName] = useState('');

    useEffect(() => {
        if (data && !loading) {
            const { name } = data.getSystemObjectDetails;
            setObjectName(name);
        }
    }, [data, loading]);

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const {
        objectType,
        objectAncestors
    } = data.getSystemObjectDetails;

    return (
        <Box className={classes.container}>
            <DetailsHeader
                originalFields={data.getSystemObjectDetails}
                name={objectName}
                disabled
                objectType={objectType}
                path={objectAncestors}
                onNameUpdate={() => {}}
            />

            <Box display='flex'>
                <Box display='flex' flex={1} padding={2}>
                    <VoyagerExplorer root={root} document={document} width={'80vw'} height={'80vh'} />
                </Box>
            </Box>

        </Box>
    );
}

export default VoyagerStoryView;
