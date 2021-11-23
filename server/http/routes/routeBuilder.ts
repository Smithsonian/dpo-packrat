import { Config } from '../../config';

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
        return RouteBuilder.ApplyPrefix(`/download?idAssetVersion=${idAssetVersion}`, eMode);
    }

    /** Downloads the most recent asset version of the specified asset */
    static DownloadAsset(idAsset: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idAsset=${idAsset}`, eMode);
    }

    /** Computes the assets attached to system object with idSystemObject. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip. */
    static DownloadSystemObject(idSystemObject: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idSystemObject=${idSystemObject}`, eMode);
    }

    /** Computes the assets attached to system object with idSystemObject. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
     * If path is specified, computes the asset attached to system object with idSystemObject, found at the path /FOO/BAR.
     */
    static DownloadSystemObjectPath(idSystemObject: number, path?: string | undefined, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idSystemObject-${idSystemObject}${path}`, eMode);
    }

    /** Computes the assets attached to system object version with idSystemObjectVersion. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip. */
    static DownloadSystemObjectVersion(idSystemObjectVersion: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idSystemObjectVersion=${idSystemObjectVersion}`, eMode);
    }

    /** Downloads the comment for the system object version with idSystemObjectVersion */
    static DownloadSystemObjectVersionComment(idSystemObjectVersion: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idSystemObjectVersionComment=${idSystemObjectVersion}`, eMode);
    }

    /** Downloads the WorkflowReport(s) for the specified workflow ID */
    static DownloadWorkflow(idWorkflow: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idWorkflow=${idWorkflow}`, eMode);
    }

    /** Downloads the specified WorkflowReport */
    static DownloadWorkflowReport(idWorkflowReport: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idWorkflowReport=${idWorkflowReport}`, eMode);
    }

    /** Downloads the WorkflowReport(s) for workflows in the specified workflow set */
    static DownloadWorkflowSet(idWorkflowSet: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idWorkflowSet=${idWorkflowSet}`, eMode);
    }

    /** Downloads the JobRun output for idJobRun with the specified ID */
    static DownloadJobRun(idJobRun: number, eMode?: eHrefMode | undefined): string {
        return RouteBuilder.ApplyPrefix(`/download?idJobRun=${idJobRun}`, eMode);
    }

    private static ApplyPrefix(path: string, eMode?: eHrefMode | undefined): string {
        let prefix: string = '';
        switch (eMode) {
            case undefined: break;
            case eHrefMode.eNone: break;
            case eHrefMode.ePrependClientURL: prefix = Config.http.clientUrl; break;
            case eHrefMode.ePrependServerURL: prefix = Config.http.serverUrl; break;
        }

        return (prefix) ? prefix + (path.startsWith('/') ? path : '/' + path) : path;
    }
}