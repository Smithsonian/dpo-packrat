import { IAuth, VerifyUserResult } from './IAuth';
import { LocalAuth, LDAPAuth } from '../impl';
import { Config, AUTH_TYPE } from '../../config';
import { ASL, LocalStore } from '../../utils/localStore';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';

export type VerifiedUser = {
    user: DBAPI.User | null;
    error?: string | null;
};

class AuthFactory {
    private static instance: LocalAuth | LDAPAuth;

    static getInstance(): LocalAuth | LDAPAuth {
        if (!AuthFactory.instance) {
            if (Config.auth.type === AUTH_TYPE.LOCAL) {
                AuthFactory.instance = new LocalAuth();
            } else if (Config.auth.type === AUTH_TYPE.LDAP) {
                AuthFactory.instance = new LDAPAuth();
            }
        }
        return AuthFactory.instance;
    }

    static async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        LOG.info(`AuthFactory.verifyUser verifying... ${email}`,LOG.LS.eAUTH);

        const auth: IAuth = AuthFactory.getInstance();
        const verifyRes: VerifyUserResult = await auth.verifyUser(email, password);
        if (!verifyRes.success) {
            AuditFactory.audit({ email, error: verifyRes.error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            return { user: null, error: verifyRes.error };
        }

        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(email);
        if (!users || users.length == 0) {
            const error: string = `${email} is not a Packrat user`;
            AuditFactory.audit({ email, error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            LOG.error(`AuthFactory.verifyUser: ${error}`, LOG.LS.eAUTH);
            return { user: null, error };
        }

        if (users.length > 1) {
            const error: string = `Multiple users exist for ${email}`;
            AuditFactory.audit({ email, error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            LOG.error(`AuthFactory.verifyUser: ${error}`, LOG.LS.eAUTH);
            return { user: null, error };
        }

        const user: DBAPI.User = users[0];
        if (!user.Active) {
            const error: string = `${email} is not active in Packrat`;
            AuditFactory.audit({ email, error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            LOG.info(`AuthFactory.verifyUser: ${error}`, LOG.LS.eAUTH);
            return { user: null, error };
        }

        // record user in local storage:
        const LS: LocalStore = await ASL.getOrCreateStore();
        LS.idUser = user.idUser;

        LOG.info(`AuthFactory.verifyUser ${email} successfully authenticated`, LOG.LS.eAUTH);
        AuditFactory.audit({ email }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthLogin);

        return { user };
    }
}

export default AuthFactory;
