/* eslint-disable @typescript-eslint/no-explicit-any */
// import * as LOG from '../../../utils/logger';
// import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
// import * as COMMON from '@dpo-packrat/common';
// import * as COL from '../../../collections/interface';
// import { ASL, LocalStore } from '../../../utils/localStore';

// import { eEventKey } from '../../../event/interface/EventEnums';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
// import { isAuthenticated } from '../../auth';

import { Request, Response } from 'express';

enum ReportType {
    ASSET_FILE = 'asset_file',
    SCENE_STATUS = 'scene_status',
};

// type OpResponse = {             // matches the expected returns on the client side and summarizes the request/responses
//     success: boolean,
//     message?: string,
//     data?: ReportResponse[]
// };
type ReportResponse = {
    guid: string,
    state: H.ProcessState,
    type: ReportType,
    user: { id: number, name: string, email: string },
    report: any,
};

// const generateResponse = (success: boolean, message?: string | undefined, id?: number | undefined, state?: string | undefined): ReportResponse => {
//     return {
//         success,
//         message,
//         id,
//         state
//     };
// };

export async function reportAssetFiles(_req: Request, res: Response): Promise<void> {

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    // if (!isAuthenticated(req)) {
    //     AuditFactory.audit({ url: req.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eGenDownloads);
    //     LOG.error('API.generateDownloads failed. not authenticated.', LOG.LS.eHTTP);
    //     res.status(403).send('no authenticated');
    //     return;
    // }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    // const LS: LocalStore | undefined = ASL.getStore();
    // if(!LS || !LS.idUser){
    //     LOG.error('API.generateDownloads failed. cannot get LocalStore or idUser',LOG.LS.eHTTP);
    //     res.status(200).send(JSON.stringify(generateResponse(false,'missing store/user')));
    //     return;
    // }

    const result: ReportResponse = {
        guid: 'jsddf-d8438-jsd88-djsid',
        state: H.ProcessState.COMPLETED,
        user: { id: -1, name: 'N/A', email: 'N/A' },
        type: ReportType.ASSET_FILE,
        report: undefined
    };
    
    // create our combined response and return info to client
    res.status(200).send(JSON.stringify({ success: true, message: 'report generated successfully', data: result }));
}
