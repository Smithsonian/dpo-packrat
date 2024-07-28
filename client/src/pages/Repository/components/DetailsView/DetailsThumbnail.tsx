/* eslint-disable react-hooks/exhaustive-deps */
/**
 * DetailsThumbnail
 *
 * This component renders details thumbnail for the Repository Details UI.
 * We need to take care in how Voyager is included and called to avoid dependency errors
 * withing Voyager itself.
 */
import { Box, Button, Dialog, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { eSystemObjectType } from '@dpo-packrat/common';
import { getVoyagerParams } from '../../hooks/useDetailsView';
import { eVoyagerStoryMode, getRootSceneDownloadUrlForVoyager, getModeForVoyager } from '../../../../utils/repository';
import API from '../../../../api';
import { Link } from 'react-router-dom';
import Logo from '../../../../assets/images/logo-packrat.square.png';
import Config from '../../../../config';

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
    const [rootExplorerLink, setRootExplorerLink] = useState('');
    const [rootStoryLink, setRootStoryLink] = useState('');
    const [documentLink, setDocumentLink] = useState('');
    const [openVoyagerStory, setOpenVoyagerStory] = React.useState(false);
    const [showVoyagerExplorer, setShowVoyagerExplorer] = React.useState(true);

    // helper function to wait X ms
    const delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // useEffect for on mount to include necessary Voyager scripts/CSS
    useEffect(() => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = Config.voyager.storyCSS;
        document.head.appendChild(css);

        const script = document.createElement('script');
        script.src = 'https://www.egofarms.com/temp/voyager-story.min.js'; //Config.voyager.storyJS;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            document.head.removeChild(css);
        };
    }, []);

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
                const rootExplorer: string = getRootSceneDownloadUrlForVoyager(serverEndpoint, idSystemObjectScene, path, eVoyagerStoryMode.eViewer);
                const rootStory: string = getRootSceneDownloadUrlForVoyager(serverEndpoint, idSystemObjectScene, path, eVoyagerStoryMode.eEdit);
                // console.log(`Voyager root: ${root}, document: ${document}, mode: ${eVoyagerStoryMode[eMode]}`);

                setRootExplorerLink(rootExplorer);
                setRootStoryLink(rootStory);
                setDocumentLink(document);
            }
        };

        fetchVoyagerParams();
    }, [idSystemObject]);

    // useEffect for assigning CSS adjustments to Voyager dynamic elements
    useEffect(() => {
        // add custom inline properties to ff-message-box elements
        const addCustomClassToMessageBox = () => {
            const messageBoxes = document.querySelectorAll('ff-message-box');
            messageBoxes.forEach((box) => {
                // manually set the zIndex to a higher value so it shows above the rest of the UI
                (box as HTMLElement).style.setProperty('z-index', '1300', 'important');
            });
        };

        // Use MutationObserver to detect dynamically created elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement && node.tagName.toLowerCase() === 'ff-message-box') {
                        // manually set the zIndex to a higher value so it shows above the rest of the UI
                        node.style.setProperty('z-index', '1300', 'important');
                    }
                });
            });
        });

        // Start observing the body for child list changes
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Apply custom class to any existing ff-message-box elements on component mount
        addCustomClassToMessageBox();

        // Clean up observer on component unmount
        return () => {
            observer.disconnect();
        };
    }, []);

    const thumbnailContent = thumbnail ? <img className={classes.thumbnail} src={thumbnail} loading='lazy' alt='asset thumbnail' /> : null;
    // console.log(`thumbnail: ${thumbnail}, thumbnailContent: ${thumbnailContent}`);

    const getExitEventElement = async(): Promise<HTMLElement | null> => {
        // a helper function for rechecking for the element. we set our check inside a delay
        // because it's not available until the dialog's first redraw
        const tagVoyagerStory: string = 'voyager-story#Voyager-Story';
        const tagButton: string = 'ff-button[icon="exit"][text="Exit"]';

        // grab our element. if it fails, wait 1s and try again
        let element: HTMLElement | null = document.querySelector(tagVoyagerStory);
        if (!element) {
            await delay(500);
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
    const addVoyagerExitListener = async (): Promise<boolean> => {
        // get our element that will have the exit event
        const element: HTMLElement | null = await getExitEventElement();
        if(!element) {
            console.log('[PACKRAT:ERROR] cannot find exit button for VoyagerStory. Not entering edit mode.');
            setOpenVoyagerStory(false);
            return false;
        }

        // HACK: currently listening for 'click' until 'exit' event is available
        console.log('[PACKRAT] adding event to Voyager Story "Exit" button');
        element.addEventListener('click',handleCloseVoyagerStory);
        return true;
    };
    const removeVoyagerExitListener = async (): Promise<void> => {
        console.log('[PACKRAT] remove event from Voyager Story "Exit" button');
        const element: HTMLElement | null = await getExitEventElement();
        if(element)
            element.removeEventListener('click',handleCloseVoyagerStory);
    };
    const addVoyagerStoryElement = (): boolean => {
        // explicitly create and add voyager story to the DOM. we do this here because React uses
        // createElement + setAttribute for converting JSX to an HTML element. In this case the
        // attributes won't be available when the voyager constructor runs, yielding default values/properties.
        // so we need to inject raw HTML into the DOM to ensure everything loads when expected.
        const voyagerStoryMarkup = `<voyager-story
            id="Voyager-Story"
            root="${rootStoryLink}"
            document="${documentLink}"
            mode="${getModeForVoyager(eVoyagerStoryMode.eEdit)}"
            style="width: 100%; height: 100%; display: block; position: relative; color: white"
        />`;

        // get our dialog component/container
        const voyagerContainer: HTMLElement | null = document.querySelector('div#Voyager-Story-Container');
        if(!voyagerContainer) {
            console.log('[PACKRAT: ERROR] voyager story container not found');
            return false;
        }
        voyagerContainer.innerHTML = voyagerStoryMarkup;
        return true;
    };
    const removeVoyagerStoryElement = () => {

        // get our dialog component/container
        const voyagerContainer: HTMLElement | null = document.querySelector('div#Voyager-Story-Container');
        if(!voyagerContainer) {
            console.log('[PACKRAT: ERROR] voyager story container not found');
            return false;
        }

        // explicitly remove the voyager component from the DOM
        voyagerContainer.innerHTML = '';
        return true;
    };

    const handleOpenVoyagerStory = async () => {
        console.log(`[PACKRAT] Opening Voyager Story (${documentLink} | root: ${rootStoryLink})`);

        // set our flag so the dialog opens and is added to the DOM by React
        setOpenVoyagerStory(true);

        // we wait for dialog to be added to the DOM
        await delay(100);

        // add/inject Voyager Story into the container
        if(!addVoyagerStoryElement()) {
            console.log('[PACKRAT: ERROR] Failed to add Voyager Story. Closing editor...');
            setOpenVoyagerStory(false);
            return;
        }

        // wait for voyager to be added to DOM
        await delay(500);

        // attach an event listener for Voyager 'Exit'
        await addVoyagerExitListener();
        setShowVoyagerExplorer(false);
    };
    const handleCloseVoyagerStory = async () => {
        console.log('[PACKRAT] Closing Voyager Story...');

        // remove the event listener
        await removeVoyagerExitListener();

        // remove the voyager element
        if(!removeVoyagerStoryElement())
            console.log('[PACKRAT: ERROR] Failed to remove Voyager Story');

        setShowVoyagerExplorer(true);
        setOpenVoyagerStory(false);
    };

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='column'
            alignItems='start'
        >
            {objectType !== eSystemObjectType.eScene && thumbnailContent}
            {(objectType === eSystemObjectType.eScene || objectType === eSystemObjectType.eModel) && rootExplorerLink.length > 0 && documentLink.length > 0 && (
                <React.Fragment>
                    { showVoyagerExplorer && (
                        <voyager-explorer
                            id='Voyager-Explorer'
                            root={rootExplorerLink}
                            document={encodeURIComponent(documentLink)}
                            style={{ width: '100%', height: '500px', display: 'block', position: 'relative' }}
                        />
                    )}
                    <Button
                        className={classes.editButton}
                        variant='contained'
                        color='primary'
                        onClick={handleOpenVoyagerStory}
                        style={{ marginTop: '1rem', width: 'auto' }}
                    >Edit Scene</Button>
                    <Dialog
                        fullScreen
                        disableEnforceFocus // needed so edit fields in Voyager Story maintain focus when clicked
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
                        <div id='Voyager-Story-Container' style={{ width: '100%', height: '100%' }}></div>
                    </Dialog>
                </React.Fragment>
            )}
        </Box>
    );
}

export default DetailsThumbnail;
