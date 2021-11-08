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
            // respondWithPaths: true,
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
    propertyManager: webdav.LocalPropertyManager;   // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    lockManager: webdav.LocalLockManager;           // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    type: webdav.ResourceType;                      // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    size: number | undefined;                       // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    readDir: string[] | undefined;                  // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    etag: string;                                   // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    lastModifiedDate: number;                       // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    creationDate: number;                           // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!

    private resourceSet: Set<string> = new Set<string>();

    constructor(resourceType: webdav.ResourceType, fileSize: number | bigint | undefined, hash: string, lastModifiedDate, creationDate) {
        this.propertyManager = new webdav.LocalPropertyManager();
        this.lockManager = new webdav.LocalLockManager();
        this.type = resourceType;
        try {
            this.size = fileSize ? Number(fileSize) : undefined;
        } catch {
            this.size = undefined;
        }
        this.readDir = undefined;
        this.etag = hash;
        this.lastModifiedDate = lastModifiedDate;
        this.creationDate = creationDate;
    }

    /** Returns true if new item is added, and false if item has already been added */
    addChild(childPath: string): boolean {
        if (this.resourceSet.has(childPath))
            return false;
        this.resourceSet.add(childPath);
        if (!this.readDir)
            this.readDir = [];
        this.readDir.push(childPath);
        return true;
    }
}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVFileSystem extends webdav.FileSystem {
    resources: Map<string, FileSystemResource>;

    constructor(WDFS?: WebDAVFileSystem) {
        super(new WebDAVSerializer());

        this.resources = WDFS ? WDFS.resources : new Map<string, FileSystemResource>();
        this.resources.set('/', new FileSystemResource(webdav.ResourceType.Directory, undefined, '/', 0, 0));
    }

    async _propertyManager(pathWD: webdav.Path, _info: webdav.PropertyManagerInfo, callback: webdav.ReturnCallback<webdav.IPropertyManager>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'propertyManager', callback);
    }

    async _lockManager(pathWD: webdav.Path, _info: webdav.LockManagerInfo, callback: webdav.ReturnCallback<webdav.ILockManager>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'lockManager', callback);
    }

    protected async getPropertyFromResource(pathWD: webdav.Path, propertyName: string, callback: webdav.ReturnCallback<any>): Promise<void> {
        const pathS: string = pathWD.toString();
        const logPrefix: string = `WebDAVFileSystem._${propertyName}(${pathS})`;
        let resource: FileSystemResource | undefined = this.resources.get(pathS);
        if (!resource) {
            const DP: DownloaderParser = new DownloaderParser('', pathS);
            const DPResults: DownloaderParserResults = await DP.parseArguments(true, true); // true, true -> collect all paths
            if (!DPResults.success || !DP.idSystemObjectV) {
                const error: string = `${logPrefix} failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
                LOG.error(error, LOG.LS.eHTTP);
                callback(new Error(error));
                return;
            }

            const prefix: string = `/idSystemObject-${DP.idSystemObjectV}`;
            for (const [ fileName, assetVersion ] of DP.fileMapV) {
                const fileNamePrefixed: string = `${prefix}${fileName}`;
                // LOG.info(`${logPrefix} considering ${fileNamePrefixed}`, LOG.LS.eHTTP);

                const utcMS: number = assetVersion.DateCreated.getTime();
                let resLookup: FileSystemResource | undefined = this.resources.get(fileNamePrefixed);
                if (!resLookup) {
                    resLookup = new FileSystemResource(webdav.ResourceType.File, assetVersion.StorageSize, assetVersion.StorageHash, utcMS, utcMS);
                    this.resources.set(fileNamePrefixed, resLookup);
                }

                if (fileNamePrefixed === pathS) {
                    // LOG.info(`${logPrefix} FOUND ${fileNamePrefixed}`, LOG.LS.eHTTP);
                    resource = resLookup;
                }

                let count: number = 0;
                let dirWalker: string = fileNamePrefixed;
                while (count++ <= 100) {
                    const dir = path.posix.dirname(dirWalker);
                    if (!dir|| dir === '/')
                        break;
                    let resDirectory: FileSystemResource | undefined = this.resources.get(dir);
                    if (!resDirectory) {
                        // LOG.info(`${logPrefix} recording DIR ${dir}`, LOG.LS.eHTTP);
                        resDirectory = new FileSystemResource(webdav.ResourceType.Directory, undefined, dir, utcMS, utcMS); // HERE: need a better hash than dir here
                        this.resources.set(dir, resDirectory);
                    }

                    let childPath: string;
                    // let entryType: string;
                    if (count === 1) { // record file with parent directory
                        childPath = path.basename(fileName);
                        // entryType = 'FILE';
                    } else { // record directory with parent directory
                        childPath = path.basename(dirWalker);
                        // entryType = 'DIR';
                    }
                    resDirectory.addChild(childPath);
                    // if (resDirectory.addChild(childPath))
                    //     LOG.info(`${logPrefix} adding to DIR ${dir} ${entryType} ${childPath}`, LOG.LS.eHTTP);
                    dirWalker = dir;
                }
            }

            if (!resource) {
                const error: string = `${logPrefix} failed to compute resource`;
                LOG.error(error, LOG.LS.eHTTP);
                callback(new Error(error));
                return;
            }
        }

        /*
        if (propertyName === 'type')
            LOG.info(`${logPrefix}: ${resource.type === webdav.ResourceType.Directory ? 'Directory' : 'File'}`, LOG.LS.eHTTP);
        else if (propertyName === 'readDir')
            LOG.info(`${logPrefix}: DIR Contents ${JSON.stringify(resource.readDir)}`, LOG.LS.eHTTP);
        else if (propertyName === 'etag' || propertyName === 'creationDate' || propertyName === 'lastModifiedDate' || propertyName === 'size')
            LOG.info(`${logPrefix}: ${resource[propertyName]}`, LOG.LS.eHTTP);
        else if (propertyName !== 'propertyManager' && propertyName !== 'lockManager')
            LOG.info(logPrefix, LOG.LS.eHTTP);
        */
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

        // LOG.info(`WebDAVFileSystem._mimeType(${pathWD}): ${mimeType}`, LOG.LS.eHTTP);
        callback(undefined, mimeType);
    }

    async _type(pathWD: webdav.Path, _info: webdav.TypeInfo, callback: webdav.ReturnCallback<webdav.ResourceType>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'type', callback);
    }

    async _readDir(pathWD: webdav.Path, _info: webdav.ReadDirInfo, callback: webdav.ReturnCallback<string[] | webdav.Path[]>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'readDir', callback);
    }

    async _size(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'size', callback);
    }

    async _etag(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<string>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'etag', callback);
    }

    async _creationDate(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'creationDate', callback);
    }

    async _lastModifiedDate(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'lastModifiedDate', callback);
    }
}
