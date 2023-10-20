import { Request, Response } from 'express';
import * as LOG from '../../utils/logger';
import * as COOK from '../../job/impl/Cook/CookResource';

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
        LOG.error('getCookResources failed. no job specified',LOG.LS.eHTTP);
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
        LOG.error(`getCookResource cannot find the best fit resource. (${cookResource.error})`, LOG.LS.eHTTP);

        cookResource.error = `Could not find a suitable resource for a ${job} job. ${cookResource.error}`;
        res.status(204).send(JSON.stringify(cookResource));
        return;
    }

    // return the result
    res.status(200).send(JSON.stringify(cookResource));
    LOG.info(`found matching cook resource ('${cookResource.resources[0].name} - ${cookResource.resources[0].address}:${cookResource.resources[0].port})'`,LOG.LS.eHTTP);
}
// #endregion