/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

export type VerifierResult = {
    data: any | null,
    error: string | null,
    isPending: boolean
};

const useVerifier = (verifier: string): VerifierResult => {
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [data, setData] = useState<any>(null);

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

    useEffect(() => {

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
    },[verifier]);

    return { data, isPending, error };
};

export default useVerifier;