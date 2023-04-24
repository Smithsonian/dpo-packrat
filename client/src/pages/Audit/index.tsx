/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// element for holding auditing, verification, and outward facing reports/utils
import { Box, Container, Typography } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
// import useVerifier from './hooks/useVerifier';

// define the CSS styles we're going to use
const useStyles = makeStyles(({ palette /*, breakpoints*/ }) => createStyles({
    container: {
        flex: 1,
        background: palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
    },

    // header elements
    headerContainer: {
        height: 'fit-content',
        background: '#EEE',
        border: 'solid #000',
        borderWidth: '0 0 1px 0', // top, right, bottom, left
    },
    verifierTypeContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    verifierTypeButton: {
        width: 150,
        height: 30,
        borderRadius: 5,
        border: '1px solid black',
        textAlign: 'center',
        margin: 10,
        color: '#FFF',
        background: '#0079C4',
        // boxShadow: `0px 1px 4px ${fade(palette.primary.dark, 0.2)}`
    },

    // status elements
    statusContainer: {
        display: 'flex',
        textAlign: 'center',
        flexDirection: 'row',
    },
    statusErrorContainer: {
        flex: 1,
        border: '1px solid darkred',
        padding: 0,
        margin: 0,
        borderTop: 0,
        borderRadius: '0 0 20px 20px',
        paddingBottom: 5,
        background: 'pink',
        color: 'darkred',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
    },
    statusInfoContainer: {
        flex: 1,
        border: '1px solid steelblue',
        padding: 0,
        margin: 0,
        borderTop: 0,
        borderRadius: '0 0 20px 20px',
        paddingBottom: 5,
        background: 'aliceblue',
        color: 'steelblue',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
    },
    statusText: {
        margin: 0
    },

    // data elements
    dataResultsContainer: {
        textAlign: 'center'
    },

    title: {
        fontWeight: 400,
        color: 'black',
        textAlign: 'center',
        marginBottom: 5
    },
    subtitle: {
        color: palette.primary.dark,
        fontWeight: 400,
        textAlign: 'center'
    },
}));

function Audit(): React.ReactElement {
    const classes = useStyles();

    // const [verifierType, setVerifierType] = useState('edan');
    // const { data, isPending, error } = useVerifier(verifierType);
    const [isPending, setIsPending] = useState<boolean>(false);
    const [error, setError] = useState<string|null>(null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if(!data) return;
        console.warn(data);
    }, [data]);
    useEffect(() => {
        console.log('pending changed: '+isPending);
    },[isPending]);
    useEffect(() => {
        console.log('error changed: '+error);
    },[error]);

    // helper routines for polling a report and assigning data to the state
    const getVerifierReport = (idWorkflowReport: number) => {
        console.log('checking report endpoint');
        return fetch(`http://localhost:4000/verifier/report?idWorkflowReport=${idWorkflowReport}`)
            .then(response => response.json());
    };
    const AssignData = (json: any) => {
        // parse and re-assign our data (todo: handle if compressed)
        json.data = JSON.parse(json.data);

        // set our states
        setIsPending(false);
        setError(null);
        setData(json);
    };
    const setVerifier = (verifier: string) => {
        // make sure verifier is correct
        let verifierPath: string = verifier;
        if(verifierPath!=='edan') { verifierPath='edan'; }

        // hold onto our interval if request takes longer
        let interval;
        const intervalCycle: number = 5000; // 5s

        // reset our states
        setIsPending(true);
        setError(null);
        setData(null);

        // fetch our data
        fetch(`http://localhost:4000/verifier/${verifierPath}?limit=${2}`)
            .then(response => {
                if(!response.ok || response.status>=300) {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(json => {
                console.log(json);

                // if not successful, throw error
                if(json.success===false)
                    throw Error(json?.error);

                // if we're already done then set our data
                if(json.isComplete===true) {
                    // we have our data so return it
                    AssignData(json);
                } else {
                    // we don't have our data yet so we keep checking
                    // todo: define a timeout so not going forever. throw an error on fail
                    interval = setInterval(() => {
                        console.log('calling get report');
                        getVerifierReport(json.idWorkflowReport)
                            .then(json => {
                                if(json.isComplete===true) {
                                    AssignData(json);
                                    clearInterval(interval);
                                }
                            });
                    }, intervalCycle);
                }
            })
            .catch((err) => {
                setIsPending(false);
                setError(err.message);
            });

        // cleanup
        return () => { clearInterval(interval); };
    };
    const getStatusMessage = () => {
        return (
            (!isPending && !error)?
                <p>Tap &apos;Refresh&apos; above to start validation</p>
                :
                ''
        );
    };
    const getDataMarkup = (data) => {
        if(!data) {
            return (
                <p>No data yet...</p>
            );
        }
        return (
            data.map(item => {
                return <p key={`${item.idSubject}:${item.idSytemObject}`}>{JSON.stringify(item)}</p>;
            })
        );
    };

    return (
        <Box className={classes.container}>
            <Container className={classes.headerContainer}>
                <Typography className={classes.title} variant='h4'>
                    Packrat
                </Typography>
                <Typography className={classes.subtitle} variant='body1'>
                    Auditing (dev)
                </Typography>
                <Container className={classes.verifierTypeContainer}>
                    <button className={classes.verifierTypeButton} onClick={() => setVerifier('edan')}>Refresh</button>
                </Container>
            </Container>
            <Container className={classes.statusContainer}>
                {
                    (error)?
                        <Box className={classes.statusErrorContainer}>
                            <h3 className={classes.statusText}>Error</h3>
                            <p className={classes.statusText}>some error message</p>
                        </Box>
                        :''
                }
                {
                    (isPending)?
                        <Box className={classes.statusInfoContainer}>
                            <p className={classes.statusText}>Loading...</p>
                        </Box>
                        :''
                }
            </Container>
            <Container className={classes.dataResultsContainer}>
                {
                    (data)?
                        getDataMarkup(data.data)
                        :
                        getStatusMessage()
                }
            </Container>
        </Box>
    );

    // function getErrorMessage(error: string): string {
    //     // todo: more granular handling of different status codes and messages
    //     console.log(error);
    //     return error;
    // }
}

export default Audit;
