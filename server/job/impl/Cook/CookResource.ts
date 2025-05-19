/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from 'axios';
import * as DBAPI from '../../../db';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

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
            RK.logError(RK.LogSection.eSYS,'get resource status failed',errorMessage,{ address, attempt, endpoint },'CookResource');

            if (attempt === maxRetries || !errorMessage.includes('getaddrinfo EAI_AGAIN'))
                return { success: false, error: errorMessage, address };

            // Wait for a short delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { success: false, error: (error.message)?error.message:JSON.stringify(error), address, };
        }
    }

    // if all retries failed, return failed state
    RK.logError(RK.LogSection.eSYS,'max retries reached','',{ address },'CookResource');
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
            RK.logError(RK.LogSection.eSYS,'verify resource compatability failed','unsupported job type',{ job, ...resource },'CookResource');
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
        RK.logError(RK.LogSection.eSYS,'get job type failed','encountered unexpected input format',{ cookJobName },'CookResource');
        return;
    }

    switch(parts[0]) {
        case 'inspect-mesh':
        case 'si-packrat-inspect': return 'inspect';

        case 'si-vogager-scene':
        case 'si-voyager-scene': return 'scene_generation';

        case 'si-generate-downloads': return 'generate_downloads';

        default:{
            RK.logError(RK.LogSection.eSYS,'get job type failed','encountered unsupported input format',{ cookJobName, parts },'CookResource');
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
            RK.logCritical(RK.LogSection.eSYS,'get resource failed','no resources found in the database',{ job, source, includeAll },'CookResource');
            return createResultError('Cannot find a Cook resource in the database. Contact Packrat support.');
        }

        // cycle filter list of resources based on supported features
        RK.logDebug(RK.LogSection.eSYS,'checking resource','checking availability',{ job, source: source ?? 'internal' },'CookResource');

        const cookResourceResults: CookResourceState[] = [];
        for(let i=0; i<cookResources.length; i++) {

            // make sure the resource supports the job type
            const supportWeight: number = verifyCookResourceCapability(job,cookResources[i]);
            if(supportWeight <= 0) {
                RK.logDebug(RK.LogSection.eSYS,'get resource','skipping resource. unsupported job type',{ name: cookResources[i].Name, job, source },'CookResource');
                continue;
            }

            // otherwise get its status and wait for it
            // OPT: fire each off without waiting, but wait outside the loop for concurrency
            const result: CookResourceState = await getCookResourceStatus(cookResources[i].Address,cookResources[i].Port);
            if(result.success===true) {
                result.weight = supportWeight;
                cookResourceResults.push(result);
            } else {
                RK.logDebug(RK.LogSection.eSYS,'get resource',`skipping resource. ${result.error}`,{ name: cookResources[i].Name, job, source },'CookResource');
            }
        }

        // if we're empty, bail
        if(cookResourceResults.length<=0) {
            RK.logError(RK.LogSection.eSYS,'get resource failed','cannot find suitable resource for job',{ job, source },'CookResource');
            return createResultError(`Could not find a suitable resource for a ${job} job. (${cookResources.length} resources checked)`);
        }

        // sort list based on capabilities
        cookResourceResults.sort((a, b) => {
            if(a.weight == undefined || b.weight == undefined ||
               a.jobsWaiting == undefined || b.jobsWaiting == undefined ||
               a.jobsRunning == undefined || b.jobsRunning == undefined ||
               a.jobsCreated == undefined || b.jobsCreated == undefined) {
                RK.logError(RK.LogSection.eSYS,'get resource failed','cannot sort resources. resources have undefined properties.',{ job, source, resourceA: a, resourceB: b },'CookResource');
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
                RK.logDebug(RK.LogSection.eSYS,'get resource','cannot find a matching resource in original array. skipping',{ cookResource: cookResourceResults[i].address, job, source },'CookResource');
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
            RK.logError(RK.LogSection.eSYS,'get resource failed','cannot find any suitable resources',{ job, source, numResources: cookResources.length },'CookResource');
            return createResultError(`Could not find a matching resource. notify Packrat support. (${cookResources.length} resources checked)`);
        }

        // status messgae
        RK.logInfo(RK.LogSection.eSYS,'found available resource',undefined,{ resource: result.resources[0], job, source, numResources: cookResources.length },'CookResource');
        return result;
    }
}