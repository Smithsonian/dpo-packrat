/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import * as LOG from '../../utils/logger';
import * as STORE from '../../storage/interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import { ASL, LocalStore } from '../../utils/localStore';
import { isAuthenticated } from '../auth';
import { DownloaderParser, DownloaderParserResults } from './DownloaderParser';

import { Readable, Writable /*, Transform */ } from 'stream';

import { v2 as webdav } from 'webdav-server';
import mime from 'mime'; // const mime = require('mime-types'); // can't seem to make this work using "import * as mime from 'mime'"; subsequent calls to mime.lookup freeze!
import path from 'path';

////////////////////////////////////////////////////////////////////////////////

export class WebDAVServer {
    protected server: webdav.WebDAVServer;
    protected auth: webdav.HTTPAuthentication;
    protected WDFS: WebDAVFileSystem | null = null;

    private static _webDavServer: WebDAVServer | null = null;

    static async server(): Promise<WebDAVServer | null> {
        if (!WebDAVServer._webDavServer) {
            const WDS: WebDAVServer = new WebDAVServer();
            if (!await WDS.initializeFileSystem())
                return null;
            WebDAVServer._webDavServer = WDS;
        }
        return WebDAVServer._webDavServer;
    }

    /** Needed for express integration; not intended for client use */
    public webdav(): webdav.WebDAVServer {
        return this.server;
    }

    public async initializeFileSystem(): Promise<boolean> {
        if (this.WDFS)
            return true;

        const WDFS: WebDAVFileSystem = new WebDAVFileSystem();

        let ret: boolean = true;
        this.server.setFileSystem('/', WDFS, success => {
            if (success)
                this.WDFS = WDFS;
            else {
                LOG.info('WebDAVServer.initializeFileSystem failed to set WebDAV file system', LOG.LS.eHTTP);
                ret = false;
            }
        });

        return ret;
    }

    private constructor()     {
        this.auth = new WebDAVAuthentication();
        this.server = new webdav.WebDAVServer({
            httpAuthentication: this.auth,
            // port: webDAVPort
        });
        this.server.beforeRequest((ctx, next) => {
            LOG.info(`WEBDAV ${ctx.request.method} ${ctx.request.url} START`, LOG.LS.eHTTP);
            next();
        });
        this.server.afterRequest((ctx, next) => {
            // Display the method, the URI, the returned status code and the returned message
            LOG.info(`WEBDAV ${ctx.request.method} ${ctx.request.url} END ${ctx.response.statusCode} ${ctx.response.statusMessage}`, LOG.LS.eHTTP);
            next();
        });
    }
}

class WebDAVAuthentication implements webdav.HTTPAuthentication {
    askForAuthentication(_ctx: webdav.HTTPRequestContext): { [headeName: string]: string; } {
        return { };
    }

