import * as LOG from '../../utils/logger';
import { IAuth, VerifyUserResult } from '../interface';

class LocalAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifyUserResult> {
        if (password !== email) {
            LOG.error(`LocalAuth.verifyUser invalid password for ${email}`, LOG.LS.eAUTH);
            return { success: false, error: 'Invalid password for user' };
        }

        LOG.info(`LocalAuth.verifyUser successful login for ${email}`, LOG.LS.eAUTH);
        return { success: true, error: null };
    }
}

export default LocalAuth;
