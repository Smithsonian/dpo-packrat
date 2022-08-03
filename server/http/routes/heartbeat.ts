import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';
import { Request, Response } from 'express';

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
        LOG.info('Server Heartbeat Succeeded', LOG.LS.eHTTP);
        return true;
    }

    private sendError(statusCode: number, message?: string | undefined): false {
        this.response.status(statusCode);
        this.response.send(`Packrat is unhealthy: ${message}`);
        LOG.error(`Server Heartbeat Failed: ${message}`, LOG.LS.eHTTP);
        return false;
    }
}
