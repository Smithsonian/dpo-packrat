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
import VoyagerStory from './DetailsTab/VoyagerStory';
import { eVoyagerStoryMode, getModeForVoyager, getVoyagerModeFromParam } from '../../../../utils/repository';
import * as qs from 'query-string';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            padding: 10
        }
    },
    container: {
        display: 'flex',
        flex: 1,
        width: 'fit-content',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0,
        [breakpoints.down('lg')]: {
            paddingRight: 20
        }
    },
}));

type DetailsParams = {
    idSystemObject: string;
};

type QueryParams = {
    document: string;
    root: string;
    mode: string;
};


function VoyagerStoryView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>(); // NOTE: params gives you access to the idSystemObject as defined in the route
    const location = useLocation();
    const { document, root, mode } = qs.parse(location.search) as QueryParams; // NOTE: qs.parse gives you the object of query strings you use, such as document and root
    const idSystemObject: number = Number.parseInt(params.idSystemObject as string, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    const [objectName, setObjectName] = useState('');
    const eMode = getVoyagerModeFromParam(mode);

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

    // console.log(`VoyagerStoryView component (root: ${root} | document: ${document} | params: ${JSON.stringify(params)} | location: ${JSON.stringify(location)}})`);

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
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
                        {eMode === eVoyagerStoryMode.eViewer && (
                            <VoyagerExplorer root={root} document={document} width={'80vw'} height={'80vh'} />
                        )}
                        {eMode !== eVoyagerStoryMode.eViewer && (
                            <VoyagerStory root={root} document={document} mode={getModeForVoyager(eMode)}
                                width={'80vw'} height={'80vh'}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default VoyagerStoryView;
