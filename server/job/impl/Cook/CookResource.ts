/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from 'axios';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';

type CookResourceState = {
    success: boolean,
    address: string,
    weight?: number,
    error?: string,
    jobsCreated?: number,
    jobsWaiting?: number,
    jobsRunning?: number,
};

export type CookResourceInfo = {
    name: string,
    address: string,
    port: number,
    machine_type: string,
    stats: {
        jobsCreated: number | undefined,
        jobsWaiting: number | undefined,
        jobsRunning: number | undefined,
    },
    support: {
        inspect: number
        scene_generation: number
        generate_downloads: number
        photogrammetry: number,
        large_files: number,
    }
};

export type CookResourceResult = {
    success: boolean,
    error?: string,
    resources: CookResourceInfo[],
};

const supportedJobTypes: string[] = ['inspect','scene_generation','generate_downloads','photogrammetry'];

const getCookResourceStatus = async (address: string, port: number): Promise<CookResourceState> => {
    // example: http://si-3dcook02.us.sinet.si.edu:8000/machine
    const endpoint = address+':'+port+'/machine';
    const maxRetries: number = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            LOG.info(`getCookResources getting status for resource: ${endpoint}.`,LOG.LS.eSYS);

            // make our query to the resource and timeout after 5 seconds to minimize delays
            const response: AxiosResponse | null = await axios.get(endpoint, { timeout: 5000 });
            if (!response || response.status<200 || response.status>299) {
                return {
                    success: false,
                    error: `${response?.status}: ${response?.statusText}`,
                    address };
            }

            const data = await response.data;
            const result: CookResourceState = {
                success: true,
                address,
                weight: -1,
                jobsCreated: data.jobs.created,
                jobsWaiting: data.jobs.waiting,
                jobsRunning: data.jobs.running,
            };
            return result;

        } catch (error: any) {
            const errorMessage = error.message ? error.message : JSON.stringify(error);
            LOG.error(`getCookResources ${address} attempt ${attempt} failed with error: ${errorMessage}`, LOG.LS.eSYS);

            if (attempt === maxRetries || !errorMessage.includes('getaddrinfo EAI_AGAIN')) {
                return { success: false, error: errorMessage, address };
            }

            // Wait for a short delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { success: false, error: (error.message)?error.message:JSON.stringify(error), address, };
        }
    }

    // if all retries failed, return failed state
    LOG.error(`getCookResources ${address} maximum retries reached.`, LOG.LS.eSYS);
    return { success: false, error: 'Max retries reached', address };
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
            LOG.error(`getCookResource failed to verify resource (${resource.Name}: ${resource.Address}). unsupported job (${job}).`,LOG.LS.eSYS);
            return 0;
        }
    }
};
const createResource = (dbResource: DBAPI.CookResource, resourceState: CookResourceState): CookResourceInfo => {
    return {
        name: dbResource.Name,
        address: dbResource.Address,
        port: dbResource.Port,
        machine_type: dbResource.MachineType,
        stats: {
            jobsCreated: resourceState.jobsCreated,
            jobsWaiting: resourceState.jobsWaiting,
            jobsRunning: resourceState.jobsRunning,
        },
        support: {
            inspect: dbResource.Inspection,
            scene_generation: dbResource.SceneGeneration,
            generate_downloads: dbResource.GenerateDownloads,
            photogrammetry: dbResource.Photogrammetry,
            large_files: dbResource.LargeFiles,
        },
    };
};

const createResultError = (message: string, dbResource?: DBAPI.CookResource | undefined, resourceState?: CookResourceState | undefined): CookResourceResult => {

    const result: CookResourceResult = {
        success: false,
        error: message,
        resources: []
    };

    // if we have a resource
    if(dbResource) {
        const resource: CookResourceInfo = {
            name: dbResource.Name,
            address: dbResource.Address,
            port: dbResource.Port,
            machine_type: dbResource.MachineType,
            stats: {
                jobsCreated: resourceState?.jobsCreated,
                jobsWaiting: resourceState?.jobsWaiting,
                jobsRunning: resourceState?.jobsRunning,
            },
            support: {
                inspect: dbResource.Inspection,
                scene_generation: dbResource.SceneGeneration,
                generate_downloads: dbResource.GenerateDownloads,
                photogrammetry: dbResource.Photogrammetry,
                large_files: dbResource.LargeFiles,
            },
        };
        result.resources.push(resource);
    }
    return result;
};

export const getJobTypeFromCookJobName = (cookJobName: string): string | undefined => {
    // first by extracting from the name, and then finding best match
    const parts: string[] = cookJobName.split(':');
    if(parts.length<=1) {
        LOG.error(`getJobTypeFromCookJobName encountered unexpected input format. (${cookJobName})`,LOG.LS.eSYS);
        return;
    }

    switch(parts[0]) {
        case 'inspect-mesh':
        case 'si-packrat-inspect': return 'inspect';

        case 'si-vogager-scene':
        case 'si-voyager-scene': return 'scene_generation';

        case 'si-generate-downloads': return 'generate_downloads';

        default:{
            LOG.error(`getJobTypeFromCookJobName encountered unsupported input format. (${parts[0]})`,LOG.LS.eSYS);
            return;
        }
    }
};

