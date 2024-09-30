import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export const play = async (_req: Request, res: Response): Promise<void> => {

    RK.configure(); // 'D:\\Temp\\PackratTemp\\Logs'

    // test our logging
    const numLogs: number = 10000;
    const result = await RK.logTest(numLogs);

    // return our results
    res.status(200).send(H.Helpers.JSONStringify({ message: result.error }));
};