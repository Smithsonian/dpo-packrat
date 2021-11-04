/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import * as LOG from '../../utils/logger';
import * as STORE from '../../storage/interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as H from '../../utils/helpers';
import { ASL, LocalStore } from '../../utils/localStore';
import { isAuthenticated } from '../auth';
import { DownloaderParser, DownloaderParserResults } from './DownloaderParser';

import { Readable, Writable, PassThrough /* , Duplex, Transform, TransformOptions, TransformCallback */ } from 'stream';

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
class WebDAVSerializer implements webdav.FileSystemSerializer {
    uid(): string { return 'Packrat-WebDAVSerializer-v1.0.0'; }

    serialize(fs: WebDAVFileSystem, callback: webdav.ReturnCallback<any>): void {
        LOG.info('WebDAVSerializer.serialize', LOG.LS.eHTTP);
        callback(undefined, { fs });
    }

    unserialize(serializedData: any, callback: webdav.ReturnCallback<WebDAVFileSystem>): void {
        LOG.info('WebDAVSerializer.unserialize', LOG.LS.eHTTP);
        const fs = new WebDAVFileSystem(serializedData);
        callback(undefined, fs);
    }
}

class FileSystemResource {
    props: webdav.LocalPropertyManager;
    locks: webdav.LocalLockManager;

