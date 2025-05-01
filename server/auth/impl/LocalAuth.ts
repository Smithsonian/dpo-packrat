import { IAuth, VerifyUserResult } from '../interface';

/**
 * Local authentication implementation. Does simple/naive comparison to check for
 * email and password are equal. Checking the user exists in the system is done
 * in AuthFactory so the email here needs to be a valid Packrat user email. For this
 * reason we simply return needed information to AuthFactory vs. logging here.
 */
class LocalAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifyUserResult> {
        if (password !== email) {
            // RK.logDebug(RK.LogSection.eAUTH,'verify user failed','invalid password',{ email },'LocalAuth');
            return { success: false, error: 'invalid password', data: { auth: 'local' } };
        }

        // RK.logDebug(RK.LogSection.eAUTH,'verify user success',undefined,{ email },'LocalAuth');
        return { success: true, data: { auth: 'local' } };
    }
}

export default LocalAuth;
