/* eslint-disable @typescript-eslint/no-explicit-any */
/** TODO
 * - return results with data so calling routines can act on it (all info logs here are debug for that reason)
 */
import { IAuth, VerifyUserResult } from '../interface';
import { Config, /*ENVIRONMENT_TYPE,*/ LDAPConfig } from '../../config';
import * as H from '../../utils/helpers';
import * as LDAP from 'ldapjs';
import os from 'os';
import { RecordKeeper as RK } from '../../records/recordKeeper';
// import fs from 'fs';

/**
 * LDAPS (Active Directory) implementation of authentication. This checks for the user against
 * the Active Directory user list and the password. AuthFactory will then determine if the user
 * is valid within Packrat.
 */
type UserSearchResult = {
    success: boolean;
    error?: string | null;
    DN: string | null;
    data?: any;
};

class LDAPAuth implements IAuth {
    private _ldapConfig: LDAPConfig = Config.auth.ldap;
    private _client: LDAP.Client | null = null;

    async verifyUser(email: string, password: string): Promise<VerifyUserResult> {
        try {
            let res: VerifyUserResult = await this.fetchClient();
            if (!res.success) {
                RK.logError(RK.LogSection.eAUTH,'verify user failed','cannot fetch client',{ response: H.Helpers.getErrorString(res.error), email, auth: res.data.type },'LDAPAuth');
                return { ...res, data: { auth: 'ldaps', server: this._ldapConfig.server }};
            }

            // Step 2: Bind Packrat Service Account
            res = await this.bindService();
            if (!res.success)
                return { ...res, data: { auth: 'ldaps', server: this._ldapConfig.server }};

            // Step 3: Search for passed user by email
            const resUserSearch: UserSearchResult = await this.searchForUser(this._ldapConfig, email);
            if (!resUserSearch.success|| !resUserSearch.DN)
                return { ...resUserSearch, data: { auth: 'ldaps', server: this._ldapConfig.server, }};

            //Step 4: If user is found, bind on their credentials
            res = await this.bindUser(resUserSearch.DN, password);
            return { ...res, data: { auth: 'ldaps', server: this._ldapConfig.server }};
        } catch (error) {
            RK.logError(RK.LogSection.eAUTH,'verify user failed',H.Helpers.getErrorString(error),email,'LDAPAuth');
            return { success: false, error: JSON.stringify(error), data: { auth: 'ldaps', server: this._ldapConfig.server }};
        }
    }

