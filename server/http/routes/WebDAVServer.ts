/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import * as STORE from '../../storage/interface';
import * as DBAPI from '../../db';
import * as CACHE from '../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../../utils/helpers';
import { BufferStream } from '../../utils/bufferStream';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eEventKey } from '../../event/interface/EventEnums';
import { ASL, ASR, LocalStore } from '../../utils/localStore';
import { isAuthenticated } from '../auth';
import { DownloaderParser, DownloaderParserResults } from './DownloaderParser';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import { Readable, Writable } from 'stream';

import { v2 as webdav } from 'webdav-server';
import * as mime from 'mime-types';
import path from 'path';
import { Semaphore, Mutex, withTimeout, SemaphoreInterface, E_TIMEOUT } from 'async-mutex';

////////////////////////////////////////////////////////////////////////////////

export class WebDAVServer {
    protected server: webdav.WebDAVServer;
    protected auth: webdav.HTTPAuthentication;
    protected WDFS: WebDAVFileSystem | null = null;

    private static _webDavServer: WebDAVServer | null = null;
    static httpRoute: string = '/webdav';

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
                RK.logError(RK.LogSection.eHTTP,'initialize file system failed','cannot set WebDAV file system',{},'HTTP.Route.WebDAV');
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
            RK.logInfo(RK.LogSection.eHTTP,'before request',`${ctx.request.method} ${ctx.request.url} start`,{},'HTTP.Route.WebDAV');
            next();
        });
        this.server.afterRequest((ctx, next) => {
            // Display the method, the URI, the returned status code and the returned message
            RK.logInfo(RK.LogSection.eHTTP,'after request',`${ctx.request.method} ${ctx.request.url} end`,{ ...ctx.response },'HTTP.Route.WebDAV');
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
                RK.logInfo(RK.LogSection.eHTTP,'get user','authenticated for user',{ idUser: user.idUser, name: user.Name },'HTTP.Route.WebDAV');
                // @ts-ignore: ts(2345)
                callback(null, { uid: user.idUser.toString(), username: user.Name });
                return;
            }
        }

        RK.logError(RK.LogSection.eHTTP,'ask for authentication failed',`${ctx.request.url} not authenticated`,{},'HTTP.Route.WebDAV');
        AuditFactory.audit({ url: ctx.request.url, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eHTTPDownload);
        callback(new Error('Not Authenticated'), { uid: '', username: 'Default', isDefaultUser: true });
        return;
    }

}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVSerializer implements webdav.FileSystemSerializer {
    uid(): string { return 'Packrat-WebDAVSerializer-v1.0.0'; }

    serialize(fs: WebDAVFileSystem, callback: webdav.ReturnCallback<any>): void {
        RK.logDebug(RK.LogSection.eHTTP,'serialize',undefined,{},'HTTP.Route.WebDAV');
        callback(undefined, { fs });
    }

    unserialize(serializedData: any, callback: webdav.ReturnCallback<WebDAVFileSystem>): void {
        RK.logDebug(RK.LogSection.eHTTP,'unserialize',undefined,{},'HTTP.Route.WebDAV');
        const fs = new WebDAVFileSystem(serializedData);
        callback(undefined, fs);
    }
}

class WebDAVManagers {
    propertyManager: webdav.LocalPropertyManager;   // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    lockManager: webdav.LocalLockManager;           // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!

    constructor() {
        this.propertyManager = new webdav.LocalPropertyManager();
        this.lockManager = new webdav.LocalLockManager();
    }
}

class FileSystemResource {
    type: webdav.ResourceType;                      // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    size: number | undefined;                       // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    readDir: string[] | undefined;                  // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    etag: string;                                   // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    lastModifiedDate: number;                       // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!
    creationDate: number;                           // The name of this member is important as it matches method names in webdav.FileSystem; don't change it!

    private resourceSet: Set<string> = new Set<string>();
    cacheDate: Date = new Date();

