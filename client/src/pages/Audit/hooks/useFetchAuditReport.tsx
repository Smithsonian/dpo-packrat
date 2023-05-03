/* eslint-disable @typescript-eslint/no-explicit-any */
// Class with functions and types to help with managing and using audit reports.
// While not a true React 'Hook' placed here to follow system architecture.

// import { useState, useEffect } from 'react';
import { inflateSync } from 'zlib';


enum AuditReportStateEnum {
    Uninitialized = -1,
    Error = 0,
    Completed = 1,
    Loading = 2,
}
enum FetchReportAuditorEnum {
    EDAN = 0,
    Database = 1,
    Storage = 2,
}

export type FetchReportRequest = {
    auditor: FetchReportAuditorEnum,
    limit: number,
};
export type FetchReportStatus = {
    state: AuditReportStateEnum,
    message: string,
    data?: any,
};


export class AuditReportRequest {

    private req: FetchReportRequest;
    public status: FetchReportStatus;
    private idWorkflowReport: number;

    constructor(req: FetchReportRequest) {
        // todo: validate the request
        this.req = req;
        this.status = {
            state: AuditReportStateEnum.Uninitialized,
            message: 'uninitialized',
        };
        this.idWorkflowReport = -1;
    }

    private getAuditorEndpoint(): string {

        let auditorPath: string = '';
        switch(this.req.auditor){
            case FetchReportAuditorEnum.EDAN:
                auditorPath = 'edan';
                break;
            case FetchReportAuditorEnum.Database:
                auditorPath = 'db';
                break;
            case FetchReportAuditorEnum.Storage:
                auditorPath = 'storage';
                break;
        }

        const server: string = `${'http://localhost:4000'}`;
        let endpoint: string = `${server}/verifier/${auditorPath}?`;
        if(this.req.limit && this.req.limit>0) { endpoint += `limit=${this.req.limit}&`; }

        // const endpoint: `${serverAddress}/verifier/${auditorPath}?`;
        return endpoint;
    }
    private getReportEndpoint(): string {
        const server: string = `${'http://localhost:4000'}`;
        const endpoint: string = `${server}/verifier/report?idWorkflowReport=${this.idWorkflowReport}`;
        return endpoint;
    }
    private setStatus(state: AuditReportStateEnum, message: string, data?: any) {
        this.status.state = state;
        this.status.message = message;

        if(data)
            this.status.data = data;
        else
            delete this.status.data;
    }
    private getAuditReport() {
        const endpoint: string = this.getReportEndpoint();
        return fetch(endpoint)
            .then(response => response.json());
    }
    private AssignData(json: any) {
        // parse and re-assign our data
        try {
            // if we're compressed, inflate it
            if(json.isCompressed) {
                // convert from 'base64' which is what it was sent as
                // then inflate it and convert to standard characters
                const buffer: Buffer = Buffer.from(json.data,'base64');
                json.data = inflateSync(buffer).toString('utf-8');
            }

            // convert it to a json object
            json.data = JSON.parse(json.data);

            // set our states
            this.setStatus(AuditReportStateEnum.Completed,'loaded and assigned data',json);
            this.idWorkflowReport = json.idWorkflowReport;

        } catch(err) {
            // set our states
            this.setStatus(AuditReportStateEnum.Error,
                (err instanceof Error)?err.message:'failed to assign data. unknown type');
        }
    }

    public async getReport(useCache: boolean=true): Promise<FetchReportStatus> {

        // if we're completed then return previous status
        if(this.status.state===AuditReportStateEnum.Completed && useCache===true) {
            return this.status;
        }

        // make sure verifier is correct
        let verifierPath: string = 'edan'; //auditor.toString();
        if(verifierPath!=='edan') { verifierPath='edan'; }

        // hold onto our interval if request takes longer
        let interval;
        const intervalCycle: number = 5000; // 5s

        // reset our states
        this.setStatus(AuditReportStateEnum.Loading, 'loading verifier results');

        // notify through console
        console.log(`(Verifier) grabbing ${(this.req.limit && this.req.limit>0)?this.req.limit:'all'} subjects`);

        // figure out our endpoint
        const endpoint: string = this.getAuditorEndpoint();

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
                    // we have our data so store it
                    this.AssignData(json);
                } else {
                    // we don't have our data yet so we keep checking
                    // todo: define a timeout so not going forever. throw an error on fail
                    interval = setInterval(() => {
                        console.log('calling get report');
                        this.getAuditReport()
                            .then(json => {
                                if(json.isComplete===true) {
                                    this.AssignData(json);
                                    clearInterval(interval);
                                }
                            });
                    }, intervalCycle);
                }
            })
            .catch((err) => {
                this.setStatus(AuditReportStateEnum.Error, err.message);
            });

        // cleanup
        // todo: make sure interval is destroyed
        // return () => {
        //     console.log('clearing interval (pre):'+JSON.stringify(interval));
        //     clearInterval(interval);
        //     console.log('clearing interval (post):'+JSON.stringify(interval));
        // }
        return this.status;
    }
}

/*(req: FetchReportRequest | null): FetchReportStatus => {
    const [status, setStatus] = useState<FetchReportStatus>({
        state: AuditReportStateEnum.Uninitialized,
        message: 'uninitialized' });

    const getAuditReport = (idWorkflowReport: number) => {
        // const server: string = `${'http://localhost:4000'}`;
        // const endpoint: string = `${server}/verifier/report?idWorkflowReport=${idWorkflowReport}`;
        const endpoint: string = this.getReportEndpoint(idWorkflowReport);

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

            // convert it to a json object
            json.data = JSON.parse(json.data);

            // set our states
            setStatus({ state: AuditReportStateEnum.Success, message: 'loaded and assigned data', data: json });
            // setData(json);

        } catch(err) {
            // set our states
            setStatus({ state: AuditReportStateEnum.Error,
                message: (err instanceof Error)?err.message:'failed to assign data. unknown type' });
            // setData(null);
        }
    };

    useEffect(() => {
        console.log('in useEffect...');
        if(!req) { return; }

        // make sure verifier is correct
        let verifierPath: string = 'edan'; //auditor.toString();
        if(verifierPath!=='edan') { verifierPath='edan'; }

        // hold onto our interval if request takes longer
        let interval;
        const intervalCycle: number = 5000; // 5s

        // reset our states
        setStatus({ state: AuditReportStateEnum.Loading, message: 'loading verifier results' });
        // setData(null);

        // figure out our endpoint
        // let endpoint = `http://localhost:4000/verifier/${verifierPath}?`;
        const endpoint: string = getAuditorEndpoint(req);
        // if(req.limit && req.limit>0) { endpoint += `limit=${req.limit}&`; }
        // if(configID && configID>0) { endpoint += `idSystemObject=${configID}`; }

        // notify through console
        console.log(`(Verifier) grabbing ${(req.limit && req.limit>0)?req.limit:'all'} subjects`);

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
                        getAuditReport(json.idWorkflowReport)
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
                setStatus({ state: AuditReportStateEnum.Error, message: err.message });
            });

        // cleanup
        // todo: make sure interval is destroyed
        return () => {
            console.log('clearing interval (pre):'+JSON.stringify(interval));
            clearInterval(interval);
            console.log('clearing interval (post):'+JSON.stringify(interval));
        };

    },[req]);

    return status;
};

export default useFetchAuditReport;*/