    private async fetchClient(): Promise<VerifyUserResult> {

        // if we already have a client destroy it as it hangs with LDAPS requests
        // this appears to be tied to required certificates.
        if (this._client)
            this.destroyClient();
            // return { success: true };

        // LOG.info(`Auth connecting to ${this._ldapConfig.server} for LDAP authentication on ${os.type()}.`, LOG.LS.eAUTH);
        // LOG.info(`LDAPAuth.fetchClient (working directory: ${__dirname} | system: ${Config.environment.type} | ca: ${this._ldapConfig.CA} | cert_exists: ${fs.existsSync(this._ldapConfig.CA)}`,LOG.LS.eDEBUG);

        // setup our client configuration for TLS/LDAPS
        const clientConfig: any = {
            url: this._ldapConfig.server,
            tlsOptions:  { rejectUnauthorized: true, } // set to false for self-signed certificates (development only)
        };

        // re-introduce the full path to our SSL certificate to ensure it's in the environment variables.
        process.env.NODE_EXTRA_CA_CERTS = this._ldapConfig.CA;

        // LEGACY: add the certificate to the LDAPS request. often results in UNABLE_TO_GET_ISSUER_CERT_LOCALLY which
        // suggests it cannot verify the certificate with the authority server. keeping this code until timeout issue is proven resolved
        //
        // Windows desktops have a trusted US domain cert already installed because it is joined to the US domain
        // Linux does not because it's not part of the US domain so we have to point to a certificate
        //
        // if we're in production environment on Linux (the server) add our certificate path (note: path is relative to the container NOT system)
        // if(Config.environment.type==ENVIRONMENT_TYPE.PRODUCTION && os.type().toLowerCase()=='linux' && fs.existsSync(this._ldapConfig.CA)==true)
        //     clientConfig.tlsOptions.ca = [ fs.readFileSync(this._ldapConfig.CA) ];
        // else
        //     LOG.info(`LDAPAuth.fetchClient skipping explicit SSL certificate (env:${Config.environment.type} | os:${os.type()} | ca:${this._ldapConfig.CA} = ${fs.existsSync(this._ldapConfig.CA)} )`, LOG.LS.eAUTH);

        // Step 1: Create a ldap client using our config
        // LOG.info(`>>> LDAPAuth.fetchClient creating client: ${H.Helpers.JSONStringify(clientConfig)}`,LOG.LS.eDEBUG);
        this._client = LDAP.createClient(clientConfig);

        // this is needed to avoid nodejs crash of server when the LDAP connection is unavailable
        this._client.on('error', error => {
            const errorMessage: string | undefined = (error instanceof Error) ? error.message : undefined;
            if (errorMessage && errorMessage.includes('ECONNRESET'))
                RK.logWarning(RK.LogSection.eAUTH,'LDAPS client connect','ECONNRESET - destroying old LDAP client',{ server: this._ldapConfig.server, os: os.type() },'LDAPAuth');
            else
                RK.logWarning(RK.LogSection.eAUTH,'LDAPS client connect',H.Helpers.getErrorString(error),{ server: this._ldapConfig.server, os: os.type() },'LDAPAuth');

            this.destroyClient();
        });

        // catching other events from the client
        this._client.on('connectRefused', msg =>    { RK.logError(RK.LogSection.eAUTH,'LDAPS client connect',`connection refused - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth'); this.destroyClient(); });
        this._client.on('connectTimeout', msg =>    { RK.logError(RK.LogSection.eAUTH,'LDAPS clientconnect',`connection timeout - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth'); this.destroyClient(); });
        this._client.on('connectError', msg =>      { RK.logError(RK.LogSection.eAUTH,'LDAPS client connect',`socket connection error - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth'); this.destroyClient(); });
        this._client.on('setupError', msg =>        { RK.logError(RK.LogSection.eAUTH,'LDAPS client connect',`setup error after connection - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth'); this.destroyClient(); });
        this._client.on('socketTimeout', msg =>     { RK.logError(RK.LogSection.eAUTH,'LDAPS client connect',`socket timeout - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth'); this.destroyClient(); });
        this._client.on('destroy', msg =>           { RK.logDebug(RK.LogSection.eAUTH,'LDAPS client connect',`connection destroyed - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth');  });
        this._client.on('end', msg =>               { RK.logDebug(RK.LogSection.eAUTH,'LDAPS client connect',`socket end event - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth');  });
        this._client.on('close', msg =>             { RK.logDebug(RK.LogSection.eAUTH,'LDAPS client connect',`socket closed - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth');  });
        this._client.on('connect', msg =>           { RK.logDebug(RK.LogSection.eAUTH,'LDAPS client connect',`connected - ${H.Helpers.getErrorString(msg)}`,{ server: this._ldapConfig.server },'LDAPAuth');  });

        // return success regardless
        // TODO: wait for finish (end event?) before returning so we block and ensure system doesn't progress without knowing.
        RK.logDebug(RK.LogSection.eAUTH,'LDAPS client created',undefined,{ server: this._ldapConfig.server, os: os.type() },'LDAPAuth');
        return { success: true };
    }

    private destroyClient() {
        if(this._client) {
            RK.logDebug(RK.LogSection.eAUTH,'LDAPS client destroyed',undefined,{ server: this._ldapConfig.server },'LDAPAuth');
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
                    RK.logDebug(RK.LogSection.eAUTH,'LDAPS bind service failed',H.Helpers.getErrorString(err),undefined,'LDAPAuth');
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
                    // const error: string = `Unable to locate ${email}`;
                    // RK.logError(RK.LogSection.eAUTH,'user search failed',H.Helpers.getErrorString(err),undefined,'LDAPAuth');
                    resolve({ success: false, error: H.Helpers.getErrorString(err), DN: null });
                }

                res.on('searchEntry', (entry: any) => {
                    // RK.logDebug(RK.LogSection.eAUTH,'user search success',undefined,{ email, objectName: entry.objectName },'LDAPAuth');
                    searchComplete = true;
                    resolve({ success: true, DN: entry.objectName });
                });

                res.on('error', (err: any) => {
                    // const error: string = `unable to locate user`; // ${email}`;
                    // RK.logError(RK.LogSection.eAUTH,'user search failed',`cannot locate user - ${H.Helpers.getErrorString(err)}`,email,'LDAPAuth');
                    resolve({ success: false, error: H.Helpers.getErrorString(err), DN: null });
                });

                res.on('end', (result: any) => {
                    if (!searchComplete) {
                        result;
                        const error: string = `unable to locate user`; // ${email}`;
                        // RK.logError(RK.LogSection.eAUTH,'user search failed','cannot locate user end',email,'LDAPAuth');
                        resolve({ success: false, error, DN: null });
                    }
                });
            });
        });
    }

    private async bindUser(DN: string, password: string): Promise<VerifyUserResult> {
        if (!this._client)
            return { success: false, error: 'LDAPClient is null' };

        const client: LDAP.Client = this._client;
        return new Promise<VerifyUserResult>(function(resolve) {
            client.bind(DN, password, (err: any): void => {
                if (err) {
                    err;
                    // const error: string = `invalid password for ${email}`;
                    // RK.logError(RK.LogSection.eAUTH,'LDAP bind user failed','invalid password',email,'LDAPAuth');
                    resolve({ success: false, error: 'invalid password' });
                } else
                    resolve({ success: true });
            });
        });
    }
}

export default LDAPAuth;