// utility function for formatting a cook resource into a descriptive string.
export const getResourceInfoString = (resource: CookResourceInfo, job: string | null = null): string => {
    const weight: number = job ? resource.support[job] : -1;
    return `'${resource.name}', a ${resource.machine_type}, for the job. (weight: ${weight} | created: ${resource.stats.jobsCreated} | waiting: ${resource.stats.jobsWaiting} | running: ${resource.stats.jobsRunning}).`;
};

export class CookResource {

    // TODO: improved combined weighting of different fields vs. current sequential approach

    static async getCookResource(job: string, source?: string, includeAll: boolean = false): Promise<CookResourceResult> {

        // verify job type
        if(supportedJobTypes.includes(job)===false)
            return createResultError(`Invalid parameter. Unsupported job type: ${job}.`);

        // grab all resources from DB
        const cookResources: DBAPI.CookResource[] | null = await DBAPI.CookResource.fetchAll();
        if(!cookResources) {
            LOG.error('getCookResources failed. no resources found in the database.',LOG.LS.eSYS);
            return createResultError('Cannot find a Cook resource in the database. Contact Packrat support.');
        }

        // cycle filter list of resources based on supported features
        // TODO: add user id, or 'internal'
        LOG.info(`getCookResources checking availability for '${job}' job from '${(!source)?'internal':source}'`,LOG.LS.eSYS);
        const cookResourceResults: CookResourceState[] = [];
        for(let i=0; i<cookResources.length; i++) {

            // make sure the resource supports the job type
            const supportWeight: number = verifyCookResourceCapability(job,cookResources[i]);
            if(supportWeight <= 0) {
                LOG.info(`getCookResources skipping resource: ${cookResources[i].Name}. (address: ${cookResources[i].Address} | reason: unsupported job type)`,LOG.LS.eSYS);
                continue;
            }

            // otherwise get its status and wait for it
            // OPT: fire each off without waiting, but wait outside the loop for concurrency
            const result: CookResourceState = await getCookResourceStatus(cookResources[i].Address,cookResources[i].Port);
            if(result.success===true) {
                result.weight = supportWeight;
                cookResourceResults.push(result);
            } else {
                LOG.info(`getCookResources skipping resource: ${cookResources[i].Name}. (address: ${cookResources[i].Address} | reason: ${result.error})`,LOG.LS.eSYS);
            }
        }

        // if we're empty, bail
        if(cookResourceResults.length<=0) {
            LOG.error(`getCookResource cannot find the best fit resource. (resources: ${cookResourceResults.length})`, LOG.LS.eSYS);
            return createResultError(`Could not find a suitable resource for a ${job} job. (${cookResources.length} resources checked)`);
        }

        // sort list based on capabilities
        cookResourceResults.sort((a, b) => {
            if(a.weight == undefined || b.weight == undefined ||
               a.jobsWaiting == undefined || b.jobsWaiting == undefined ||
               a.jobsRunning == undefined || b.jobsRunning == undefined ||
               a.jobsCreated == undefined || b.jobsCreated == undefined) {
                LOG.error(`getCookResources cannot sort resources. resources have undefined properties. (A: ${JSON.stringify(a)} | B: ${JSON.stringify(b)})`,LOG.LS.eSYS);
                return 0;
            }

            // Sort by weight in descending order
            if (a.weight !== b.weight) {
                return b.weight - a.weight;
            }

            // If weight is the same, sort by jobsWaiting in ascending order
            const pendingA: number = a.jobsWaiting + a.jobsCreated;
            const pendingB: number = b.jobsWaiting + b.jobsCreated;
            if (pendingA !== pendingB) {
                return pendingA - pendingB;
            }

            // If both weight and jobsWaiting are the same, sort by jobsRunning in ascending order
            return a.jobsRunning - b.jobsRunning;
        });

        // our result
        const result: CookResourceResult = {
            success: true,
            resources: [],
        };

        // cycle through all gathered resources building our returned list
        for(let i=0; i<cookResourceResults.length; i++) {

            // find match of resource and its results
            const resource: DBAPI.CookResource | undefined = cookResources.find(item => item.Address === cookResourceResults[i].address);
            if(!resource) {
                LOG.info(`getCookResource cannot find a matching resource in original array. skipping (${cookResourceResults[i].address})`, LOG.LS.eSYS);
                continue;
            }

            // store in our array
            result.resources.push(createResource(resource,cookResourceResults[i]));

            // break after one
            if(includeAll === false)
                break;
        }

        // if we didn't find any then we need to fail
        if(result.resources.length===0) {
            LOG.error('getCookResource cannot find any suitable resources',LOG.LS.eSYS);
            return createResultError(`Could not find a matching resource. notify Packrat support. (${cookResources.length} resources checked)`);
        }

        // status messgae
        LOG.info(`getCookResources matched ${result.resources.length} resources. The best fit is ${getResourceInfoString(result.resources[0])}`,LOG.LS.eSYS);
        return result;
    }
}