/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
import * as DBAPI from '../../db';

import GraphQLApi from '../../graphql';
import { GetSystemObjectDetailsInput, GetSystemObjectDetailsResult } from '../../types/graphql';

export async function routeRequest(request: Request, response: Response): Promise<void> {

    const detailsToReturn = request.params.id;
    console.warn(detailsToReturn+'|'+JSON.stringify(request.params));

    // if nothing then complain
    if(detailsToReturn===undefined) {
        LOG.error('HTTP request: incorrect usage of endpoint', LOG.LS.eHTTP);
        response.send('Request failed. Incorrect use of endpoint. Be sure to include what you are looking for');
        return;
    }

    // handle the proper type
    switch(detailsToReturn){
        case 'systemObject': {
            return await getSystemObjectDetails(request,response);
        } break;

        default: {
            LOG.error(`HTTP request: unsupported request (${detailsToReturn})`, LOG.LS.eHTTP);
            response.send(`Request failed. Unsupported request/path (${detailsToReturn})`);
        }
    }
}

// convenience routine routine for getting system object details to be used with routes.
// NOTE: not connected as it should not be 'live' until an API is created and protected
async function getSystemObjectDetails(req: Request, response: Response): Promise<void> {
    // TODO: update to use direct call to getSystemObjectDetails (db/api/schema/systemobject/resolvers/queries/...)

    // grab our config options from query params
    const subjectLimit: number = (req.query.limit)?parseInt(req.query.limit as string):10000;
    const systemObjectId: number = (req.query.objectId)?parseInt(req.query.objectId as string):-1;

    // fetch all subjects from Packrat DB to get list of IDs
    const systemObjects: DBAPI.SystemObject[] | null = await DBAPI.SystemObject.fetchAll(); /* istanbul ignore if */
    if (!systemObjects) {
        sendResponseMessage(response,false,'could not get system objects from DB');
        return;
    }
    if(systemObjects.length<=0) {
        sendResponseMessage(response,false,'no system objects found in DB');
        return;
    }
    LOG.info(`Getting SystemObject Details processing ${systemObjects.length} ids`,LOG.LS.eGQL);

    // loop through subjects, extract name, query from EDAN
    const output: string[] = [];
    for(let i=0; i<systemObjects.length; i++) {

        if(i>=subjectLimit) break;

        const idSystemObject: number = systemObjects[i].fetchID();
        if(systemObjectId>0 && idSystemObject!=systemObjectId) continue;

        const input: GetSystemObjectDetailsInput = {
            idSystemObject
        };
        const graphQLApi = new GraphQLApi(true);
        const results: GetSystemObjectDetailsResult = await graphQLApi.getSystemObjectDetails(input);

        // TODO: get asset details and inject into above results on 'asset' field
        //       getAssetDetailsForSystemObject()

        // store our results
        output.push(H.Helpers.JSONStringify(results));

        // break;
    }

    // if we return the file then do so, overwriting any message
    if(output.length>0) {
        const name = 'SystemObjectDetails_'+new Date().toISOString().split('T')[0];
        response.setHeader('Content-disposition', `attachment; filename=${name}.json`);
        response.set('Content-Type', 'text/json');
        response.statusMessage = 'Gathering system object details SUCCEEDED!';
        response.status(200).send(output.join('\n'));
        return;
    }

    const message = 'Getting system object details succeeded, but nothing to return.';
    LOG.info(message,LOG.LS.eGQL);
    sendResponseMessage(response,true,message);
    return;
}

function sendResponseMessage(response: Response, success: boolean, message: string) {
    LOG.error(`Getting data from database ${(success)?'SUCCEEDED':'FAILED'}: ${message}`, LOG.LS.eGQL);
    response.send(`Getting data from database ${(success)?'SUCCEEDED':'FAILED'}: ${message}`);
}