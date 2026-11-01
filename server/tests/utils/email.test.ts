import { RecordKeeper as RK } from '../../records/recordKeeper';

// SKIP_REASON: live SMTP. This test initializes the email subsystem and sends to
// smtp.si.edu, which opens a socket that is never closed — it blocks a clean jest
// exit (the reason the suite needed --forceExit) and is off-network in CI (where it
// "passed" by string-matching a DNS error). Opt-in only via PACKRAT_TEST_EMAIL=1.
// (Audit A2: de-network/mock this path; the hardcoded-SMTP path may be dead.)
const EMAIL_TESTS: boolean = process.env.PACKRAT_TEST_EMAIL === '1';

(EMAIL_TESTS ? describe : describe.skip)('Utils: Email', () => {
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
                const validError: boolean = result.data?.errors?.some(error => error.includes('ENOTFOUND smtp.si.edu')) ?? false;
                if(validError) {
                    RK.logWarning(RK.LogSection.eTEST,'send','outside of firewall. cannot send email. passing test...',{},'Tests.Utils.Email');
                    expect(true).toBeTruthy();
                    return;
                } else
                    RK.logError(RK.LogSection.eTEST,'send',result.message, result.data,'Tests.Utils.Email');
            }
        }

        expect(result.success).toBeTruthy();
    });
}