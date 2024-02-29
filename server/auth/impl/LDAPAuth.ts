/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAuth, VerifyUserResult } from '../interface';
import { Config, /*ENVIRONMENT_TYPE,*/ LDAPConfig } from '../../config';
import * as H from '../../utils/helpers';
import * as LOG from '../../utils/logger';
import * as LDAP from 'ldapjs';
import os from 'os';
import fs from 'fs';

type UserSearchResult = {
    success: boolean;
    error?: string | null;
    DN: string | null;
};

class LDAPAuth implements IAuth {
    private _ldapConfig: LDAPConfig = Config.auth.ldap;
    private _client: LDAP.Client | null = null;
    async verifyUser(email: string, password: string): Promise<VerifyUserResult> {
        LOG.info(`LDAPAuth.verifyUser verifying: ${email}`,LOG.LS.eDEBUG);
        try {
            let res: VerifyUserResult = await this.fetchClient();
            if (!res.success) {
                LOG.error(`LDAPAuth.verifyUser: ${res.error}`, LOG.LS.eAUTH);
                return res;
            }

            // Step 2: Bind Packrat Service Account
            res = await this.bindService();
            if (!res.success)
                return res;

            // Step 3: Search for passed user by email
            const resUserSearch: UserSearchResult = await this.searchForUser(this._ldapConfig, email);
            if (!resUserSearch.success|| !resUserSearch.DN)
                return resUserSearch;

            //Step 4: If user is found, bind on their credentials
            return await this.bindUser(resUserSearch.DN, email, password);
        } catch (error) {
            LOG.error('LDAPAuth.verifyUser', LOG.LS.eAUTH, error);
            return { success: false, error: JSON.stringify(error) };
        }
    }

