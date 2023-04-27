/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/display-name */

// element for holding auditing, verification, and outward facing reports/utils
import { Box, Container, Typography, Tooltip, TextField, LinearProgress } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { DataGrid, GridColumns, GridToolbarContainer, GridToolbarFilterButton } from '@material-ui/data-grid';
import { inflateSync } from 'zlib';

// define the CSS styles we're going to use
const useStyles = makeStyles(({ palette /*, breakpoints*/ }) => createStyles({
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
    container: {
        flex: 1,
        background: palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 'none',
    },
    footer: {
        marginTop: 50,
    },

    // table cell coloring
    cellFail: {
        color: 'white',
        background: palette.error.dark,
        width: '100%',
        textAlign: 'center',
    },
    cellPass: {
        color: 'white',
        background: 'green',
        width: '100%',
        textAlign: 'center',
    },

    // header elements
    headerContainer: {
        height: 'fit-content',
        background: '#EEE',
        border: 'solid #DDD',
        borderWidth: '0 0 1px 0', // top, right, bottom, left
        margin: 0,
        padding: 0,
        paddingTop: 20,
        maxWidth: 'none',
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
    verifierConfigContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        borderTop: '1px solid #DDD',
        background: '#f7f6f6',
        margin: 0,
        padding: 0,
        maxWidth: 'none',
    },
    verifierConfigInput: {
        margin: '15px',
    },

    // status elements
    statusContainer: {
        display: 'flex',
        textAlign: 'center',
        flexDirection: 'row',
        maxWidth: 'none',
        margin: 0,
        padding: 0,
    },
    statusError: {
        width: '100%',
        border: `1px solid ${palette.error.dark}`,
        borderRadius: 0,
        borderWidth: '1px 0 1px 0',
    },
    statusInfo: {
        border: `1px solid ${palette.info.light}`,
        borderRadius: 0,
        borderWidth: '0px 0 1px 0',
    },
    statusSuccess: {
        width: '100%',
        border: `1px solid ${palette.success.dark}`,
        borderRadius: 0,
        borderWidth: '1px 0 1px 0', // top, right, bottom, left
    },
    statusText: {
        margin: 0
    },

    // data elements
    dataResultsContainer: {
        textAlign: 'center',
        flex: 1,
        marginTop: 20,
        maxWidth: 'none',
    },
}));

const getTestTooltip = (test,testType) => {
    // background: 'rgba(44,64,90,0.7)'
    const content: React.ReactElement = (
        <Tooltip className={test.style} arrow title={
            <div style={{ border: '1px solid white', padding: 10, margin: 0, }}>
                <h2 style={{ textDecoration: 'underline', textAlign: 'center' }}>Test: {testType}</h2>
                {(test.message.length>0)?<p>{test.message}</p>:''}
                <p style={{ textDecoration: 'underline', marginTop: 20, fontSize: '1.15rem' }}>Packrat</p>
                <p>{test.packrat}</p>
                <p style={{ textDecoration: 'underline', fontSize: '1.15rem' }}>EDAN</p>
                <p>{test.edan}</p>
            </div>
        }
        >
            <Typography>{test.status}</Typography>
        </Tooltip>
    );
    return content;
};
// const getTestTooltip = (test,testType) => {
//     const content: React.ReactElement = (
//         <Tooltip className={test.style} arrow title={
//             <div style={{ background: '#333', border: '1px solid black', padding: 5, margin: 0 }}>
//                 <h2 style={{ textDecoration: 'underline', textAlign: 'center' }}>Test: {testType}</h2>
//                 {(test.message.length>0)?<p style={{ fontSize: '1rem' }}>{test.message}</p>:''}
//                 <p style={{ textDecoration: 'underline', marginTop: 20, fontSize: '1.15rem' }}>Packrat</p>
//                 <p style={{ fontWeight: 'thin' }}>{test.packrat}</p>
//                 <p style={{ textDecoration: 'underline', fontSize: '1.15rem' }}>EDAN</p>
//                 <p>{test.edan}</p>
//             </div>
//         }
//         >
//             <Typography>{test.status}</Typography>
//         </Tooltip>
//     );
//     return content;
// };
const getCustomToolbar = () => {
    return (
        <GridToolbarContainer>
            {/* <GridToolbarExport /> */}
            <GridToolbarFilterButton />
        </GridToolbarContainer>
    );
};
const columns: GridColumns = [
    {   field: 'id',
        headerName: 'ID',
        type: 'number',
        width: 75,
    },
    {   field: 'subject',
        headerName: 'Subject Name',
        flex: 3
    },
    {   field: 'details',
        headerName: 'Details',
        width: 100,
        sortable: false,
        renderCell: params => (
            <a href={params.row.details} target='_blank' rel='noopener noreferrer'>Edit</a>
        )
    },
    {   field: 'testSubject',
        headerName: 'Subject',
        flex: 1,
        renderCell: params => {
            return getTestTooltip(params.row.testSubject,'Subject');
        },
        sortComparator: (v1: any, v2: any) => { return (!v1 || !v2)?0:v1.status.localeCompare(v2.status); }
    },
    {   field: 'testUnit',
        headerName: 'Unit',
        flex: 1,
        renderCell: params => {
            return getTestTooltip(params.row.testUnit,'Unit');
        },
        sortComparator: (v1: any, v2: any) => { return (!v1 || !v2)?0:v1.status.localeCompare(v2.status); }
    },
    {   field: 'testIdentifier',
        headerName: 'Identifier',
        flex: 1,
        renderCell: params => {
            return getTestTooltip(params.row.testIdentifier,'Identifiers');
        },
        sortComparator: (v1: any, v2: any) => { return (!v1 || !v2)?0:v1.status.localeCompare(v2.status); }
    },
];

