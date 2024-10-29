import { Request, Response } from 'express';
import * as H from '../../utils/helpers';
import { RecordKeeper } from '../../records/recordKeeper';

export const play = async (req: Request, res: Response): Promise<void> => {

    // await RecordKeeper.initialize();

    // get what we are testing
    let test: string = 'log';
    if(req.query.test) {
        switch(req.query.test) {
            case 'log':
            case 'email':
            case 'slack':
                test = req.query.test;
        }
    }

    // get number of messages to test
    let numMessages: number = 10;
    if (req.query.count) {
        const parsedCount = Number.parseInt(req.query.count as string, 10);
        numMessages = !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : numMessages;
    }

    // get our test method
    let method: H.TestMethod | undefined = undefined;
    if(req.query.method) {
        switch(req.query.method) {
            case 'consistency': method = H.TestMethod.CONSISTENCY; break;
            case 'throughput':  method = H.TestMethod.THROUGHPUT; break;
        }
    }
    console.log(req.query.method);

    // test the desired system
    let result;
    switch(test) {
        case 'log': {
            // test our logging
            result = await RecordKeeper.logTest(numMessages, method);
        } break;
        case 'email': {
            //test email notifications
            result = await RecordKeeper.emailTest(numMessages);
        } break;
        case 'slack': {
            // test slack notifications
            result = await RecordKeeper.slackTest(numMessages,true,RecordKeeper.SlackChannel.PACKRAT_OPS);
        } break;
    }

    // return our results
    res.status(200).send(H.Helpers.JSONStringify(result));
};