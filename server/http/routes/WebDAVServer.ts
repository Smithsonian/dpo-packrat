/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../utils/logger';

// import * as path from 'path';
import { v2 as webdav } from 'webdav-server';

////////////////////////////////////////////////////////////////////////////////

export class WebDAVServer {
    protected server: webdav.WebDAVServer;
    protected VFS: webdav.VirtualFileSystem;

    protected activeShares: Set<string> = new Set<string>();

    private static _webDavServer: WebDAVServer | null = null;

    static server(): WebDAVServer {
        if (!WebDAVServer._webDavServer)
            WebDAVServer._webDavServer = new WebDAVServer();
        return WebDAVServer._webDavServer;
    }

    public webdav(): webdav.WebDAVServer {
        return this.server;
    }

    constructor()     {
        this.server = new webdav.WebDAVServer(/* { port: webDAVPort } */);
        const FSS: webdav.FileSystemSerializer = new WebDAVFileSystem();
        this.VFS = new webdav.VirtualFileSystem(FSS);

        this.server.afterRequest((req, next) => {
            // Display the method, the URI, the returned status code and the returned message
            LOG.info(`WEBDAV ${req.request.method} ${req.request.url} ${req.response.statusCode} ${req.response.statusMessage}`, LOG.LS.eHTTP);
            next();
        });
    }

    // start(): Promise<void>
    // {
    //     return new Promise((resolve, reject) => {
    //         this.webDAVServer.start(() => {
    //             console.log(`WebDAV server listening on port ${this.webDAVServer.options.port}`);
    //             resolve();
    //         });
    //     });
    // }

    async grantAccess(shareName: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.activeShares.has(shareName)) {
                const msg: string = `WebDAVServer.grantAccess(${shareName}): already granted`;
                LOG.info(msg, LOG.LS.eHTTP);
                return resolve(true);
            }

            this.activeShares.add(shareName);

            this.server.setFileSystem('/' + shareName, this.VFS, success => {
                if (!success) {
                    this.activeShares.delete(shareName);
                    const error: string = `WebDAVServer.grantAccess(${shareName}): failed to mount WebDAV file system`;
                    LOG.info(error, LOG.LS.eHTTP);
                    return resolve(false);
                }

                return resolve(true);
            });
        });
    }

    async revokeAccess(shareName: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this.activeShares.has(shareName)) {
                const error: string = `WebDAVServer.revokeAccess(${shareName}): invalid share name`;
                LOG.error(error, LOG.LS.eHTTP);
                return resolve(false);
            }

            this.activeShares.delete(shareName);

            this.server.removeFileSystem('/' + shareName, removeCount => {
                if (!removeCount) {
                    const error: string = `WebDAVServer.revokeAccess(${shareName}): failed to unmount WebDAV file system`;
                    LOG.error(error, LOG.LS.eHTTP);
                    return resolve(false);
                }

                return resolve(true);
            });
        });
    }
}

class WebDAVFileSystem implements webdav.FileSystemSerializer {
    uid(): string {
        return 'Packrat-WebDAVFileSystem-v1';
    }
    serialize(_fs: webdav.FileSystem, _callback: webdav.ReturnCallback<any>): void {

    }
    unserialize(_serializedData: any, _callback: webdav.ReturnCallback<webdav.FileSystem>): void {

    }
}