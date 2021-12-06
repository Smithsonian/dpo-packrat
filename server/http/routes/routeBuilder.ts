import { Config } from '../../config';
import { Downloader } from './download';

export enum eHrefMode {
    eNone = 0,
    ePrependClientURL = 1,
    ePrependServerURL = 2,
}

export class RouteBuilder {
    static RepositoryDetails(idSystemObject: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/repository/details/${idSystemObject}`, eMode);
    }

    /** Downloads the specified version of the specified asset */
    static DownloadAssetVersion(idAssetVersion: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idAssetVersion=${idAssetVersion}`, eMode);
    }

    /** Downloads the most recent asset version of the specified asset */
    static DownloadAsset(idAsset: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idAsset=${idAsset}`, eMode);
    }

    /** Computes the assets attached to system object with idSystemObject. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip. */
    static DownloadSystemObject(idSystemObject: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idSystemObject=${idSystemObject}`, eMode);
    }

    /** Computes the assets attached to system object with idSystemObject. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
     * If path is specified, computes the asset attached to system object with idSystemObject, found at the path /FOO/BAR.
     */
    static DownloadSystemObjectPath(idSystemObject: number, path?: string | undefined, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idSystemObject-${idSystemObject}${path}`, eMode);
    }

    /** Computes the assets attached to system object version with idSystemObjectVersion. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip. */
    static DownloadSystemObjectVersion(idSystemObjectVersion: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idSystemObjectVersion=${idSystemObjectVersion}`, eMode);
    }

    /** Downloads the comment for the system object version with idSystemObjectVersion */
    static DownloadMetadata(idMetadata: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idMetadata=${idMetadata}`, eMode);
    }

    /** Downloads the WorkflowReport(s) for the specified workflow ID */
    static DownloadWorkflow(idWorkflow: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idWorkflow=${idWorkflow}`, eMode);
    }

    /** Downloads the specified WorkflowReport */
    static DownloadWorkflowReport(idWorkflowReport: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idWorkflowReport=${idWorkflowReport}`, eMode);
    }

    /** Downloads the WorkflowReport(s) for workflows in the specified workflow set */
    static DownloadWorkflowSet(idWorkflowSet: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idWorkflowSet=${idWorkflowSet}`, eMode);
    }

    /** Downloads the JobRun output for idJobRun with the specified ID */
    static DownloadJobRun(idJobRun: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idJobRun=${idJobRun}`, eMode);
    }

    /** Downloads the comment for the system object version with idSystemObjectVersion */
    static DownloadSystemObjectVersionComment(idSystemObjectVersion: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`${Downloader.httpRoute}?idSystemObjectVersionComment=${idSystemObjectVersion}`, eMode);
    }

    private static ApplyPrefix(path: string, eMode?: eHrefMode | undefined): string {
        let prefix: string = '';
        switch (eMode) {
            case undefined: break;
            case eHrefMode.eNone: break;
            case eHrefMode.ePrependClientURL: prefix = Config.http.clientUrl; break;
            case eHrefMode.ePrependServerURL: prefix = Config.http.serverUrl; break;
        }

        if (!prefix)
            return path;

        const prefixEndsWithSlash: boolean = prefix.endsWith('/');
        const pathStartsWithSlash: boolean = path.startsWith('/');
        const slashCount: number = (prefixEndsWithSlash ? 1 : 0) + (pathStartsWithSlash ? 1 : 0);
        if (slashCount === 1)                           // exactly one separator,
            return prefix + path;                       // just concat
        else if (slashCount === 0)                      // exactly no separators,
            return `${prefix}/${path}`;                 // concat with slash separator
        else                                            // exactly two separators,
            return `${prefix}${path.substring(1)}`;     // remove one separator
    }
}