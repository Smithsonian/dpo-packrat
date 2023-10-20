/* eslint-disable camelcase */
import axios, { AxiosResponse } from 'axios';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';

type CookResourceState = {
    success: boolean,
    address: string,
    weight?: number,
    error?: string,
    jobsWaiting?: number,
    jobsRunning?: number,
};

type CookResourceInfo = {
    name: string,
    address: string,
    port: number,
    machine_type: string,
    stats: {
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

const getCookResourceStatus = async (address: string, port: number): Promise<CookResourceState> => {
    // example: http://si-3dcook02.us.sinet.si.edu:8000/machine
    const endpoint = address+':'+port+'/machine';

    try {
        LOG.info(`getCookResources getting status for resource: ${endpoint}.`,LOG.LS.eSYS);

        const response: AxiosResponse | null = await axios.get(endpoint);
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
            LOG.error(`getCookResource failed to verify resource (${resource.Name}: ${resource.Address}). unsupported job (${job}).`,LOG.LS.eSYS);
            return 0;
        }
    }
};
const createResult = (dbResource: DBAPI.CookResource, resourceState: CookResourceState): CookResourceResult => {
    return {
        success: true,
        resources: [{
            name: dbResource.Name,
            address: dbResource.Address,
            port: dbResource.Port,
            machine_type: dbResource.MachineType,
            stats: {
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
        }],
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

export class CookResource {

    static async getCookResource(job: string, source?: string): Promise<CookResourceResult> {

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
                LOG.info(`getCookResources skipping resource: ${cookResources[i].Name}. (address: ${cookResources[i].Address} | reason: does not support job type)`,LOG.LS.eSYS);
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
            if(a.weight == undefined || b.weight == undefined || a.jobsWaiting == undefined || b.jobsWaiting == undefined || a.jobsRunning == undefined || b.jobsRunning == undefined) {
                LOG.error(`getCookResources cannot sort resources. resources have undefined properties. (A: ${JSON.stringify(a)} | B: ${JSON.stringify(b)})`,LOG.LS.eSYS);
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
            LOG.error('getCookResource cannot find a matching resource in original array.', LOG.LS.eSYS);
            return createResultError(`Could not find a matching resource. notify Packrat support. (${cookResources.length} resources checked)`);
        }

        // return full info on resource
        const result: CookResourceResult = createResult(bestFit, cookResourceResults[0]);
        LOG.info(`getCookResources matched '${result.resources[0].name}', a ${result.resources[0].machine_type}, for the job. (waiting: ${result.resources[0].stats.jobsWaiting} | running: ${result.resources[0].stats.jobsRunning}).`,LOG.LS.eSYS);
        return result;
    }
}

// TODO:
// 2. update where inspection is called to use this
// 3. if works, do same for scene generation