    private async fetchClient(): Promise<VerifyUserResult> {
        LOG.info(`LDAPAuth.fetchClient entry for client (hasClient: ${this._client==null?false:true}).`, LOG.LS.eDEBUG);

        // if we already have a client destroy it as it hangs with LDAPS requests
        // this appears to be tied to required certificates.
        if (this._client)
            this.destroyClient();
            // return { success: true };

        LOG.info(`Auth connecting to ${this._ldapConfig.server} for LDAP authentication on ${os.type()}.`, LOG.LS.eAUTH);
        LOG.info(`LDAPAuth.fetchClient (working directory: ${__dirname} | system: ${Config.environment.type} | ca: ${this._ldapConfig.CA} | cert_exists: ${fs.existsSync(this._ldapConfig.CA)}`,LOG.LS.eDEBUG);

        // setup our client configuration for TLS/LDAPS
        const clientConfig: any = {
            url: this._ldapConfig.server,
            tlsOptions:  { rejectUnauthorized: true, } // set to false for self-signed certificates (development only)
        };

        // Windows desktops have a trusted US domain cert already installed because it is joined to the US domain
        // Linux does not because it's not part of the US domain so we have to point to a certificate
        //
        // if we're in production environment on Linux (the server) add our certificate path
        // note: path is relative to the container NOT system
        process.env.NODE_EXTRA_CA_CERTS = this._ldapConfig.CA;
        // if(Config.environment.type==ENVIRONMENT_TYPE.PRODUCTION && os.type().toLowerCase()=='linux' && fs.existsSync(this._ldapConfig.CA)==true)
        //     clientConfig.tlsOptions.ca = [ fs.readFileSync(this._ldapConfig.CA) ];
        // else
        //     LOG.info(`LDAPAuth.fetchClient skipping explicit SSL certificate (env:${Config.environment.type} | os:${os.type()} | ca:${this._ldapConfig.CA} = ${fs.existsSync(this._ldapConfig.CA)} )`, LOG.LS.eAUTH);

        // Step 1: Create a ldap client using our config
        LOG.info(`>>> LDAPAuth.fetchClient creating client: ${H.Helpers.JSONStringify(clientConfig)}`,LOG.LS.eDEBUG);
        this._client = LDAP.createClient(clientConfig);
        LOG.info(`>>> post createClient (connected: ${this._client.connected})`,LOG.LS.eDEBUG);

        // this is needed to avoid nodejs crash of server when the LDAP connection is unavailable
        this._client.on('error', error => {
            const errorMessage: string | undefined = (error instanceof Error) ? error.message : undefined;
            if (errorMessage && errorMessage.includes('ECONNRESET'))
                LOG.info('LDAPAuth.fetchClient ECONNRESET; destroying old LDAP client', LOG.LS.eAUTH);
            else
                LOG.error('LDAPAuth.fetchClient', LOG.LS.eAUTH, error);

            this.destroyClient();
        });

        // catching other events from the client
        this._client.on('connectRefused', msg => { LOG.error(`LDAPAuth.fetchClient connection refused (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eAUTH); this.destroyClient(); });
        this._client.on('connectTimeout', msg => { LOG.error(`LDAPAuth.fetchClient server timed out (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eAUTH); this.destroyClient(); });
        this._client.on('connectError', msg => { LOG.error(`LDAPAuth.fetchClient socket connection error (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eAUTH); this.destroyClient(); });
        this._client.on('setupError', msg => { LOG.error(`LDAPAuth.fetchClient setup error after successful connection (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eAUTH); this.destroyClient(); });
        this._client.on('socketTimeout', msg => { LOG.error(`LDAPAuth.fetchClient socket timed out (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eAUTH); this.destroyClient(); });
        this._client.on('destroy', msg => { LOG.info(`LDAPAuth.fetchClient connection destroyed (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eDEBUG); });
        this._client.on('end', msg => { LOG.info(`LDAPAuth.fetchClient socket end event (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eDEBUG); });
        this._client.on('close', msg => { LOG.info(`LDAPAuth.fetchClient socket closed (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eDEBUG); });
        this._client.on('connect', msg => { LOG.info(`LDAPAuth.fetchClient client connected (${H.Helpers.JSONStringify(msg)})`,LOG.LS.eAUTH); });

        // return success regardless
        // TODO: wait for finish (end event?) before returning so we block and ensure system doesn't progress without knowing.
        return { success: true };
    }

    private destroyClient() {
        if(this._client) {
            LOG.info('LDAPAuth.destroyClient destroying LDAPS client...',LOG.LS.eAUTH);
            this._client.destroy();
            this._client = null;
        }
    }

    private async bindService(): Promise<VerifyUserResult> {
        if (!this._client)
            return { success: false, error: 'LDAPClient is null' };

        let ldapBind: string = this._ldapConfig.CN; // username
        if (ldapBind)
            ldapBind += `,${this._ldapConfig.OU}`; // access vectors
        if (ldapBind)
            ldapBind += `,${this._ldapConfig.DC}`; // domain control

        const client: LDAP.Client = this._client;
        const password: string = this._ldapConfig.password;
        return new Promise<VerifyUserResult>(function(resolve) {
            client.bind(ldapBind, password, (err: any): void => {
                if (err) {
                    LOG.error(`LDAPAuth.bindService failed: ${JSON.stringify(err)}`, LOG.LS.eAUTH);
                    resolve({ success: false, error: 'Unable to connect to LDAP server' });
                } else
                    resolve({ success: true });
            });
        });
    }

    private async searchForUser(ldapConfig: LDAPConfig, email: string): Promise<UserSearchResult> {
        if (!this._client)
            return { success: false, error: 'LDAPClient is null', DN: null };

        // LDAP Search Options
        const searchOptions: LDAP.SearchOptions = {
            scope: 'sub',
            filter: '(mail=' + email + ')', // (Searches on mail value)
            attributes: ['cn'] ,// return cn value
            sizeLimit: 1, // return only one result
            paged: true,
        };

        let searchComplete: boolean = false;
        const client: LDAP.Client = this._client;

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
                    resolve({ success: true, DN: entry.objectName });
                });

                res.on('error', (err: any) => {
                    const error: string = `Unable to locate ${email}`;
                    LOG.error(`LDAPAuth.searchForUser ${error}`, LOG.LS.eAUTH, err);
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

    private async bindUser(DN: string, email: string, password: string): Promise<VerifyUserResult> {
        if (!this._client)
            return { success: false, error: 'LDAPClient is null' };
        const client: LDAP.Client = this._client;
        return new Promise<VerifyUserResult>(function(resolve) {
            client.bind(DN, password, (err: any): void => {
                if (err) {
                    err;
                    const error: string = `Invalid password for ${email}`;
                    LOG.error(`LDAPAuth.bindUser ${error}`, LOG.LS.eAUTH);
                    resolve({ success: false, error });
                } else
                    resolve({ success: true });
            });
        });
    }
}

export default LDAPAuth;
