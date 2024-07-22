/* eslint-disable react/display-name */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Select, MenuItem, Table, TableContainer, TableCell, TableRow, TableBody, Paper, Collapse, IconButton } from '@material-ui/core';
import { DebounceInput } from 'react-debounce-input';
import { useLocation } from 'react-router';
import { useUserStore } from '../../../store';
// import { User } from '../../../types/graphql';
// import { apolloClient } from '../../../graphql/index';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';
import { Helmet } from 'react-helmet';
import clsx from 'clsx';

// styles
import { makeStyles } from '@material-ui/core/styles';
import { useStyles as useTableStyles } from '../../Repository/components/DetailsView/DetailsTab/CaptureDataDetails';

// icons
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

const useStyles = makeStyles(({ palette }) => ({
    btn: {
        height: 30,
        width: 90,
        backgroundColor: palette.primary.main,
        color: 'white',
        margin: '10px'
    },
    btnDisabled: {
        height: 30,
        width: 90,
        backgroundColor: palette.grey[500],
        color: 'white',
        margin: '10px'
    },
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0
    },
    fieldContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        overflow: 'hidden',
        margin: '0.5rem',
        padding: 0
    },
    fieldSizing: {
        width: '240px',
        padding: 0,
        boxSizing: 'border-box',
        textAlign: 'center'
    },
    fileChip: {
        marginRight: 10
    },
    fieldLabel: {
        width: '7rem'
    },
    ingestContainer: {
        borderRadius: '0.5rem',
        border: `1px dashed ${palette.primary.main}`,
        // overflow: 'hidden',
        backgroundColor: palette.primary.light,
        padding: 0,
        marginBottom: '1rem',
    },
    AdminPageViewContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'auto',
        paddingBottom: '15px',
        paddingLeft: '15px',
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
    styledButton: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '75px',
        height: '25px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        },
        fontSize: '0.8rem'
    },
    filterContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        width: 'max-content',
        backgroundColor: 'rgb(255, 255, 224)',
        padding: '10px 10px',
        fontSize: '0.8rem',
        outline: '1px solid rgba(141, 171, 196, 0.4)',
        borderRadius: 5
    },
    searchContainerLeft: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        width: '80%',
        columnGap: 10,
    },
    searchContainerRight: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100%',
        width: '20%'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    searchFilter: {
        width: '250px'
    },
    collapseHeader: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: 5,
        backgroundColor: palette.primary.light,
        width: '100%',
        columnGap: 10,
        rowGap: 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
        border: `1px solid ${palette.primary.main}`,
        color: palette.primary.main
    },
    collapseContainer: {
        border: `1px dotted ${palette.primary.main}`,
        borderTop: 0,
        boxSizing: 'border-box',
        borderRadius: 5,
        paddingBottom: '20px'
    }
}));

