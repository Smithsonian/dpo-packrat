import * as DBAPI from '../../db';
import { Request, Response } from 'express';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export async function heartbeat(_: Request, response: Response): Promise<boolean> {
    const hb: HeartBeat = new HeartBeat(response);
    return await hb.test();
}

class HeartBeat {
    private response: Response;
    constructor(response: Response) {
        this.response = response;
    }

    async test(): Promise<boolean> {
        const vocab1: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(1);
        if (vocab1 === null)
            return this.sendError(503, 'DB is down');

        this.response.status(200);
        this.response.send('Packrat Health Check Successful');
        RK.logDebug(RK.LogSection.eHTTP,'server hearbeat success',undefined,undefined,'HTTP.HeartBeat');
        return true;
    }

    private sendError(statusCode: number, message?: string | undefined): false {
        this.response.status(statusCode);
        this.response.send(`Packrat is unhealthy: ${message}`);
        RK.logCritical(RK.LogSection.eHTTP,'server heartbeat failed',message,{ statusCode },'HTTP.HeartBeat');
        return false;
    }
}
