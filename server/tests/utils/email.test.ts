import { Email } from '../../utils/email';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';

/*
afterAll(async done => {
    await H.Helpers.sleep(5000);
    done();
});
*/

describe('Utils: Email', () => {
    testSend('', '');
    // testSend('tysonj@si.edu', 'tysonj@si.edu');
    // testSend('tysonj@si.edu', 'jon.tyson@gmail.com');
    // testSend('tysonj@si.edu', 'jon@internetshoppingclub.com');
});

async function testSend(from: string, to: string): Promise<void> {
    const message: string = `${from} -> ${to}`;
    test('Utils: Email.Send', async () => {
        if (from === '' && to === '')
            return;

        const res: H.IOResults = await Email.Send(from, to, `Test ${message}`, message);
        if (res.success)
            LOG.info(`testSend ${message} Success`, LOG.LS.eTEST);
        else
            LOG.error(`testSend ${message} FAIL`, LOG.LS.eTEST);
        expect(res.success).toBeTruthy();
    });
}