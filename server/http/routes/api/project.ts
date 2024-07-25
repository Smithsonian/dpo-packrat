/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { ASL, LocalStore } from '../../../utils/localStore';

// import { eEventKey } from '../../../event/interface/EventEnums';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { isAuthenticated } from '../../auth';

import { Request, Response } from 'express';
// import { WorkflowFactory, IWorkflowEngine, WorkflowCreateResult, WorkflowParameters } from '../../../workflow/interface';

// enum PublishedState {
//     UNDEFINED = -1,
//     UNPUBLISHED = 0,
//     INTERNAL = 1,
//     API_ONLY = 2,
//     PUBLIC = 3,
// }
// enum DataType {
//     UNDEFINED = -1,
//     PROJECT = 0,
//     MEDIAGROUP = 1,
//     SCENE = 2,
//     MODEL = 3,
// }
// enum Operation {
//     UNDEFINED = -1,
//     GET_LIST = 0,
//     GET_DETAILS = 1,
//     GET_SCENES = 10,
// }

// type SummaryScene = {
//     hasDownloads: boolean,
//     isQC: boolean,
//     published: PublishedState,
//     modified: Date,
//     downloads

// };
// type SummaryModel = {
//     hasScene: boolean,
// };
// type SummaryMediaGroup = {
//     name: string,
//     project: { id: number, name: string },
//     scenes: SummaryScene[],
//     models: SummaryModel[],
// };
// type SummarySubject = {
//     name: string,
//     unit: { id: number, name: string },
//     items: SummaryMediaGroup[],
// };
type ProjectResponse = {
    success: boolean,           // was the request successful
    message?: string,           // errors from the request|workflow to put in console or display to user
    // dataType?: DataType,        // what to expect in 'data'
    data? //ummarySubject | SummaryMediaGroup | SummaryScene
};

const generateResponse = (success: boolean, message?: string | undefined, data?): ProjectResponse => {
    return {
        success,
        message,
        data
    };
};

const isAuthorized = async (req: Request): Promise<H.IOResults> => {

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    if (!isAuthenticated(req)) {
        LOG.error('API.getSummary failed. not authenticated.', LOG.LS.eHTTP);
        return { success: false, error: 'not authenticated' };
    }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    const LS: LocalStore | undefined = ASL.getStore();
    if(!LS || !LS.idUser){
        LOG.error('API.getSummary failed. cannot get LocalStore or idUser',LOG.LS.eHTTP);
        return { success: false, error: `missing local store/user (${LS?.idUser})` };
    }

    // make sure we're of specific class of user (e.g. admin)
    const authorizedUsers: number[] = [
        2,  // Jon Blundell
        4,  // Jamie Cope
        5   // Eric Maslowski
    ];
    if(!authorizedUsers.includes(LS.idUser)) {
        LOG.error(`API.getProjects failed. user is not authorized for this request (${LS.idUser})`,LOG.LS.eHTTP);
        return { success: false, error: `user (${LS.idUser}) does not have permission.` };
    }

    return { success: true };
};

export async function getProjects(req: Request, res: Response): Promise<void> {
    // LOG.info('Generating Downloads from API request...', LOG.LS.eHTTP);

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getProjects: ${authResult.error}`)));
        return;
    }

    // get our list of projects from the DB
    const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();
    if(!projects || projects.length===0) {
        const error = `no projects found ${!projects ? '(is NULL)':''}`;
        LOG.error(`API.getProject failed. ${error}`, LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false,`getProjects: ${error}`)));
        return;
    }

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${projects.length} projects`,[...projects])));
}

type DBReference = {
    id: number,     // system object id
    name: string,   // name of object
};
type ProjectScene = DBReference & {
    project: DBReference,
    subject: DBReference,
    mediaGroup: DBReference,
    // idScene: number,
    // name: string,
    dateCreated: Date,
    hasDownloads: boolean,
    dateGenDownloads: Date,
    isPublished: boolean,
    datePublished: Date,
    isReviewed: boolean
};