    constructor(resourceType: webdav.ResourceType, fileSize: number | bigint | undefined, hash: string, lastModifiedDate, creationDate) {
        this.type = resourceType;
        this.setSize(fileSize);
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

    setSize(fileSize: number | bigint | undefined): void {
        try {
            this.size = fileSize !== undefined ? Number(fileSize) : undefined;
        } catch {
            this.size = undefined;
        }
    }
}

// Adapted from https://github.com/OpenMarshal/npm-WebDAV-Server-Types/blob/master/repositories/http/HTTPFileSystem.ts
class WebDAVFileSystem extends webdav.FileSystem {
    resources: Map<string, FileSystemResource>;
    managers: Map<string, WebDAVManagers>;
    private writeSemaphoreMap: Map<number, SemaphoreInterface>;     // idSystemObject -> write Semaphore for that system object
    private writeSemaphoreCountMap: Map<number, number>;            // idSystemObject -> count of writers
    private semaphoreMapLock: Mutex;

    // private static lockExclusiveWrite: webdav.LockKind = new webdav.LockKind(webdav.LockScope.Exclusive, webdav.LockType.Write, 300);

    constructor(WDFS?: WebDAVFileSystem) {
        super(new WebDAVSerializer());

        this.resources = WDFS ? WDFS.resources : new Map<string, FileSystemResource>();
        this.managers =  WDFS ? WDFS.managers : new Map<string, WebDAVManagers>();
        this.resources.set('/', new FileSystemResource(webdav.ResourceType.Directory, undefined, '/', 0, 0));
        this.managers.set('/', new WebDAVManagers());
        this.writeSemaphoreMap = new Map<number, Semaphore>();
        this.writeSemaphoreCountMap = new Map<number, number>();
        this.semaphoreMapLock = new Mutex();
    }

    private getManagers(pathS: string): WebDAVManagers {
        let managers: WebDAVManagers | undefined = this.managers.get(pathS);
        if (!managers) {
            managers = new WebDAVManagers();
            this.managers.set(pathS, managers);
        }
        return managers;
    }

    private getResource(pathS: string): FileSystemResource | undefined {
        let resource: FileSystemResource | undefined = this.resources.get(pathS);
        if (resource && resource.type === webdav.ResourceType.File) {
            const age: number = new Date().getTime() - resource.cacheDate.getTime();
            if (age >= 10000) {
                resource = undefined;
                this.resources.delete(pathS);
            }
        }
        return resource;
    }

