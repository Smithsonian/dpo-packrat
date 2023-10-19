/* eslint-disable camelcase */
import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';


// #region RESOURCES: COOK
// TODO: move much of this functionality into a central utility function (JobCook? DBAPI?) for reuse
type CookResourceResult = {
    success: boolean,
    address: string,
    weight?: number,
    error?: string,
    jobsWaiting?: number,
    jobsRunning?: number,
};

const getCookResourceStatus = async (address: string, port: number): Promise<CookResourceResult> => {
    // example: http://si-3dcook02.us.sinet.si.edu:8000/machine
    const endpoint = address+':'+port+'/machine';

    try {
        LOG.info(`getCookResources getting status for resource: ${endpoint}.`,LOG.LS.eHTTP);

        const response: AxiosResponse | null = await axios.get(endpoint);
        if (!response || response.status<200 || response.status>299) {
            return {
                success: false,
                error: `${response?.status}: ${response?.statusText}`,
                address };
        }

        const data = await response.data;
        const result: CookResourceResult = {
            success: true,
            address,
            weight: -1,
            jobsWaiting: data.jobs.waiting,
            jobsRunning: data.jobs.running,
        };
        return result;

    } catch (error) {
        return { success: false, error: JSON.stringify(error), address, };
    }
};

const verifyCookResourceCapability = (job: string, resource: DBAPI.CookResource): number => {
    // check if the resource supports the given job type
    switch(job) {
        case 'inspect': {
            return resource.Inspection;
        } break;

        case 'scene_generation': {
            return resource.SceneGeneration;
        } break;

        case 'generate_downloads': {
            return resource.GenerateDownloads;
        } break;

        case 'photogrammetry': {
            return resource.Photogrammetry;
        } break;

        default: {
            LOG.error(`getCookResource failed to verify resource (${resource.Name}: ${resource.Address}). unsupported job (${job}).`,LOG.LS.eHTTP);
            return 0;
        }
    }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const extractQueryParam = (param: any): string | undefined => {
    if(param) {
        return (param as string).toLocaleLowerCase().replace(/(^"|"$)/g, '');
    }

    return undefined;
};

export async function getCookResource(req: Request, res: Response): Promise<void> {

    // grab all resources from DB
    const cookResources: DBAPI.CookResource[] | null = await DBAPI.CookResource.fetchAll();
    if(!cookResources) {
        LOG.error('getCookResources failed. no resources found in the database.',LOG.LS.eHTTP);
        const result = {
            success: false,
            error: 'Cannot find a Cook resource in the database. Contact Packrat support.'
        };
        res.status(500).send(JSON.stringify(result));
        return;
    }

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

    // cycle filter list of resources based on supported features
    LOG.info(`getCookResources checking availability for ${job} job from: ${req.ip}`,LOG.LS.eHTTP);
    const cookResourceResults: CookResourceResult[] = [];
    for(let i=0; i<cookResources.length; i++) {

        // make sure the resource supports the job type
        const supportWeight: number = verifyCookResourceCapability(job,cookResources[i]);
        if(supportWeight <= 0) {
            LOG.info(`getCookResources skipping resource: ${cookResources[i].Name}. (address: ${cookResources[i].Address} | reason: does not support job type)`,LOG.LS.eHTTP);
            continue;
        }

        // otherwise get its status and wait for it
        // OPT: fire each off without waiting, but wait outside the loop for concurrency
        const result: CookResourceResult = await getCookResourceStatus(cookResources[i].Address,cookResources[i].Port);
        if(result.success===true) {
            result.weight = supportWeight;
            cookResourceResults.push(result);
        } else {
            LOG.info(`getCookResources skipping resource: ${cookResources[i].Name}. (address: ${cookResources[i].Address} | reason: ${result.error})`,LOG.LS.eHTTP);
        }
    }

    // if we're empty, bail
    if(cookResourceResults.length<=0) {
        LOG.error(`getCookResource cannot find the best fit resource. (resources: ${cookResourceResults.length})`, LOG.LS.eHTTP);

        const result = {
            success: false,
            error: `Could not find a suitable resource for a ${job} job. (${cookResources.length} resources checked)`
        };
        res.status(204).send(JSON.stringify(result));
        return;
    }

    // sort list based on capabilities
    cookResourceResults.sort((a, b) => {
        if(a.weight == undefined || b.weight == undefined || a.jobsWaiting == undefined || b.jobsWaiting == undefined || a.jobsRunning == undefined || b.jobsRunning == undefined) {
            LOG.error(`getCookResources cannot sort resources. resources have undefined properties. (A: ${JSON.stringify(a)} | B: ${JSON.stringify(b)})`,LOG.LS.eHTTP);
            return 0;
        }

        // Sort by weight in descending order
        if (a.weight !== b.weight) {
            return b.weight - a.weight;
        }

        // If weight is the same, sort by jobsWaiting in ascending order
        if (a.jobsWaiting !== b.jobsWaiting) {
            return a.jobsWaiting - b.jobsWaiting;
        }

        // If both weight and jobsWaiting are the same, sort by jobsRunning in ascending order
        return a.jobsRunning - b.jobsRunning;
    });

    // find best match by looking at # jobs waiting
    const bestFit: DBAPI.CookResource | undefined = cookResources.find(item => item.Address === cookResourceResults[0].address);
    if(!bestFit) {
        LOG.error('getCookResource cannot find a matching resource in original array.', LOG.LS.eHTTP);

        const result = {
            success: false,
            error: `Could not find a matching resource. notify Packrat support. (${cookResources.length} resources checked)`
        };
        res.status(500).send(JSON.stringify(result));
        return;
    }

    // return full info on resource
    const result = {
        success: true,
        name: bestFit.Name,
        address: bestFit.Address,
        port: bestFit.Port,
        machine_type: bestFit.MachineType,
        stats: {
            jobsWaiting: cookResourceResults[0].jobsWaiting,
            jobsRunning: cookResourceResults[0].jobsRunning,
        },
        support: {
            inspect: bestFit.Inspection,
            scene_generation: bestFit.SceneGeneration,
            generate_downloads: bestFit.GenerateDownloads,
            photogrammetry: bestFit.Photogrammetry,
            large_files: bestFit.LargeFiles,
        }
    };
    res.status(200).send(JSON.stringify(result));
    LOG.info(`getCookResources matched '${result.name}', a ${result.machine_type}, for the job. (waiting: ${result.stats.jobsWaiting} | running: ${result.stats.jobsRunning}).`,LOG.LS.eHTTP);
}
// #endregion