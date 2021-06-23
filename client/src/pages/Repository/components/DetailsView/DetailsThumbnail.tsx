/* eslint-disable react-hooks/exhaustive-deps */
/**
 * DetailsThumbnail
 *
 * This component renders details thumbnail for the Repository Details UI.
 */
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import DefaultThumbnail from '../../../../assets/images/default-thumbnail.png';
import VoyagerExplorer from './DetailsTab/VoyagerExplorer';
import { eSystemObjectType } from '../../../../types/server';
import { getObjectAssets } from '../../hooks/useDetailsView';
import { getRootSceneDownloadUrlForVoyager, getDocumentSceneDownloadUrlForVoyager } from '../../../../utils/repository';

const useStyles = makeStyles(() => ({
    thumbnail: {
        height: 200,
        width: 200,
        marginTop: 50,
        borderRadius: 10
    }
}));

interface DetailsThumbnailProps {
    thumbnail?: string | null;
    objectType?: number;
    idSystemObject?: number;
}

function DetailsThumbnail(props: DetailsThumbnailProps): React.ReactElement {
    const { REACT_APP_PACKRAT_SERVER_ENDPOINT } = process.env;
    const { thumbnail, objectType, idSystemObject } = props;
    const classes = useStyles();
    const [rootLink, setRootLink] = useState('');
    const [documentLink, setDocumentLink] = useState('');

    useEffect(() => {
        const fetchObjectAssets = async () => {
            if (idSystemObject) {
                setRootLink(getRootSceneDownloadUrlForVoyager(REACT_APP_PACKRAT_SERVER_ENDPOINT, idSystemObject));
                const {
                    data: {
                        getAssetDetailsForSystemObject: { assetDetails }
                    }
                } = await getObjectAssets(idSystemObject);
                if (assetDetails && assetDetails.length > 0) {
                    setDocumentLink(getDocumentSceneDownloadUrlForVoyager(REACT_APP_PACKRAT_SERVER_ENDPOINT, idSystemObject, assetDetails[0].name));
                }
            }
        };

        fetchObjectAssets();
    }, [idSystemObject]);

    return (
        <Box display='flex' flex={1} flexDirection='column' alignItems='center'>
            {objectType !== eSystemObjectType.eScene && <img className={classes.thumbnail} src={thumbnail || DefaultThumbnail} loading='lazy' alt='asset thumbnail' />}
            {objectType === eSystemObjectType.eScene && rootLink.length > 0 && documentLink.length > 0 && (
                <VoyagerExplorer root={rootLink} document={documentLink} height='500px' width='100%' />
            )}
        </Box>
    );
}

export default DetailsThumbnail;