    async getUser(ctx: webdav.HTTPRequestContext, callback: (error: Error, user?: webdav.IUser) => void): Promise<void> {
        if (isAuthenticated(ctx.request)) {
            const LS: LocalStore | undefined = ASL.getStore();
            const idUser: number | undefined | null = LS?.idUser;
            const user: DBAPI.User | undefined = idUser ? await CACHE.UserCache.getUser(idUser) : undefined;
            if (user) {
                // LOG.info(`WEBDAV ${ctx.request.url} authenticated for UserID ${user.idUser}`, LOG.LS.eHTTP);
                // @ts-ignore: ts(2345)
                callback(null, { uid: user.idUser.toString(), username: user.Name });
                return;
            }
        }

        LOG.error(`WEBDAV ${ctx.request.url} not authenticated`, LOG.LS.eHTTP);
        callback(new Error('Not Authenticated'), { uid: '', username: 'Default', isDefaultUser: true });
        return;
    }

}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVResource {
    props: webdav.IPropertyManager;
    locks: webdav.ILockManager;

    constructor(data?: WebDAVResource) {
        this.props = new webdav.LocalPropertyManager(data ? data.props: undefined);
        this.locks = new webdav.LocalLockManager();
    }
}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVSerializer implements webdav.FileSystemSerializer {
    uid(): string { return 'Packrat-WebDAVSerializer-v1.0.0'; }

    serialize(fs: WebDAVFileSystem, callback: webdav.ReturnCallback<any>): void {
        LOG.info(`WebDAVSerializer.serialize ${fs.resources.size}`, LOG.LS.eHTTP);
        callback(undefined, { fs });
    }

    unserialize(serializedData: any, callback: webdav.ReturnCallback<WebDAVFileSystem>): void {
        LOG.info(`WebDAVSerializer.unserialize ${JSON.stringify(serializedData)}`, LOG.LS.eHTTP);
        const fs = new WebDAVFileSystem(serializedData);
        callback(undefined, fs);
    }
}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVFileSystem extends webdav.FileSystem {
    resources: Map<string, WebDAVResource>;

    constructor(WDFS?: WebDAVFileSystem) {
        super(new WebDAVSerializer());
        this.resources = WDFS ? WDFS.resources : new Map<string, WebDAVResource>();
    }

    protected findResource(pathWD: webdav.Path): WebDAVResource {
        const sPath = pathWD.toString();
        let WDR: WebDAVResource | undefined = this.resources.get(sPath);
        if (!WDR) {
            WDR = new WebDAVResource();
            this.resources.set(sPath, WDR);
        }
        return WDR;
    }

    _propertyManager(pathWD: webdav.Path, _info: webdav.PropertyManagerInfo, callback: webdav.ReturnCallback<webdav.IPropertyManager>): void {
        LOG.info(`WebDAVFileSystem._propertyManager(${pathWD})`, LOG.LS.eHTTP);
        callback(undefined, this.findResource(pathWD).props);
    }

    _lockManager(pathWD: webdav.Path, _info: webdav.LockManagerInfo, callback: webdav.ReturnCallback<webdav.ILockManager>): void {
        LOG.info(`WebDAVFileSystem._lockManager(${pathWD})`, LOG.LS.eHTTP);
        callback(undefined, this.findResource(pathWD).locks);
    }

    /*
    async fetchAssetVersion(pathWD: webdav.Path, callerName: string): Promise<{ assetVersion: DBAPI.AssetVersion | null, error?: Error }> {
        LOG.info(`WebDAVFileSystem${callerName}(${pathWD})`, LOG.LS.eHTTP);

        const DP: DownloaderParser = new DownloaderParser('', pathWD.toString());
        const DPResults: DownloaderParserResults = await DP.parseArguments();
        if (!DPResults.success) {
            const error: string = `WebDAVFileSystem._openReadStream failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
            LOG.error(error, LOG.LS.eHTTP);
            return { assetVersion: null, error: new Error(error) };
        }

        if (!DPResults.assetVersion) {
            const error: string = 'WebDAVServer._openReadStream called without an assetVersion';
            LOG.error(error, LOG.LS.eHTTP);
            return { assetVersion: null, error: new Error(error) };
        }
        return { assetVersion: DPResults.assetVersion };
    }
    */

    async _openReadStream(pathWD: webdav.Path, _info: webdav.OpenReadStreamInfo, callback: webdav.ReturnCallback<Readable>): Promise<void> {
        LOG.info(`WebDAVFileSystem._openReadStream(${pathWD})`, LOG.LS.eHTTP);

        const DP: DownloaderParser = new DownloaderParser('', pathWD.toString());
        const DPResults: DownloaderParserResults = await DP.parseArguments();
        if (!DPResults.success) {
            const error: string = `WebDAVFileSystem._openReadStream failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        if (!DPResults.assetVersion) {
            const error: string = 'WebDAVServer._openReadStream called without an assetVersion';
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(DPResults.assetVersion);
        if (!res.success || !res.readStream) {
            const error: string = `download idAssetVersion=${DPResults.assetVersion} unable to read from storage: ${res.error}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }
        callback(undefined, (res.readStream as any) as Readable);

        // const fileName: string = assetVersion.FileName;
    }

    // HERE
    _openWriteStream(pathWD: webdav.Path, _info: webdav.OpenWriteStreamInfo, _callback: webdav.ReturnCallback<Writable>): void {
        LOG.info(`WebDAVFileSystem._openWriteStream(${pathWD})`, LOG.LS.eHTTP);
        // const stream = request.put(this.url + path.toString());
        // callback(undefined, (stream as any) as Writable);
    }

    _mimeType(pathWD: webdav.Path, _info: webdav.MimeTypeInfo, callback: webdav.ReturnCallback<string>): void {
        const filePath: string = pathWD.toString();
        const fileName: string = path.basename(filePath);
        const mimeType: string = mime.lookup(fileName) || 'application/octet-stream';

        LOG.info(`WebDAVFileSystem._mimeType(${pathWD}): ${mimeType}`, LOG.LS.eHTTP);
        callback(undefined, mimeType);
    }

    _type(pathWD: webdav.Path, _info: webdav.TypeInfo, callback: webdav.ReturnCallback<webdav.ResourceType>): void {
        const isDirectory: boolean = pathWD.toString().endsWith('/');
        LOG.info(`WebDAVFileSystem._type(${pathWD}): ${isDirectory ? 'Directory' : 'File'}`, LOG.LS.eHTTP);
        callback(undefined, isDirectory ? webdav.ResourceType.Directory : webdav.ResourceType.File);
    }
}