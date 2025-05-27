import { Request, Response } from 'express';
import * as COOK from '../../job/impl/Cook/CookResource';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as H from '../../utils/helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */
const extractQueryParam = (param: any): string | undefined => {
    if(param) {
        return (param as string).toLocaleLowerCase().replace(/(^"|"$)/g, '');
    }

    return undefined;
};

export async function getCookResource(req: Request, res: Response): Promise<void> {

    // identify the job we're working with
    const job = extractQueryParam(req.query.job);
    if(!job) {
        RK.logError(RK.LogSection.eHTTP,'get cook resource failed','no job specified',H.Helpers.cleanExpressRequest(req),'HTTP.Route.Resources');
        const result = {
            success: false,
            error: 'Invalid request for Cook resources. No \'job\' parameter provided. Check your usage'
        };
        res.status(400).send(JSON.stringify(result));
        return;
    }

    // figure out who called this
    const source = (!req.ip || req.ip==='::1')?'localhost':req.ip;

    // cycle filter list of resources based on supported features
    const cookResource: COOK.CookResourceResult = await COOK.CookResource.getCookResource(job,source);

    // if we're empty, bail
    if(cookResource.success===false) {
        // figure out the appropriate return code and send our response
        const statusCode: number = (cookResource.error?.includes('Invalid parameter')===true)?400:200;
        cookResource.error = `Could not find a suitable resource for a '${job}' job. ${cookResource.error}`;
        RK.logError(RK.LogSection.eHTTP,'get cook resource failed',`cannot find the best fit resource: ${cookResource.error}`,{ job, statusCode },'HTTP.Route.Resources');
        res.status(statusCode).send(JSON.stringify(cookResource));
        return;
    }

    // return the result
    res.status(200).send(JSON.stringify(cookResource));
    RK.logInfo(RK.LogSection.eHTTP,'get cook resource failed','found matching cook resource',{ name: cookResource.resources[0].name, address: cookResource.resources[0].address, port: cookResource.resources[0].port },'HTTP.Route.Resources');
}
// #endregion