enum StatusStateEnum {
    uninitialized = -1,
    error = 0,
    running = 1,
    loading = 2,
    success = 10,
}
type Status = {
    state: StatusStateEnum;
    message: string;
};

function Audit(): React.ReactElement {
    const classes = useStyles();

    // const [isPending, setIsPending] = useState<boolean>(false);
    // const [error, setError] = useState<string|null>(null);
    const [status, setStatus] = useState<Status>({ state: StatusStateEnum.uninitialized, message: 'uninitialized' });
    const [configLimit, setConfigLimit] = useState<number>();
    // const [configID, setConfigID] = useState<number>();

    const [data, setData] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);


    // side effect for onMount
    useEffect(() => {
        // todo: check if local storage has previous session.
        //       if so, load it (or grab from the server)
    },[]);

    // reactive side effects that trigger based on changes in the data/variable
    useEffect(() => {
        if(!data) return;
        console.warn(data);

        const formattedData: any[] = [];
        data.data.forEach(item => {
            formattedData.push({
                id: item.idSystemObject,
                subject: item.subject,
                url: item.objectURL,
                testSubject: {
                    id: item.idSystemObject, // duplicated so cell callbacks can reference it
                    status: item.tests[0].status,
                    message: item.tests[0].message,
                    packrat: item.tests[0].packratData.map(i => { return <span key={`${item.idSubject}:${Math.random()}:p0`}>{i}<br></br></span>; }),
                    edan: item.tests[0].edanData.map(i => { return <span key={`${item.idSubject}:${Math.random()}:e0`}>{i}<br></br></span>; }),
                    style: (item.tests[0].status==='fail')?classes.cellFail:classes.cellPass,
                },
                testUnit: {
                    id: item.idSystemObject, // duplicated so cell callbacks can reference it
                    status: item.tests[1].status,
                    message: item.tests[1].message,
                    packrat: item.tests[1].packratData.map(i => { return <span key={`${item.idSubject}:${Math.random()}:p1`}>{i}<br></br></span>; }),
                    edan: item.tests[1].edanData.map(i => { return <span key={`${item.idSubject}:${Math.random()}:e1`}>{i}<br></br></span>; }),
                    style: (item.tests[1].status==='fail')?classes.cellFail:classes.cellPass,
                },
                testIdentifier: {
                    id: item.idSystemObject, // duplicated so cell callbacks can reference it
                    status: item.tests[2].status,
                    message: item.tests[2].message,
                    packrat: item.tests[2].packratData.map(i => { return <span key={`${item.idSubject}:${Math.random()}:p2`}>{i}<br></br></span>; }),
                    edan: item.tests[2].edanData.map(i => { return <span key={`${item.idSubject}:${Math.random()}:e2`}>{i}<br></br></span>; }),
                    style: (item.tests[2].status==='fail')?classes.cellFail:classes.cellPass,
                }
            });
        });
        setChartData(formattedData);

    }, [data,classes]);

    // handle any changes in status
    useEffect(() => {
        if(status.state===StatusStateEnum.success) {
            setTimeout(() => {
                if(status.state===StatusStateEnum.success)
                    setStatus({ state: StatusStateEnum.running, message: status.message });
            }, 3000);
        }
    }, [status]);

    // helper routines for polling a report and assigning data to the state
    // todo: procedurally get the server address
    const getVerifierReport = (idWorkflowReport: number) => {
        const server: string = `${'http://localhost:4000'}`;
        const endpoint: string = `${server}/verifier/report?idWorkflowReport=${idWorkflowReport}`;

        return fetch(endpoint)
            .then(response => response.json());
    };
    const AssignData = (json: any) => {
        // parse and re-assign our data
        try {
            // if we're compressed, inflate it
            if(json.isCompressed) {
                // convert from 'base64' which is what it was sent as
                // then inflate it and convert to standard characters
                const buffer: Buffer = Buffer.from(json.data,'base64');
                json.data = inflateSync(buffer).toString('utf-8');
            }

            // convert it to an json object
            json.data = JSON.parse(json.data);

            // set our states
            // setIsPending(false);
            // setError(null);
            setStatus({ state: StatusStateEnum.success, message: 'loaded and assigned data' });
            setData(json);

        } catch(err) {
            // set our states
            // setError((err instanceof Error)?err.message:'failed to assign data. unknown type');
            // setIsPending(false);
            setStatus({ state: StatusStateEnum.error,
                message: (err instanceof Error)?err.message:'failed to assign data. unknown type' });
            setData(null);
        }
    };
    const setVerifier = (verifier: string) => {
        // make sure verifier is correct
        let verifierPath: string = verifier;
        if(verifierPath!=='edan') { verifierPath='edan'; }

        // hold onto our interval if request takes longer
        let interval;
        const intervalCycle: number = 5000; // 5s

        // reset our states
        // setIsPending(true);
        // setError(null);
        setStatus({ state: StatusStateEnum.loading, message: 'loading verifier results' });
        setData(null);

        // figure out our endpoint
        let endpoint = `http://localhost:4000/verifier/${verifierPath}?`;
        if(configLimit && configLimit>0) { endpoint += `limit=${configLimit}&`; }
        // if(configID && configID>0) { endpoint += `idSystemObject=${configID}`; }

        // notify through console
        console.log(`(Verifier) grabbing ${(configLimit && configLimit>0)?configLimit:'all'} subjects`);

        // fetch our data
        fetch(endpoint)
            .then(response => {
                if(!response.ok || response.status>=300) {
                    throw new Error(`${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(json => {
                // console.log(json);

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
                // setIsPending(false);
                // setError(err.message);
                setStatus({ state: StatusStateEnum.error, message: err.message });
            });

        // cleanup
        return () => { clearInterval(interval); };
    };
    const onConfigLimitChange = (e) => {
        if (!e.target.validity.patternMismatch) {
            setConfigLimit(e.target.value.split(/\D/).join(''));
        }
    };
    // const onConfigIdChange = (e) => {
    //     if (!e.target.validity.patternMismatch) {
    //         setConfigID(e.target.value.split(/\D/).join(''));
    //     }
    // };

    const renderStatusBox = (status: Status) => {
        console.log(status.state);

        switch(status.state) {

            case StatusStateEnum.uninitialized: {
                return (
                    // todo: add future instructions for first-time visitor
                    <p>Tap &apos;SUBMIT&apos; above to start validation</p>
                );
            }

            case StatusStateEnum.error: {
                return (
                    <Alert severity='error' className={classes.statusError}>
                        <p className={classes.statusText}>Error: {status.message}</p>
                    </Alert>
                );
            }

            case StatusStateEnum.success: {
                return (
                    <Alert severity='success' className={classes.statusSuccess}>
                        <p className={classes.statusText}>{status.message}</p>
                    </Alert>
                );
            }

            case StatusStateEnum.loading: {
                return (
                    <div style={{ flex: 1 }}>
                        <Alert severity='info' className={classes.statusInfo}>
                            <p className={classes.statusText}>{status.message}</p>
                        </Alert>
                        <LinearProgress />
                    </div>
                );
            }

            default: {
                return (
                    <Container className={classes.statusContainer}>
                        {''}
                    </Container>
                );
            }
        }
    };

    // return our JSX markup
    return (
        <Box className={classes.container}>
            <Container className={classes.headerContainer}>
                <Typography className={classes.title} variant='h4'>
                    Packrat
                </Typography>
                <Typography className={classes.subtitle} variant='body1'>
                    Auditing: Verifiers
                </Typography>
                <Container className={classes.verifierTypeContainer}>
                    <button className={classes.verifierTypeButton} onClick={() => setVerifier('edan')}>Submit</button>
                </Container>
                <Container className={classes.verifierConfigContainer}>
                    <TextField
                        className={classes.verifierConfigInput}
                        inputProps={{ inputMode: 'numeric', pattern: '^-?[0-9]\\d*\\.?\\d*$' }}
                        helperText='# of objects to verify. (empty for all)'
                        id='verify-limit-input'
                        label='Limit'
                        onChange={onConfigLimitChange}
                        value={configLimit || ''}
                    />
                    {/* <TextField
                        className={classes.verifierConfigInput}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        helperText='a specific SystemObject ID'
                        id='verify-system-obj-id-input'
                        label='Object Id'
                        onChange={onConfigIdChange}
                        value={configID || ''}
                    /> */}
                </Container>
            </Container>
            <Container className={classes.statusContainer}>
                { renderStatusBox(status) }
            </Container>
            <Container className={classes.dataResultsContainer}>
                {
                    (chartData && status.state!==StatusStateEnum.loading)?
                        <Box className={classes.dataResultsContainer}>
                            <DataGrid
                                rows={chartData}
                                columns={columns}
                                rowHeight={40}
                                scrollbarSize={5}
                                rowsPerPageOptions={[100]}
                                pageSize={15}
                                // pageSizeOptions={[5, 10, 25]}
                                density='compact'
                                disableSelectionOnClick
                                autoHeight
                                components={{ Toolbar: getCustomToolbar }}
                            />
                        </Box>
                        :
                        ''
                }
            </Container>
            <Box className={classes.footer}></Box>
        </Box>
    );
}

export default Audit;
