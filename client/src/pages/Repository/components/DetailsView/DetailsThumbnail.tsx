/* eslint-disable react-hooks/exhaustive-deps */
/**
 * DetailsThumbnail
 *
 * This component renders details thumbnail for the Repository Details UI.
 */
import { Box, Button, Dialog, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
// import VoyagerExplorer from './DetailsTab/VoyagerExplorer';
// import VoyagerStory from './DetailsTab/VoyagerStory';
import { eSystemObjectType } from '@dpo-packrat/common';
import { getVoyagerParams } from '../../hooks/useDetailsView';
import { eVoyagerStoryMode, getRootSceneDownloadUrlForVoyager, getModeForVoyager/*, getVoyagerStoryUrl */ } from '../../../../utils/repository';
import API from '../../../../api';

import { Link } from 'react-router-dom';
import Logo from '../../../../assets/images/logo-packrat.square.png';
// import { useUserStore } from '../../../../store';

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
    },
    dialogHeader: {
        display: 'flex',
        height: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0px 1.5rem',
        background: palette.primary.main,
        color: 'white'
    },
    logo: {
        paddingRight: '1rem'
    },
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
    // const [pathLink, setPathLink] = useState('');
    // const { user } = useUserStore();
    const [rootLink, setRootLink] = useState('');
    const [documentLink, setDocumentLink] = useState('');
    const [eMode, setMode] = useState(eVoyagerStoryMode.eViewer);
    const [openVoyagerStory, setOpenVoyagerStory] = React.useState(false);
    // const [showVoyagerPreview, setShowVoyagerPreview] = React.useState(true);
    // const [showVoyagerStory, setShowVoyagerStory] = React.useState(false);

    // useEffect for on mount to include necessary Voyager scripts/CSS
    useEffect(() => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://3d-api.si.edu/resources/css/voyager-story.min.css';
        document.head.appendChild(css);

        const script = document.createElement('script');
        script.src = 'https://www.egofarms.com/temp/voyager-story.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            document.head.removeChild(css);
        };
    }, []);

    // useEffect for handling VoyagerStory exit
    useEffect(() => {
        // helper function to wait X ms
        const delay = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };

        // a helper function for rechecking for the element. we set our check inside a delay
        // because it's not available until the dialog's first redraw
        const getExitEventElement = async(): Promise<HTMLElement | null> => {

            const tagVoyagerStory: string = 'voyager-story#Voyager-Story';
            const tagButton: string = 'ff-button[icon="exit"][text="Exit"]';

            // grab our element. if it fails, wait 1s and try again
            let element: HTMLElement | null = document.querySelector(tagVoyagerStory);
            if (!element) {
                await delay(1000);
                element = document.querySelector(tagVoyagerStory);
                if(!element)
                    return null;
            }

            // grab our 'Exit' button from VoyagerStory
            const buttonElement: HTMLElement | null = element.querySelector<HTMLElement>(tagButton);
            if(!buttonElement)
                return null;

            return buttonElement;
        };

        // add/remove listeners for VoyagerStory 'exit'
        const addListener = async (): Promise<void> => {

            // get our element that will have the exit event
            const element: HTMLElement | null = await getExitEventElement();
            if(!element) {
                console.log('[PACKRAT:ERROR] cannot find exit button for VoyagerStory. Not entering edit mode.');
                setOpenVoyagerStory(false);
                return;
            }

            // HACK: currently listening for 'click' until 'exit' event is available
            console.log('[PACKRAT] adding event to Voyager Story "Exit" button');
            element.addEventListener('click',handleCloseVoyagerStory);
            return;
        };
        const removeListener = async (): Promise<void> => {
            console.log('[PACKRAT] remove event from Voyager Story "Exit" button');
            const element: HTMLElement | null = await getExitEventElement();
            if(element)
                element.removeEventListener('click',handleCloseVoyagerStory);
        };

        // if we are opening our VoyagerStory dialog we need to grab the element and listen
        // for the 'Exit' event. Otherwise, remove the event if it exists
        if(openVoyagerStory===true)
            addListener();
        else
            removeListener();

    }, [openVoyagerStory]);

    // useEffect for on mounted, or if id changes, to grab incoming parameters
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

                // setPathLink(path);
                setRootLink(root);
                setDocumentLink(document);
                setMode(eMode);
            }
        };

        fetchVoyagerParams();
    }, [idSystemObject]);

    const thumbnailContent = thumbnail ? <img className={classes.thumbnail} src={thumbnail} loading='lazy' alt='asset thumbnail' /> : null;
    // console.log(`thumbnail: ${thumbnail}, thumbnailContent: ${thumbnailContent}`);

    const handleOpenVoyagerStory = () => {
        console.log('handle open');
        // setShowVoyagerStory(true);
        setOpenVoyagerStory(true);
    };

    const handleCloseVoyagerStory = () => {
        console.log('handle close');
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
            {/* {(objectType === eSystemObjectType.eScene || objectType === eSystemObjectType.eModel) && rootLink.length > 0 && documentLink.length > 0 && eMode === eVoyagerStoryMode.eViewer && (
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
            )} */}

            {/* {
                <VoyagerExplorer
                    id='Voyager-Explorer'
                    root={rootLink}
                    document={documentLink}
                    height='500px'
                    width='100%'
                />
            } */}

            <voyager-explorer
                id='Voyager-Explorer'
                root={rootLink}
                document={encodeURIComponent(documentLink)}
                style={{ width: '100%', height: '500px', display: 'block', position: 'relative' }}
            />
            <Button
                className={classes.editButton}
                variant='contained'
                color='primary'
                onClick={handleOpenVoyagerStory}
                style={{ marginTop: '1rem', width: 'auto' }}
            >Edit</Button>
            <Dialog
                fullScreen
                open={openVoyagerStory}
                onClose={handleCloseVoyagerStory}
            >
                <Box className={classes.dialogHeader}>
                    <Box display='flex' alignItems='center'>
                        <Link className={classes.logo} to={'#'} onClick={handleCloseVoyagerStory}>
                            <img style={{ height: 30, width: 30 }} src={Logo} alt='packrat' />
                        </Link>
                        <Typography color='inherit' variant='body2'>
                            { /* TODO: add the Scene name instead of the file name */ }
                            { `Editing Scene: ${documentLink} (${props.idSystemObject})` }
                        </Typography>
                    </Box>
                </Box>
                <voyager-story
                    id='Voyager-Story'
                    root={rootLink}
                    document={encodeURIComponent(documentLink)}
                    mode={getModeForVoyager(eVoyagerStoryMode.eEdit)}
                    style={{ width: '100%', height: '100%', display: 'block', position: 'relative', color: 'white' }}
                />
            </Dialog>
        </Box>
    );
}

export default DetailsThumbnail;
