import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export const play = async (_req: Request, res: Response): Promise<void> => {

    await RK.initialize(RK.SubSystem.LOGGER);
    await RK.initialize(RK.SubSystem.NOTIFY_EMAIL);
    await RK.initialize(RK.SubSystem.NOTIFY_SLACK);

    // test our logging
    // const numLogs: number = 1000;
    // const result = await RK.logTest(numLogs);

    // test email notifications
    const result = await RK.emailTest(5);

    // test slack notifications
    // const result = await RK.slackTest(1,true,RK.SlackChannel.PACKRAT_OPS);

    // return our results
    res.status(200).send(H.Helpers.JSONStringify(result));
};