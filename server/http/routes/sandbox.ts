import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export const play = async (_req: Request, res: Response): Promise<void> => {

    await RK.configure();

    // test our logging
    const numLogs: number = 10;
    const result = await RK.logTest(numLogs);

    // test email notifications
    // const result = await RK.emailTest();

    // return our results
    res.status(200).send(H.Helpers.JSONStringify(result));
};