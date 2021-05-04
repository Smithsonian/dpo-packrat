/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAuth, VerifyUserResult } from '../interface';
import { Config, LDAPConfig } from '../../config';
import * as LOG from '../../utils/logger';
import * as LDAP from 'ldapjs';

type UserSearchResult = {
    success: boolean;
    error: string | null;
    DN: string | null;
};

class LDAPAuth implements IAuth {
    async verifyUser(email: string, password: string): Promise<VerifyUserResult> {
        const ldapConfig: LDAPConfig = Config.auth.ldap;

        // Step 1: Create a ldap client using server address
        const client: LDAP.Client = LDAP.createClient({
            url: ldapConfig.server
        });

        // this is needed to avoid nodejs crash of server when the LDAP connection is unavailable
        client.on('error', error => { LOG.error('LDAPAuth.verifyUser', LOG.LS.eAUTH, error); });

        // Step 2: Bind Packrat Service Account
        const res: VerifyUserResult = await this.bindService(client, ldapConfig);
        if (!res.success)
            return res;

        // Step 3: Search for passed user by email
        const resUserSearch: UserSearchResult = await this.searchForUser(client, ldapConfig, email);
        if (!resUserSearch.success|| !resUserSearch.DN)
            return resUserSearch;

        //Step 4: If user is found, bind on their credentials
        return await this.bindUser(client, resUserSearch.DN, email, password);
    }

    private async bindService(client: LDAP.Client, ldapConfig: LDAPConfig): Promise<VerifyUserResult> {
        let ldapBind: string = ldapConfig.CN;
        if (ldapBind)
            ldapBind += `,${ldapConfig.OU}`;
        if (ldapBind)
            ldapBind += `,${ldapConfig.DC}`;
        return new Promise<VerifyUserResult>(function(resolve) {
            client.bind(ldapBind, ldapConfig.password, (err: any): void => {
                if (err) {
                    LOG.error(`LDAPAuth.bindService failed: ${JSON.stringify(err)}`, LOG.LS.eAUTH);
                    resolve({ success: false, error: 'Unable to connect to LDAP server' });
                } else
                    resolve({ success: true, error: '' });
            });
        });
    }

    private async searchForUser(client: LDAP.Client, ldapConfig: LDAPConfig, email: string): Promise<UserSearchResult> {
        // LDAP Search Options
        const searchOptions: LDAP.SearchOptions = {
            scope: 'sub',
            filter: '(mail=' + email + ')', // (Searches on mail value)
            attributes: ['cn'] ,// return cn value
            sizeLimit: 1, // return only one result
            paged: true,
        };

        let searchComplete: boolean = false;

        return new Promise<UserSearchResult>(function(resolve) {
            client.search(ldapConfig.DC, searchOptions, (err: any, res: LDAP.SearchCallbackResponse): void => {
                if (err) {
                    const error: string = `Unable to locate ${email}`;
                    LOG.error(`LDAPAuth.searchForUser ${error}`, LOG.LS.eAUTH);
                    resolve({ success: false, error, DN: null });
                }

                res.on('searchEntry', (entry: any) => {
                    LOG.info(`LDAPAuth.searchForUser found ${email}: ${JSON.stringify(entry.objectName)}`, LOG.LS.eAUTH);
                    searchComplete = true;
                    resolve({ success: true, error: '', DN: entry.objectName });
                });

                res.on('error', (err: any) => {
                    err;
                    const error: string = `Unable to locate ${email}`;
                    LOG.error(`LDAPAuth.searchForUser ${error}`, LOG.LS.eAUTH);
                    resolve({ success: false, error, DN: null });
                });

                res.on('end', (result: any) => {
                    if (!searchComplete) {
                        result;
                        const error: string = `Unable to locate ${email}`;
                        LOG.error(`LDAPAuth.searchForUser ${error}`, LOG.LS.eAUTH);
                        resolve({ success: false, error, DN: null });
                    }
                });
            });
        });
    }

    private async bindUser(client: LDAP.Client, DN: string, email: string, password: string): Promise<VerifyUserResult> {
        return new Promise<VerifyUserResult>(function(resolve) {
            client.bind(DN, password, (err: any): void => {
                if (err) {
                    err;
                    const error: string = `Invalid password for ${email}`;
                    LOG.error(`LDAPAuth.bindUser ${error}`, LOG.LS.eAUTH);
                    resolve({ success: false, error });
                } else
                    resolve({ success: true, error: '' });
            });
        });
    }
}

export default LDAPAuth;
