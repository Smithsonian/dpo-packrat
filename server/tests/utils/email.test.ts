import { RecordKeeper as RK } from '../../records/recordKeeper';

describe('Utils: Email', () => {
    testSend();
});

async function testSend(): Promise<void> {

    test('Utils: Email.Send', async () => {

        const res = await RK.emailTest(1);
        if (res.success)
            RK.logInfo(RK.LogSection.eTEST,'send','success',{ ...res.data },'Tests.Utils.Email');
        else
            RK.logError(RK.LogSection.eTEST,'send',res.message,{ ...res.data },'Tests.Utils.Email');
        expect(res.success).toBeTruthy();
    });
}