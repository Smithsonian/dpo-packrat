import { RecordKeeper as RK } from '../../records/recordKeeper';

describe('Utils: Email', () => {
    testSend();
});

async function testSend(): Promise<void> {

    test('Utils: Email.Send', async () => {

        let result = await RK.initialize(RK.SubSystem.NOTIFY_EMAIL);

        if(result.success) {
            result = await RK.emailTest(1);
            if (result.success) {
                RK.logInfo(RK.LogSection.eTEST,'send','success',{ ...result.data },'Tests.Utils.Email');
                expect(result.success).toBeTruthy();
            } else {
                // if we're not successful we check to see if we're outside the firewall testing (i.e. GitHub)
                // if so, we force success.
                const message: string = result.data?.error ?? result.data?.errors ?? result.message;
                console.log(message);
                if(message.includes('ENOTFOUND smtp.si.edu')) {
                    RK.logError(RK.LogSection.eTEST,'send','outside of firewall. cannot send email',{ ...result.data },'Tests.Utils.Email');
                    expect(true).toBeTruthy();
                    return;
                } else
                    RK.logError(RK.LogSection.eTEST,'send',result.message, result.data,'Tests.Utils.Email');
            }
        }

        RK.logDebug(RK.LogSection.eTEST,'EMAIL TEST RESULTS',result.message,result.data,'Tests.Utils.Email');
        expect(result.success).toBeTruthy();
    });
}