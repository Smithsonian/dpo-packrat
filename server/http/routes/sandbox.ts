import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export const play = async (req: Request, res: Response): Promise<void> => {

    RK.configure('D:\\Temp\\PackratTemp\\Logs');

    // test our logging
    RK.logInfo(RK.LogSection.eNONE,'Some generic message with no data',null,'API.sandbox.play');
    RK.logInfo(RK.LogSection.eNONE,`Request data: ${req.url}`,{ data: 'yup',status: 'who knows' },'API.sandbox.play');

    RK.logError(RK.LogSection.eNONE,'Some error message','it all failed!','API.sandbox.play');

    res.status(200).send(H.Helpers.JSONStringify({ message: 'Some status message in response' }));
};