export async function getProjectScenes(req: Request, res: Response): Promise<void> {

    // make sure we're authorized to run this routine
    const authResult = await isAuthorized(req);
    if(authResult.success===false) {
        res.status(200).send(JSON.stringify(generateResponse(false,`getProjectScenes: ${authResult.error}`)));
        return;
    }

    // get our project id from our params
    const { id } = req.params;
    console.log(`>>> get project scenes: ${id}`);

    // HACK: placeholder data
    const scenes: ProjectScene[] = [
        {
            project: { id: 1, name: 'Project Apollo' },
            subject: { id: 1, name: 'Lunar Module' },
            mediaGroup: { id: 1, name: 'Moon Landing' },
            id: 101,
            name: 'Eagle Has Landed',
            dateCreated: new Date('2024-01-15'),
            hasDownloads: true,
            dateGenDownloads: new Date('2024-01-20'),
            isPublished: true,
            datePublished: new Date('2024-01-25'),
            isReviewed: true
        },
        {
            project: { id: 2, name: 'Project Voyager' },
            subject: { id: 2, name: 'Voyager 1' },
            mediaGroup: { id: 2, name: 'Outer Solar System' },
            id: 102,
            name: 'Journey to Jupiter',
            dateCreated: new Date('2024-02-10'),
            hasDownloads: false,
            dateGenDownloads: new Date('2024-02-15'),
            isPublished: false,
            datePublished: new Date('2024-02-20'),
            isReviewed: false
        },
        {
            project: { id: 3, name: 'Project Mars' },
            subject: { id: 3, name: 'Rover Curiosity' },
            mediaGroup: { id: 3, name: 'Mars Exploration' },
            id: 103,
            name: 'Martian Landscape',
            dateCreated: new Date('2024-03-05'),
            hasDownloads: true,
            dateGenDownloads: new Date('2024-03-10'),
            isPublished: true,
            datePublished: new Date('2024-03-15'),
            isReviewed: true
        },
        {
            project: { id: 4, name: 'Project Neptune' },
            subject: { id: 4, name: 'Deep Sea Probe' },
            mediaGroup: { id: 4, name: 'Oceanic Research' },
            id: 104,
            name: 'Into the Abyss',
            dateCreated: new Date('2024-04-01'),
            hasDownloads: false,
            dateGenDownloads: new Date('2024-04-05'),
            isPublished: false,
            datePublished: new Date('2024-04-10'),
            isReviewed: false
        },
        {
            project: { id: 5, name: 'Project Gaia' },
            subject: { id: 5, name: 'Earth Observation' },
            mediaGroup: { id: 5, name: 'Global Monitoring' },
            id: 105,
            name: 'Blue Marble',
            dateCreated: new Date('2024-05-15'),
            hasDownloads: true,
            dateGenDownloads: new Date('2024-05-20'),
            isPublished: true,
            datePublished: new Date('2024-05-25'),
            isReviewed: true
        },
        {
            project: { id: 6, name: 'Project Titan' },
            subject: { id: 6, name: 'Saturn\'s Moon' },
            mediaGroup: { id: 6, name: 'Space Missions' },
            id: 106,
            name: 'Ringed Giant',
            dateCreated: new Date('2024-06-10'),
            hasDownloads: false,
            dateGenDownloads: new Date('2024-06-15'),
            isPublished: false,
            datePublished: new Date('2024-06-20'),
            isReviewed: false
        },
        {
            project: { id: 7, name: 'Project Orion' },
            subject: { id: 7, name: 'Deep Space Mission' },
            mediaGroup: { id: 7, name: 'Future Exploration' },
            id: 107,
            name: 'Beyond the Stars',
            dateCreated: new Date('2024-07-05'),
            hasDownloads: true,
            dateGenDownloads: new Date('2024-07-10'),
            isPublished: true,
            datePublished: new Date('2024-07-15'),
            isReviewed: true
        },
        {
            project: { id: 8, name: 'Project Horizon' },
            subject: { id: 8, name: 'Space Telescope' },
            mediaGroup: { id: 8, name: 'Astronomical Observations' },
            id: 108,
            name: 'Galactic Views',
            dateCreated: new Date('2024-08-01'),
            hasDownloads: false,
            dateGenDownloads: new Date('2024-08-05'),
            isPublished: false,
            datePublished: new Date('2024-08-10'),
            isReviewed: false
        },
        {
            project: { id: 9, name: 'Project Phoenix' },
            subject: { id: 9, name: 'Asteroid Mining' },
            mediaGroup: { id: 9, name: 'Resource Acquisition' },
            id: 109,
            name: 'Mining the Stars',
            dateCreated: new Date('2024-09-15'),
            hasDownloads: true,
            dateGenDownloads: new Date('2024-09-20'),
            isPublished: true,
            datePublished: new Date('2024-09-25'),
            isReviewed: true
        },
        {
            project: { id: 10, name: 'Project Infinity' },
            subject: { id: 10, name: 'Quantum Research' },
            mediaGroup: { id: 10, name: 'Advanced Physics' },
            id: 110,
            name: 'Quantum Leap',
            dateCreated: new Date('2024-10-10'),
            hasDownloads: false,
            dateGenDownloads: new Date('2024-10-15'),
            isPublished: false,
            datePublished: new Date('2024-10-20'),
            isReviewed: false
        }
    ];

    // return success
    res.status(200).send(JSON.stringify(generateResponse(true,`Returned ${scenes.length} scenes`,[...scenes])));
}