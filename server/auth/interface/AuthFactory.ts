import { IAuth, VerifyUserResult } from './IAuth';
import { LocalAuth, LDAPAuth } from '../impl';
import { Config, AUTH_TYPE } from '../../config';
import { ASL, LocalStore } from '../../utils/localStore';
import * as DBAPI from '../../db';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { RecordKeeper as RK } from '../../records/recordKeeper';

/**
 * Factory pattern for creating IAuth implementation currently using Local or LDAPS.
 * 'verifyUser' on the created instance handles authentication.
 */
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

        const auth: IAuth = AuthFactory.getInstance();
        const verifyRes: VerifyUserResult = await auth.verifyUser(email, password);
        if (!verifyRes.success) {
            AuditFactory.audit({ email, error: verifyRes.error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            RK.logError(RK.LogSection.eAUTH,'user login failed',verifyRes.error ?? 'undefined',{ email, ...verifyRes.data },'Auth.Factory',true);
            return { user: null, error: verifyRes.error };
        }

        // make sure our user is in our list of users
        const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(email);
        if (!users || users.length == 0) {
            const error: string = `${email} is not a Packrat user`;
            AuditFactory.audit({ email, error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            RK.logError(RK.LogSection.eAUTH,'user login failed','not a Packrat user',{ email, ...verifyRes.data },'Auth.Factory',true);
            return { user: null, error };
        }

        // if there's more than one user for the email, we have a problem and we should block
        if (users.length > 1) {
            const error: string = `Multiple users exist for ${email}`;
            AuditFactory.audit({ email, error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            RK.logError(RK.LogSection.eAUTH,'user login failed','multiple users exist',{ email, ...verifyRes.data },'Auth.Factory',true);
            return { user: null, error };
        }

        // make sure the user account is actually active
        const user: DBAPI.User = users[0];
        if (!user.Active) {
            const error: string = `${email} is not active in Packrat`;
            AuditFactory.audit({ email, error }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthFailed);
            RK.logError(RK.LogSection.eAUTH,'user login failed','user account disabled',{ id: user.idUser, name: user.Name, email, ...verifyRes.data },'Auth.Factory',true);
            return { user: null, error };
        }

        // record user in local storage:
        const LS: LocalStore = await ASL.getOrCreateStore();
        LS.idUser = user.idUser;

        RK.logInfo(RK.LogSection.eAUTH,'user login success',undefined,{ id: user.idUser, name: user.Name, email, ...verifyRes.data },'Auth.Factory');
        AuditFactory.audit({ email }, { eObjectType: 0, idObject: 0 }, eEventKey.eAuthLogin);

        return { user };
    }
}

export default AuthFactory;