function AdminToolsBatchOperation(): React.ReactElement {
    const classes = useStyles();
    const tableClasses = useTableStyles();

    const [operation, setOperation] = useState<number>(0);
    const [selectedInput, setSelectedInput] = useState<string>('');
    const [selectedList, setSelectedList] = useState<number[]>([]);
    const [isListValid, setIsListValid] = useState<boolean>(false);
    const [showBatchOps, setShowBacthOps] = useState<boolean>(false);
    const [showBatchOpsSelector, setShowBatchOpsSelector] = useState<boolean>(false);

    enum BatchOperations {
        DOWNLOADS = 0,
        VOYAGER_SCENE = 1,
    }

    const handleOperationChange = (event) => {
        setOperation(event.target.value);
    };
    const verifySelection = (): boolean => {

        // if we're empty cleanup
        if(selectedInput.length <= 0) {
            setSelectedList([]);
            setIsListValid(false);
            return false;
        }

        // we accept comma separated values only. (todo: support one each line)
        const pieces: string[] = selectedInput.split(',').map(val => val.trim());
        const isValid = pieces.every(val => !isNaN(Number(val)) && val !== '');

        // if we're valid then we assign the array to a separate variable for easier processing
        if(isValid) {
            const values: number[] = pieces.map(Number);
            setSelectedList(values);
            setIsListValid(true);
        } else {
            console.log('[PACKRAT:ERROR] invalid list of IDs. please separate valid ids by commas:',pieces);
            setIsListValid(false);
        }

        console.log('verify selection - selected list: ',selectedList);
        return isValid;
    };
    const onProcessOperation = async () => {

        // make sure our selection is valid
        if(!verifySelection()) {
            console.log('[PACKRAT:ERROR] cannot process batch generation operation. invalid indices.');
            return;
        }

        console.log(`[PACKRAT] Starting ${BatchOperations[operation]} batch operation for: ${selectedList.join(', ')}`);

        // build request to server

        // send request and wait

        // get report and store details
        //      change button to 'cancel'
        //      fire iteration polling status of job
    };

    return (
        <Box className={classes.container} style={{ margin: '10px' }}>
            <IconButton
                className={classes.collapseHeader}
                style={{ marginTop: '1rem', fontSize: '1.2rem' }}
                onClick={() => setShowBacthOps(showBatchOps === true ? false:true )}
            >
                Batch Generation
                {showBatchOps === true ? (<KeyboardArrowUpIcon />):( <KeyboardArrowDownIcon /> )}
            </IconButton>
            <Collapse in={showBatchOps} className={classes.container}>
                <Box className={classes.collapseContainer} style={{ paddingTop: '10px', width: '100%' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table className={tableClasses.table}>
                            <TableBody>
                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Operation Type</Typography>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <Select
                                            labelId='batch-generation-op'
                                            id='batch-generation-op'
                                            value={operation}
                                            label='Operation'
                                            onChange={handleOperationChange}
                                            disableUnderline
                                            className={clsx(tableClasses.select, classes.fieldSizing)}
                                            SelectDisplayProps={{ style: { paddingLeft: '10px', borderRadius: '5px' } }}
                                        >
                                            <MenuItem value={0}>Downloads</MenuItem>
                                            <MenuItem value={1} disabled>Voyager Scenes</MenuItem>
                                        </Select>
                                    </TableCell>
                                </TableRow>

                                <TableRow className={tableClasses.tableRow}>
                                    <TableCell className={clsx(tableClasses.tableCell, classes.fieldLabel)}>
                                        <Typography className={tableClasses.labelText}>Selected Items</Typography>
                                    </TableCell>
                                    <TableCell className={tableClasses.tableCell}>
                                        <DebounceInput
                                            value={selectedInput}
                                            element='textarea'
                                            name='selectedItems'
                                            onChange={(e) => setSelectedInput(e.target.value as string)}
                                            onBlur={verifySelection}
                                            placeholder='Selected items...'
                                            className={clsx(tableClasses.input, classes.fieldSizing)}
                                            forceNotifyByEnter={false}
                                            debounceTimeout={400}
                                            style={{ width: '100%', minHeight: '4rem', textAlign: 'left', padding: '5px' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    { isListValid ? ( // if we have valid indices show the button to submit
                        <Box style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                                className={classes.btn}
                                onClick={onProcessOperation}
                                disableElevation

                            >
                                Go
                            </Button>
                        </Box>
                    ):(
                        <Typography style={{ textAlign: 'center' }}>List of IDs is invalid. Please check.</Typography>
                    )}

                    <IconButton
                        className={classes.collapseHeader}
                        style={{ width: '95%', fontSize: '0.75rem', padding: 0, margin: 'auto', marginTop: '1rem' }}
                        onClick={() => setShowBatchOpsSelector(showBatchOpsSelector === true ? false:true )}
                    >
                        Select from Repository
                        {showBatchOpsSelector === true ? (<KeyboardArrowUpIcon />):( <KeyboardArrowDownIcon /> )}
                    </IconButton>
                    <Collapse in={showBatchOpsSelector} className={classes.container}>
                        <Box className={classes.collapseContainer} style={{ padding: '10px', width: '95%', margin: 'auto' }}>
                            <Typography>TODO: data table selecting scenes elements based on project</Typography>
                            <Typography>more data</Typography>
                            <Typography>more data</Typography>
                            <Typography>more data</Typography>
                        </Box>
                    </Collapse>

                </Box>
            </Collapse>
        </Box>
    );
}

function AdminToolsView(): React.ReactElement {
    const classes = useStyles();
    const location = useLocation();
    const { user } = useUserStore();
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

    useEffect(() => {
        async function isUserAuthorized() {
            const authorizedUsers: number[] = [
                2,  // Jon Blundell
                4,  // Jamie Cope
                5   // Eric Maslowski
            ];

            // if our current user ID is not in the list then return false
            if(!user) {
                console.log('[PACKRAT:ERROR] Admin tools cannot get authenticated user');
                setIsAuthorized(false);
            }
            setIsAuthorized(authorizedUsers.includes(user?.idUser ?? -1));
        }

        isUserAuthorized();
    }, [user]);

    // const queryProjectsByFilter = async newSearchText => {
    //     const newFilterQuery = await apolloClient.query({
    //         query: GetProjectListDocument,
    //         variables: {
    //             input: {
    //                 search: newSearchText
    //             }
    //         }
    //     });

    //     const {
    //         data: {
    //             getProjectList: { projects }
    //         }
    //     } = newFilterQuery;

    //     setProjectList(projects);
    // };


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
                        <AdminToolsBatchOperation />
                    ):(
                        <p>Not Authorized!</p>
                    )
                }
            </Box>
        </React.Fragment>
    );
}

export default AdminToolsView;
