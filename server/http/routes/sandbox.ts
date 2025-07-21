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
    // const result = await RK.emailTest(5);


    //#region SLACK
    // clear out channels (may require multiple runs)
    // RK.clearSlackChannel(RK.SlackChannel.PACKRAT_OPS,true);
    RK.clearSlackChannel(RK.SlackChannel.PACKRAT_DEV,true);
    // RK.clearSlackChannel(RK.SlackChannel.PACKRAT_SYSTEM,true);

    // test routine
    // const result = await RK.slackTest(10,true,RK.SlackChannel.PACKRAT_DEV);

    // individual message
    const result = await RK.sendSlack(RK.NotifyType.JOB_FAILED,
        RK.NotifyGroup.USER,
        'Cook Inspection Failed for: Whale Bowl (Test User)',
        'Some description of the error message',
        RK.SlackChannel.PACKRAT_DEV,
        new Date(),
    );
    //#endregion

    // const result = 'done';

    // return our results
    res.status(200).send(H.Helpers.JSONStringify(result));
};