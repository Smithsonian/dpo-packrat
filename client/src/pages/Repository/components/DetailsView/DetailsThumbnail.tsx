/* eslint-disable react-hooks/exhaustive-deps */
/**
 * DetailsThumbnail
 *
 * This component renders details thumbnail for the Repository Details UI.
 */
import { Box, Button, Dialog } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import VoyagerExplorer from './DetailsTab/VoyagerExplorer';
import VoyagerStory from './DetailsTab/VoyagerStory';
import { eSystemObjectType } from '@dpo-packrat/common';
import { getVoyagerParams } from '../../hooks/useDetailsView';
import { eVoyagerStoryMode, getRootSceneDownloadUrlForVoyager, getModeForVoyager, getVoyagerStoryUrl } from '../../../../utils/repository';
// import CloseIcon from '@material-ui/icons/Close';
import API from '../../../../api';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    thumbnail: {
        height: 200,
        width: 200,
        marginTop: 50,
        borderRadius: 10
    },
    editButton: {
        textAlign: 'left',
        height: 35,
        width: 100,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        },
        outline: '0.5px hidden rgba(141, 171, 196, 0.4)'
    },
    wrapVoyagerStory: {
        color: palette.background.paper
    }
}));

interface DetailsThumbnailProps {
    thumbnail?: string | null;
    objectType?: number;
    idSystemObject?: number;
}

function DetailsThumbnail(props: DetailsThumbnailProps): React.ReactElement {
    const serverEndpoint = API.serverEndpoint();
    const { thumbnail, objectType, idSystemObject } = props;
    const classes = useStyles();
    const [pathLink, setPathLink] = useState('');
    const [rootLink, setRootLink] = useState('');
    const [documentLink, setDocumentLink] = useState('');
    const [eMode, setMode] = useState(eVoyagerStoryMode.eViewer);
    const [openVoyagerStory, setOpenVoyagerStory] = React.useState(false);
    // const [showVoyagerPreview, setShowVoyagerPreview] = React.useState(true);
    // const [showVoyagerStory, setShowVoyagerStory] = React.useState(false);

    useEffect(() => {
        const fetchVoyagerParams = async () => {
            if (!idSystemObject)
                return;
            if (objectType !== eSystemObjectType.eScene && objectType !== eSystemObjectType.eModel)
                return;

            const { data: { getVoyagerParams: { path, document, idSystemObjectScene } } } = await getVoyagerParams(idSystemObject);
            // console.log(`getVoyagerParams (path: ${path}, document: ${document}, idSystemObjectScene ${idSystemObjectScene})`);

            if (document) {
                const root: string = getRootSceneDownloadUrlForVoyager(serverEndpoint, idSystemObjectScene, path, eMode);
                // console.log(`Voyager root: ${root}, document: ${document}, mode: ${eVoyagerStoryMode[eMode]}`);

                setPathLink(path);
                setRootLink(root);
                setDocumentLink(document);
                setMode(eMode);
            }
        };

        fetchVoyagerParams();
    }, [idSystemObject]);

    const thumbnailContent = thumbnail ? <img className={classes.thumbnail} src={thumbnail} loading='lazy' alt='asset thumbnail' /> : null;
    // console.log(`thumbnail: ${thumbnail}, thumbnailContent: ${thumbnailContent}`);

    const handleVoyagerEditOpen = () => {
        // setShowVoyagerPreview(false);
        setOpenVoyagerStory(true);
    };

    const handleVoyagerEditClose = () => {
        setOpenVoyagerStory(false);
    };

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='column'
            alignItems='start'
            maxWidth='52vw'
        >
            {objectType !== eSystemObjectType.eScene && thumbnailContent}
            {(objectType === eSystemObjectType.eScene || objectType === eSystemObjectType.eModel) && rootLink.length > 0 && documentLink.length > 0 && eMode === eVoyagerStoryMode.eViewer && (
                <React.Fragment>
                    <VoyagerExplorer
                        id='Voyager-Explorer'
                        root={rootLink}
                        document={documentLink}
                        height='500px'
                        width='100%'
                    />
                    {objectType === eSystemObjectType.eScene && (
                        <React.Fragment>
                            <br />
                            <Button
                                className={classes.editButton}
                                variant='contained'
                                color='primary'
                                disableElevation
                                href={getVoyagerStoryUrl(serverEndpoint, idSystemObject ?? 0, encodeURIComponent(documentLink), pathLink, eVoyagerStoryMode.eEdit)}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Edit
                            </Button>
                        </React.Fragment>
                    )}
                </React.Fragment>
            )}
            {(objectType === eSystemObjectType.eScene || objectType === eSystemObjectType.eModel) && rootLink.length > 0 && documentLink.length > 0 && eMode !== eVoyagerStoryMode.eViewer && (
                <VoyagerStory id='Voyager-Story' root={rootLink} document={documentLink} mode={getModeForVoyager(eMode)}
                    height='500px' width='100%'
                />
            )}
            <Button
                className={classes.editButton}
                variant='contained'
                color='primary'
                onClick={handleVoyagerEditOpen}
                style={{ marginTop: '2rem', width: 'auto' }}
            >Dialog Test</Button>
            <Dialog
                fullScreen
                open={openVoyagerStory}
                onClose={handleVoyagerEditClose}
            >
                <Button
                    className={classes.editButton}
                    variant='contained'
                    color='primary'
                    onClick={handleVoyagerEditClose}
                >Close</Button>
                <VoyagerStory id='Voyager-Story2'
                    root={rootLink}
                    document={documentLink}
                    mode={getModeForVoyager(eVoyagerStoryMode.eQC)}
                    height='100%'
                    width='100%'
                />
            </Dialog>
        </Box>
    );
}

export default DetailsThumbnail;
