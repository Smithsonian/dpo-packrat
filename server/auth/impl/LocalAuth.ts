import { IAuth, VerifyUserResult } from '../interface';
import { RecordKeeper as RK } from '../../records/recordKeeper';

class LocalAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifyUserResult> {
        if (password !== email) {
            RK.logDebug(RK.LogSection.eAUTH,'verify user failed','invalid password',{ email },'LocalAuth');
            return { success: false, error: 'Invalid password for user' };
        }

        RK.logDebug(RK.LogSection.eAUTH,'verify user success',undefined,{ email },'LocalAuth');
        return { success: true };
    }
}

export default LocalAuth;
