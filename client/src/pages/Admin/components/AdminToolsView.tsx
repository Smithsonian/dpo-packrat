/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
// import API, { RequestResponse } from '../../../api';

import React, { useState, useEffect } from 'react';
import { Box,Collapse, IconButton } from '@material-ui/core';
import { useLocation } from 'react-router';
import { useUserStore } from '../../../store';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import ToolsBatchGeneration from './Tools/ToolsBatchGeneration';

// styles
import { makeStyles } from '@material-ui/core/styles';

// icons
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

const useStyles = makeStyles(({ palette }) => ({
    AdminPageViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingBottom: '15px',
        paddingLeft: '15px',
        paddingRight: '15px',
        margin: '0 auto'
    },
    AdminBreadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        marginBottom: '15px',
        width: 'fit-content'
    },
    collapseContainer: {
        border: `1px dotted ${palette.primary.main}`,
        borderTop: 0,
        boxSizing: 'border-box',
        borderRadius: 5,
        padding: '10px',
        marginBottom: '10px',
        overflow: 'hidden', // Ensures collapsed sections do not reserve space
    },
    collapseHeader: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '1.2rem',
        padding: '10px',
        backgroundColor: palette.primary.light,
        color: palette.primary.main,
        borderRadius: 5,
        border: `1px solid ${palette.primary.main}`,
        justifyContent: 'space-between',
        width: '100%',
    },
}));

function AdminToolsView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const { user } = useUserStore();
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
        batchOps: false,
        assetValidation: false,
    });

    const toggleSection = (section: string) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        async function isUserAuthorized() {
            const authorizedUsers: number[] = [
                2,  // Jon Blundell
                4,  // Jamie Cope
                5,  // Eric Maslowski
                6,  // Megan Dattoria
                11, // Katie Wolfe
            ];

            // if our current user ID is not in the list then return false
            if(!user) {
                console.log('[Packrat:ERROR] Admin tools cannot get authenticated user');
                setIsAuthorized(false);
            }
            setIsAuthorized(authorizedUsers.includes(user?.idUser ?? -1));
        }

        isUserAuthorized();
    }, [user]);

    return (
        <React.Fragment>
            <Helmet>
                <title>Admin: Tools</title>
            </Helmet>
            <Box className={classes.AdminPageViewContainer}>
                <Box className={classes.AdminBreadCrumbsContainer}>
                    <GenericBreadcrumbsView items={location.pathname.slice(1)} />
                </Box>
                {
                    isAuthorized ? (
                        <>
                            {/* Batch Generation Section */}
                            <Box>
                                <IconButton className={classes.collapseHeader} onClick={() => toggleSection('batchOps')}>
                                    Batch Generation
                                    {openSections.batchOps ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                                <Collapse in={openSections.batchOps} className={classes.collapseContainer}>
                                    <ToolsBatchGeneration />
                                </Collapse>
                            </Box>

                            {/* Asset Validation Section */}
                            <Box>
                                <IconButton className={classes.collapseHeader} onClick={() => toggleSection('assetValidation')}>
                                    Asset Validation
                                    {openSections.assetValidation ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                                <Collapse in={openSections.assetValidation} className={classes.collapseContainer}>
                                    <p>Asset Validation</p>
                                </Collapse>
                            </Box>
                        </>
                    ):(
                        <p>You are <b>Not Authorized</b> to use these tools. Contact support.</p>
                    )
                }
            </Box>
        </React.Fragment>
    );
}

export default AdminToolsView;
