export class RouteBuilder {
    static RepositoryDetails(idSystemObject: number): string {
        return `/repository/details/${idSystemObject}`;
    }

    /** Downloads the specified version of the specified asset */
    static DownloadAssetVersion(idAssetVersion: number): string {
        return `/download?idAssetVersion=${idAssetVersion}`;
    }

    /** Downloads the most recent asset version of the specified asset */
    static DownloadAsset(idAsset: number): string {
        return `/download?idAsset=${idAsset}`;
    }

    /** Computes the assets attached to system object with idSystemObject. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip. */
    static DownloadSystemObject(idSystemObject: number): string {
        return `/download?idSystemObject=${idSystemObject}`;
    }

    /** Computes the assets attached to system object with idSystemObject. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip.
     * If path is specified, computes the asset attached to system object with idSystemObject, found at the path /FOO/BAR.
     */
    static DownloadSystemObjectPath(idSystemObject: number, path?: string | undefined): string {
        return `/download?idSystemObject-${idSystemObject}${path}`;
    }

    /** Computes the assets attached to system object version with idSystemObjectVersion. If just one, downloads it alone.  If multiple, computes a zip and downloads that zip. */
    static DownloadSystemObjectVersion(idSystemObjectVersion: number): string {
        return `/download?idSystemObjectVersion=${idSystemObjectVersion}`;
    }
}