    constructor(data?: FileSystemResource) {
        if (!data) {
            this.props = new webdav.LocalPropertyManager();
            this.locks = new webdav.LocalLockManager();
        } else {
            const rs = data as FileSystemResource;
            this.props = new webdav.LocalPropertyManager(rs.props);
            this.locks = new webdav.LocalLockManager();
        }
    }
}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVFileSystem extends webdav.FileSystem {
    // props: webdav.IPropertyManager;
    // locks: webdav.ILockManager;

    resources: Map<string, FileSystemResource>;
    exists: Map<string, boolean>;

    constructor(WDFS?: WebDAVFileSystem) {
        super(new WebDAVSerializer());

        this.resources = WDFS ? WDFS.resources : new Map<string, FileSystemResource>();
        this.exists = WDFS ? WDFS.exists : new Map<string, boolean>();

        this.resources.set('/', new FileSystemResource());
    }

    _propertyManager(pathWD: webdav.Path, _info: webdav.PropertyManagerInfo, callback: webdav.ReturnCallback<webdav.IPropertyManager>): void {
        LOG.info(`WebDAVFileSystem._propertyManager(${pathWD})`, LOG.LS.eHTTP);
        this.getPropertyFromResource(pathWD, 'props', callback);
    }

    _lockManager(pathWD: webdav.Path, _info: webdav.LockManagerInfo, callback: webdav.ReturnCallback<webdav.ILockManager>): void {
        LOG.info(`WebDAVFileSystem._lockManager(${pathWD})`, LOG.LS.eHTTP);
        this.getPropertyFromResource(pathWD, 'locks', callback);
    }

    protected getPropertyFromResource(pathWD: webdav.Path, propertyName: string, callback: webdav.ReturnCallback<any>): void {
        const path: string = pathWD.toString();
        let resource: FileSystemResource | undefined = this.resources.get(path);
        if (!resource) {
            resource = new FileSystemResource();
            this.resources.set(path, resource);
        }

        callback(undefined, resource[propertyName]);
    }

    async _openReadStream(pathWD: webdav.Path, _info: webdav.OpenReadStreamInfo, callback: webdav.ReturnCallback<Readable>): Promise<void> {
        LOG.info(`WebDAVFileSystem._openReadStream(${pathWD})`, LOG.LS.eHTTP);

        const DP: DownloaderParser = new DownloaderParser('', pathWD.toString());
        const DPResults: DownloaderParserResults = await DP.parseArguments();
        if (!DPResults.success) {
            const error: string = `WebDAVFileSystem._openReadStream(${pathWD}) failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        if (!DPResults.assetVersion) {
            const error: string = `WebDAVFileSystem._openReadStream(${pathWD}) called without an assetVersion`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(DPResults.assetVersion);
        if (!res.success || !res.readStream) {
            const error: string = `WebDAVFileSystem._openReadStream(${pathWD}) idAssetVersion=${DPResults.assetVersion} unable to read from storage: ${res.error}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }
        callback(undefined, (res.readStream as any) as Readable);
    }

    async _openWriteStream(pathWD: webdav.Path, _info: webdav.OpenWriteStreamInfo, callback: webdav.ReturnCallback<Writable>): Promise<void> {
        const DP: DownloaderParser = new DownloaderParser('', pathWD.toString());
        const DPResults: DownloaderParserResults = await DP.parseArguments();
        if (!DPResults.success && !DP.idSystemObjectV) {
            const error: string = `WebDAVFileSystem._openWriteStream(${pathWD}) failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        const SOP: DBAPI.SystemObjectPairs | null = (DP.idSystemObjectV) ? await DBAPI.SystemObjectPairs.fetch(DP.idSystemObjectV) : null;
        const SOBased: DBAPI.SystemObjectBased | null = SOP ? SOP.SystemObjectBased : null;
        if (!SOBased) {
            const error: string = `WebDAVFileSystem._openWriteStream(${pathWD}) failed: unable to fetch system object details with idSystemObject ${DP.idSystemObjectV}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        const assetVersion: DBAPI.AssetVersion | undefined = DPResults.assetVersion;
        const asset: DBAPI.Asset | null = assetVersion ? await DBAPI.Asset.fetch(assetVersion.idAsset) : null;

        const pathS: string = pathWD.toString();
        const secondSlashIndex: number = pathS.indexOf('/', 1); // skip first slash with 1
        const FilePath: string = (secondSlashIndex >= 0) ? pathS.substring(secondSlashIndex + 1) : '';
        const FileName: string = path.basename(pathS);

        let eVocab: CACHE.eVocabularyID = CACHE.eVocabularyID.eAssetAssetTypeOther;
        if (FileName.toLowerCase().endsWith('.svx.json'))
            eVocab = CACHE.eVocabularyID.eAssetAssetTypeScene;
        else if (await CACHE.VocabularyCache.mapModelFileByExtensionID(FileName) !== undefined)
            eVocab = CACHE.eVocabularyID.eAssetAssetTypeModelGeometryFile;
        const VAssetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(eVocab);
        if (VAssetType === undefined) {
            const error: string = `WebDAVFileSystem._openWriteStream(${pathWD}) failed: unable to compute asset type for ${FileName}`;
            LOG.error(error, LOG.LS.eHTTP);
            callback(new Error(error));
            return;
        }

        LOG.info(`WebDAVFileSystem._openWriteStream(${pathWD}), FileName ${FileName}, FilePath ${FilePath}, asset type ${CACHE.eVocabularyID[eVocab]}, SOBased ${JSON.stringify(SOBased, H.Helpers.saferStringify)}`, LOG.LS.eHTTP);

        const LS: LocalStore = await ASL.getOrCreateStore();
        const idUserCreator: number = LS?.idUser ?? 0;
        const PT: PassThrough = new PassThrough();

        PT.on('finish', async () => {
            LOG.info(`WebDAVFileSystem._openWriteStream: (W) onFinish for ${JSON.stringify(asset, H.Helpers.saferStringify)}`, LOG.LS.eHTTP);
            const ISI: STORE.IngestStreamOrFileInput = {
                readStream: PT,
                localFilePath: null,
                asset,
                FileName,
                FilePath,
                idAssetGroup: 0,
                idVAssetType: VAssetType.idVocabulary,
                allowZipCracking: false,
                idUserCreator,
                SOBased,
            };
            const ISR: STORE.IngestStreamOrFileResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
            if (!ISR.success)
                LOG.error(`WebDAVFileSystem._openWriteStream(${pathWD}) failed to ingest new asset version: ${ISR.error}`, LOG.LS.eHTTP);
        });

        LOG.info('WebDAVFileSystem._openWriteStream callback()', LOG.LS.eHTTP);
        callback(undefined, PT);
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
