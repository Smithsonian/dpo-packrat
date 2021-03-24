/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAuth, VerifiedUser } from '../interface';
import { Config, LDAPConfig } from '../../config';
import * as DBAPI from '../../db';
import * as LOG from '../../utils/logger';
import ldap = require('ldapjs');

class LDAPAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifiedUser> {
        const ldapConfig: LDAPConfig = Config.auth.ldap;
        let res: VerifiedUser = { user: null, error: null };

        //Step 1: Create a ldap client using server address
        const client = ldap.createClient({
            url: ldapConfig.server
        });

        //Step 2: Bind Packrat Service Account
        const serviceBind: Promise<void> = new Promise<void>(function (resolve, reject) {
            let ldapBind: string = ldapConfig.CN;
            if (ldapBind)
                ldapBind += `,${ldapConfig.OU}`;
            if (ldapBind)
                ldapBind += `,${ldapConfig.DC}`;
            client.bind(ldapBind, ldapConfig.password, (error: any): void => {
                if (error) {
                    LOG.logger.error(`LDAPAuth.verifyUser serviceBind failed: ${JSON.stringify(error)}`);
                    reject(error);
                } else
                    resolve();
            });
        });

        let failCheck: boolean = true;

        await serviceBind.catch((error: any) => {
            failCheck = false;
            res = { user: null, error };
        });

        serviceBind.then(() => {});

        if (!failCheck) {
            return res;
        }

        //LDAP Search Options
        const opts = {
            filter: '(mail=' + email + ')', // (Searches on mail value)
            scope: 'sub',
            paged: true,
            sizeLimit: 1, //return only one result
            attributes: ['cn'] //return cn value
        };

        let DN: string = ''; // DN used to bind user
        let searchComplete: boolean = false;

        //Step 3: Search for passed user by email
        const searchPromise: Promise<any> = new Promise<any>(function (resolve, reject) {
            client.search(ldapConfig.DC, opts, (error: any, res: any): void => {
                if (error)
                    LOG.logger.error(`LDAPAuth.verifyUser search failed: ${JSON.stringify(error)}`);

                res.on('searchEntry', (entry: any) => {
                    LOG.logger.info(`LDAPAuth.verifyUser search found user ${email}`);
                    searchComplete = true;
                    resolve(entry.objectName);
                });

                res.on('error', (error: any) => {
                    LOG.logger.error(`LDAPAuth.verifyUser search failed: ${JSON.stringify(error)}`);
                    reject(error);
                });

                res.on('end', (result: any) => {
                    if (!searchComplete) {
                        LOG.logger.error(`LDAPAuth.verifyUser search failed: ${JSON.stringify(result)}`);
                        reject(`User not found: ${email}`);
                    }
                });
            });
        });

        await searchPromise.catch((error: any) => {
            failCheck = false;
            res = { user: null, error };
        });

        if (!failCheck) {
            return res;
        }

        await searchPromise.then((response: any) => {
            DN = response;
            LOG.logger.info(`LDAPAuth.verifyUser userBind: ${JSON.stringify(DN)}`);
        });

        //Step 4: If user is found, bind on their credentials
        const userBind: Promise<void> = new Promise<void>(function (resolve, reject) {
            client.bind(DN, password, (error: any): void => {
                if (error) {
                    LOG.logger.error(`LDAPAuth.verifyUser userBind failed: ${JSON.stringify(error)}`);
                    reject(error);
                } else
                    resolve();
            });
        });

        await userBind.catch((error: any) => {
            failCheck = false;
            res = { user: null, error };
        });

        if (!failCheck)
            return { user: null, error: `Invalid password for ${email}` };

        await userBind.then(async () => {
            const users: DBAPI.User[] | null = await DBAPI.User.fetchByEmail(email);
            const user: DBAPI.User | null = (users && users.length == 1) ? users[0] : null;
            if (!user) {
                const error: string = `${email} is not a Packrat user`;
                LOG.logger.error(`LDAPAuth.verifyUser: ${error}`);
                res = { user: null, error };
            } else if (!user.Active) {
                const error: string = `${email} is not active in Packrat`;
                LOG.logger.info(`LocalAuth.verifyUser: ${error}`);
                res = { user: null, error };
            } else {
                LOG.logger.info(`LDAPAuth.verifyUser ${email} successfully authenticated`);
                res = { user, error: null };
            }
        });

        return res;
    }
}

export default LDAPAuth;