    /** Returns true if caller should try again, calling callback when done */
    protected async getPropertyFromResource(pathWD: webdav.Path, propertyName: string, allowMissing: boolean, callback: webdav.ReturnCallback<any>): Promise<void> {
        try {
            const pathS: string = pathWD.toString();
            const logPrefix: string = `WebDAVFileSystem._${propertyName}(${pathS})`;
            let resource: FileSystemResource | undefined = this.getResource(pathS);
            if (!resource) {
                const DP: DownloaderParser = new DownloaderParser('', pathS);
                const DPResults: DownloaderParserResults = await DP.parseArguments(true, true); // true, true -> collect all paths
                if (!DPResults.success || !DP.idSystemObjectV) {
                    const error: string = `${logPrefix} failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
                    RK.logError(RK.LogSection.eHTTP,'get property from resource failed',DPResults.message,{ path: pathS, propertyName },'HTTP.Route.WebDAV');
                    callback(new Error(error));
                    return;
                }

                const prefix: string = `/idSystemObject-${DP.idSystemObjectV}`;
                for (const [ fileName, assetVersion ] of DP.fileMapV) {
                    const fileNamePrefixed: string = `${prefix}${fileName}`;
                    // LOG.info(`${logPrefix} considering ${fileNamePrefixed}`, LOG.LS.eHTTP);

                    const utcMS: number = assetVersion.DateCreated.getTime();
                    let resLookup: FileSystemResource | undefined = this.getResource(fileNamePrefixed);
                    if (!resLookup) {
                        resLookup = new FileSystemResource(webdav.ResourceType.File, assetVersion.StorageSize, assetVersion.StorageHash, utcMS, utcMS);
                        this.resources.set(fileNamePrefixed, resLookup);
                    }

                    if (fileNamePrefixed === pathS) {
                        // LOG.info(`${logPrefix} FOUND ${fileNamePrefixed}`, LOG.LS.eHTTP);
                        resource = resLookup;
                    }

                    this.addParentResources(fileNamePrefixed, utcMS);
                }

                if (!resource) {
                    if (!allowMissing) {
                        const error: string = `${logPrefix} failed to compute resource`;
                        RK.logError(RK.LogSection.eHTTP,'before request failed','cannot compute resource',{},'HTTP.Route.WebDAV');
                        callback(new Error(error));
                        return;
                    }
                    RK.logWarning(RK.LogSection.eHTTP,'get property from resource failed',`failed to compute resource, adding: ${pathS}`,{},'HTTP.Route.WebDAV');

                    const utcMS: number = (new Date()).getTime();
                    resource = new FileSystemResource(webdav.ResourceType.File, 0, '', utcMS, utcMS);
                    this.resources.set(pathS, resource);
                }
            }
            /*
            if (propertyName === 'type')
                LOG.info(`${logPrefix}: ${resource.type === webdav.ResourceType.Directory ? 'Directory' : 'File'}`, LOG.LS.eHTTP);
            else if (propertyName === 'readDir')
                LOG.info(`${logPrefix}: DIR Contents ${JSON.stringify(resource.readDir)}`, LOG.LS.eHTTP);
            else if (propertyName === 'etag' || propertyName === 'creationDate' || propertyName === 'lastModifiedDate' || propertyName === 'size')
                LOG.info(`${logPrefix}: ${resource[propertyName]}`, LOG.LS.eHTTP);
            else
                LOG.info(logPrefix, LOG.LS.eHTTP);
            */
            if (propertyName !== 'create')
                callback(undefined, resource[propertyName]);
            else
                callback(undefined);
        } catch (error) {
            RK.logError(RK.LogSection.eHTTP,'get property from resource failed',H.Helpers.getErrorString(error),{ pathWebDAV: pathWD },'HTTP.Route.WebDAV');
        }
    }

    private addParentResources(pathS: string, utcMS: number): void {
        let count: number = 0;
        let dirWalker: string = pathS;
        while (count++ <= 100) {
            const dir = path.posix.dirname(dirWalker);
            if (!dir|| dir === '/')
                break;
            let resDirectory: FileSystemResource | undefined = this.getResource(dir);
            if (!resDirectory) {
                // LOG.info(`${logPrefix} recording DIR ${dir}`, LOG.LS.eHTTP);
                resDirectory = new FileSystemResource(webdav.ResourceType.Directory, undefined, dir, utcMS, utcMS); // HERE: need a better hash than dir here
                this.resources.set(dir, resDirectory);
            }

            let childPath: string;
            // let entryType: string;
            if (count === 1) { // record file with parent directory
                childPath = path.basename(pathS);
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

    /*
    private async setLock<T>(pathWD: webdav.Path, ctx: webdav.RequestContext, callback: webdav.ReturnCallback<T>): Promise<string | undefined> {
        const LM: webdav.ILockManagerAsync = await this.lockManagerAsync(ctx, pathWD);
        const lock: webdav.Lock = new webdav.Lock(WebDAVFileSystem.lockExclusiveWrite, '', '');

        try {
            await LM.setLockAsync(lock);
        } catch (error) {
            LOG.error(`WebDAVFileSystem.setLock(${pathWD}) failed to acquire lock`, LOG.LS.eHTTP, error);
            callback(error as Error);
            return undefined;
        }
        LOG.info(`WebDAVFileSystem.setLock(${pathWD}): ${lock.uuid}`, LOG.LS.eHTTP);
        return lock.uuid;
    }

    private async removeLock(pathWD: webdav.Path, ctx: webdav.RequestContext, uuid: string): Promise<void> {
        const LM: webdav.ILockManagerAsync = await this.lockManagerAsync(ctx, pathWD);
        const Locks: webdav.Lock[] = await LM.getLocksAsync();
        LOG.info(`WebDAVFileSystem.removeLock(${pathWD}, ${uuid}): current locks ${JSON.stringify(Locks)}`, LOG.LS.eHTTP);
        const success: boolean = await LM.removeLockAsync(uuid);
        LOG.info(`WebDAVFileSystem.removeLock(${pathWD}): ${uuid}${success ? '' : ' FAILED'}`, LOG.LS.eHTTP);
    }
    */
    async _openReadStream(pathWD: webdav.Path, _info: webdav.OpenReadStreamInfo, callback: webdav.ReturnCallback<Readable>): Promise<void> {
        try {
            const pathS: string = pathWD.toString();
            RK.logDebug(RK.LogSection.eHTTP,'open read stream',undefined,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');

            const DP: DownloaderParser = new DownloaderParser('', pathS);
            const DPResults: DownloaderParserResults = await DP.parseArguments();
            if (!DPResults.success) {
                const error: string = `WebDAVFileSystem._openReadStream(${pathS}) failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
                RK.logError(RK.LogSection.eHTTP,'open read stream failed',DPResults.message,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                callback(new Error(error));
                return;
            }

            // Audit download
            const auditData = { url: `${WebDAVServer.httpRoute}${DP.requestURLV}`, auth: true };
            const auditOID: DBAPI.ObjectIDAndType = { eObjectType: DP.eObjectTypeV, idObject: DP.idObjectV };
            AuditFactory.audit(auditData, auditOID, eEventKey.eHTTPDownload);

            if (!DPResults.assetVersion) {
                const error: string = `WebDAVFileSystem._openReadStream(${pathS}) called without an assetVersion`;
                RK.logError(RK.LogSection.eHTTP,'open read stream failed','called without an assetVersion',{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                callback(new Error(error));
                return;
            }

            const res: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAssetVersion(DPResults.assetVersion);
            if (!res.success || !res.readStream) {
                const error: string = `WebDAVFileSystem._openReadStream(${pathS}) idAssetVersion=${DPResults.assetVersion} unable to read from storage: ${res.error}`;
                RK.logError(RK.LogSection.eHTTP,'open read stream failed',`unable to read from storage: ${res.error}`,{ pathSource: pathS, pathWebDAV: pathWD, assetVersion: DPResults.assetVersion },'HTTP.Route.WebDAV');
                callback(new Error(error));
                return;
            }
            callback(undefined, (res.readStream as any) as Readable);
        } catch (error) {
            RK.logError(RK.LogSection.eHTTP,'open read stream failed',`catch error: ${H.Helpers.getErrorString(error)}`,{ pathWebDAV: pathWD },'HTTP.Route.WebDAV');
        }
    }

    private async computeWriteLock(idSystemObject: number | null, _pathS: string): Promise<SemaphoreInterface | undefined> {
        if (!idSystemObject)
            return undefined;

        const releaser = await this.semaphoreMapLock.acquire();

        let writeLock: SemaphoreInterface | undefined = this.writeSemaphoreMap.get(idSystemObject);
        if (writeLock === undefined) {
            writeLock = withTimeout(new Semaphore(1), 2000); // wait 2 seconds for this writeLock
            this.writeSemaphoreMap.set(idSystemObject, writeLock);
        }

        const writers: number = (this.writeSemaphoreCountMap.get(idSystemObject) ?? 0) + 1;
        this.writeSemaphoreCountMap.set(idSystemObject, writers);
        // LOG.info(`WebDAVFileSystem._openWriteStream(${_pathS}) Record ${writers}`, LOG.LS.eHTTP);

        releaser();
        return writeLock;
    }

    private async releaseWriteLock(idSystemObject: number | null, _pathS: string): Promise<void> {
        if (!idSystemObject)
            return;

        const releaser = await this.semaphoreMapLock.acquire();

        const writers: number = (this.writeSemaphoreCountMap.get(idSystemObject) ?? 0);
        if (writers > 0)
            this.writeSemaphoreCountMap.set(idSystemObject, writers - 1);
        // LOG.info(`WebDAVFileSystem._openWriteStream(${_pathS}) Record ${writers - 1}`, LOG.LS.eHTTP);

        if (writers === 1)
            this.writeSemaphoreMap.delete(idSystemObject);

        releaser();
    }

    async _openWriteStream(pathWD: webdav.Path, _info: webdav.OpenWriteStreamInfo,
        callback: webdav.ReturnCallback<Writable>, callbackComplete: webdav.SimpleCallback): Promise<void> {

        try {
            /*
            const lockUUID: string | undefined = await this.setLock<Writable>(pathWD, _info.context, callback);
            if (lockUUID === undefined)
                return;
            */

            const pathS: string = pathWD.toString();
            const DP: DownloaderParser = new DownloaderParser('', pathS);
            const DPResults: DownloaderParserResults = await DP.parseArguments();
            if (!DPResults.success && !DP.idSystemObjectV) {
                const error: string = `WebDAVFileSystem._openWriteStream(${pathS}) failed: ${DPResults.statusCode}${DPResults.message ? ' (' + DPResults.message + ')' : ''}`;
                RK.logError(RK.LogSection.eHTTP,'open write stream failed',DPResults.message,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                callback(new Error(error));
                // await this.removeLock(pathWD, info.context, lockUUID);
                return;
            }

            // Audit upload
            const auditData = { url: `${WebDAVServer.httpRoute}${DP.requestURLV}`, auth: true };
            const auditOID: DBAPI.ObjectIDAndType = { eObjectType: DP.eObjectTypeV, idObject: DP.idObjectV };
            AuditFactory.audit(auditData, auditOID, eEventKey.eHTTPUpload);

            const SOP: DBAPI.SystemObjectPairs | null = (DP.idSystemObjectV) ? await DBAPI.SystemObjectPairs.fetch(DP.idSystemObjectV) : null;
            const SOBased: DBAPI.SystemObjectBased | null = SOP ? SOP.SystemObjectBased : null;
            if (!SOBased) {
                const error: string = `WebDAVFileSystem._openWriteStream(${pathS}) failed: unable to fetch system object details with idSystemObject ${DP.idSystemObjectV}`;
                RK.logError(RK.LogSection.eHTTP,'open write stream failed',`unable to fetch system object details with idSystemObject ${DP.idSystemObjectV}`,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                callback(new Error(error));
                // await this.removeLock(pathWD, info.context, lockUUID);
                return;
            }

            const assetVersion: DBAPI.AssetVersion | undefined = DPResults.assetVersion;
            const asset: DBAPI.Asset | null = assetVersion ? await DBAPI.Asset.fetch(assetVersion.idAsset) : null;

            const secondSlashIndex: number = pathS.indexOf('/', 1); // skip first slash with 1
            const FilePath: string = (secondSlashIndex >= 0) ? path.dirname(pathS.substring(secondSlashIndex + 1)) : '';
            const FileName: string = path.basename(pathS);

            let eVocab: COMMON.eVocabularyID = COMMON.eVocabularyID.eAssetAssetTypeOther;
            if (FileName.toLowerCase().endsWith('.svx.json'))
                eVocab = COMMON.eVocabularyID.eAssetAssetTypeScene;
            else if (await CACHE.VocabularyCache.mapModelFileByExtensionID(FileName) !== undefined)
                eVocab = COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile;
            const VAssetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabularyByEnum(eVocab);
            if (VAssetType === undefined) {
                const error: string = `WebDAVFileSystem._openWriteStream(${pathS}) failed: unable to compute asset type for ${FileName}`;
                RK.logError(RK.LogSection.eHTTP,'open write stream failed',`unable to compute asset type for ${FileName}`,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                callback(new Error(error));
                // await this.removeLock(pathWD, info.context, lockUUID);
                return;
            }
            // LOG.info(`WebDAVFileSystem._openWriteStream(${pathS}), FileName ${FileName}, FilePath ${FilePath}, asset type ${COMMON.eVocabularyID[eVocab]}, SOBased ${JSON.stringify(SOBased, H.Helpers.saferStringify)}`, LOG.LS.eHTTP);

            const LS: LocalStore = await ASL.getOrCreateStore();
            const idUserCreator: number = LS?.idUser ?? 0;
            const BS: BufferStream = new BufferStream();
            // BS.on('resume', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onResume for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('pause', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onPause for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('error', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onError for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('end', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onEnd for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('pipe', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onPipe for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('unpipe', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onUnPipe for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('drain', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onDrain for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });
            // BS.on('close', async () => { LOG.info(`WebDAVFileSystem._openWriteStream: (W) onClose for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eHTTP); });

            // we wrap our function in AsyncResource to preserve the context since the callback may be called outside
            // the original context and thus breaking LocalStore.
            BS.on('finish', ASR.bind(async () => {
                try {
                    // LOG.info(`WebDAVFileSystem._openWriteStream(${pathS}): (W) onFinish for ${asset ? JSON.stringify(asset, H.Helpers.saferStringify) : 'new asset'}`, LOG.LS.eDEBUG);
                    const ISI: STORE.IngestStreamOrFileInput = {
                        readStream: BS,
                        localFilePath: null,
                        asset,
                        FileName,
                        FilePath,
                        idAssetGroup: 0,
                        idVAssetType: VAssetType.idVocabulary,
                        allowZipCracking: false,
                        idUserCreator,
                        SOBased,
                        Comment: 'Created by WebDAV Save'
                    };

                    // Serialize access per DP.idSystemObjectV via Semaphore, allowing only 1 ingestion at a time per system object
                    const writeLock: SemaphoreInterface | undefined = await this.computeWriteLock(DP.idSystemObjectV, pathS);
                    if (writeLock) {
                        for (let lockAttempt = 1; lockAttempt <= 5; lockAttempt++) {
                            try {
                                await writeLock.runExclusive(async (_value) => {
                                    try {
                                        // LOG.info(`WebDAVFileSystem._openWriteStream(${pathS}): (W) onFinish ingestStream START`, LOG.LS.DEBUG);
                                        return await this.ingestStream(ISI, pathS);
                                    } finally {
                                        await this.releaseWriteLock(DP.idSystemObjectV, pathS);
                                        // LOG.info(`WebDAVFileSystem._openWriteStream(${pathS}): (W) onFinish ingestStream END`, LOG.LS.eDEBUG);
                                    }
                                });
                                return;
                            } catch (error) {
                                if (error === E_TIMEOUT) {
                                    const finalTry: boolean = (lockAttempt === 5);
                                    if (finalTry) {
                                        RK.logError(RK.LogSection.eHTTP,'open write stream failed','onFinish ingestStream timeout write lock',{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                                        return;
                                    }
                                } else
                                    RK.logError(RK.LogSection.eHTTP,'open write stream failed',`onFinish ingestStream: ${error}`,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                            }
                        }
                    } else {
                        return await this.ingestStream(ISI, pathS);
                    }
                } catch (error) {
                    RK.logError(RK.LogSection.eHTTP,'open write stream failed',`onFinish catch error: ${error}`,{ pathSource: pathS, pathWebDAV: pathWD },'HTTP.Route.WebDAV');
                } finally {
                    callbackComplete(undefined);
                }
            }));

            // LOG.info('WebDAVFileSystem._openWriteStream callback()', LOG.LS.eHTTP);
            callback(undefined, BS);
        } catch (error) {
            RK.logError(RK.LogSection.eHTTP,'open write stream failed',`catch error: ${error}`,{ pathWebDAV: pathWD },'HTTP.Route.WebDAV');
        }
    }

    private async ingestStream(ISI: STORE.IngestStreamOrFileInput, pathS: string): Promise<void> {
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        if (!IAR.success)
            RK.logError(RK.LogSection.eHTTP,'ingest stream failed',`onFinish failed to ingest new asset version: ${IAR.error}`,{ pathSource: pathS, ingestSource: ISI },'HTTP.Route.WebDAV');

        const assetVersions: DBAPI.AssetVersion[] | null | undefined = IAR.assetVersions;
        if (!assetVersions || assetVersions.length === 0) {
            RK.logError(RK.LogSection.eHTTP,'ingest stream failed','onFinish failed to create new asset version',{ pathSource: pathS, ingestSource: ISI },'HTTP.Route.WebDAV');
            // await this.removeLock(pathWD, info.context, lockUUID);
            return;
        }

        if (assetVersions.length > 1)
            RK.logError(RK.LogSection.eHTTP,'ingest stream failed','created multiple asset versions, unexpectedly',{ pathSource: pathS, ingestSource: ISI },'HTTP.Route.WebDAV');

        const assetVersion: DBAPI.AssetVersion = assetVersions[0];
        // Update WebDAV resource
        const utcMS: number = assetVersion.DateCreated.getTime();
        let resource: FileSystemResource | undefined = this.getResource(pathS);
        if (!resource) {
            resource = new FileSystemResource(webdav.ResourceType.File, assetVersion.StorageSize, assetVersion.StorageHash, utcMS, utcMS);
            this.resources.set(pathS, resource);
        } else {
            resource.setSize(assetVersion.StorageSize);
            resource.etag = assetVersion.StorageHash;
            resource.lastModifiedDate = utcMS;
        }

        // Update WebDAV resource parent
        this.addParentResources(pathS, utcMS);
        // await this.removeLock(pathWD, info.context, lockUUID);
    }

    _mimeType(pathWD: webdav.Path, _info: webdav.MimeTypeInfo, callback: webdav.ReturnCallback<string>): void {
        const filePath: string = pathWD.toString();
        const fileName: string = path.basename(filePath);
        const mimeType: string = mime.lookup(fileName) || 'application/octet-stream';

        // LOG.info(`WebDAVFileSystem._mimeType(${filePath}): ${mimeType}`, LOG.LS.eHTTP);
        callback(undefined, mimeType);
    }

    _propertyManager(pathWD: webdav.Path, _info: webdav.PropertyManagerInfo, callback: webdav.ReturnCallback<webdav.IPropertyManager>): void {
        const WDM: WebDAVManagers = this.getManagers(pathWD.toString());
        callback(undefined, WDM.propertyManager);
    }

    _lockManager(pathWD: webdav.Path, _info: webdav.LockManagerInfo, callback: webdav.ReturnCallback<webdav.ILockManager>): void {
        const WDM: WebDAVManagers = this.getManagers(pathWD.toString());
        callback(undefined, WDM.lockManager);
    }

    async _type(pathWD: webdav.Path, _info: webdav.TypeInfo, callback: webdav.ReturnCallback<webdav.ResourceType>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'type', true, callback);
    }

    async _readDir(pathWD: webdav.Path, _info: webdav.ReadDirInfo, callback: webdav.ReturnCallback<string[] | webdav.Path[]>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'readDir', false, callback);
    }

    async _size(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'size', false, callback);
    }

    async _etag(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<string>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'etag', false, callback);
    }

    async _creationDate(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'creationDate', false, callback);
    }

    async _lastModifiedDate(pathWD: webdav.Path, _info: webdav.SizeInfo, callback: webdav.ReturnCallback<number>): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'lastModifiedDate', false, callback);
    }

    async _create(pathWD: webdav.Path, _info: webdav.CreateInfo, callback: webdav.SimpleCallback): Promise<void> {
        await this.getPropertyFromResource(pathWD, 'create', true, callback);
    }
}
