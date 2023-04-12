import * as path from 'path';
import * as ST from './SharedTypes';

export class OCFLObjectBase {
    protected _objectRoot: string = '';

    /** e.g. v1 */
    static versionFolderName(version: number): string {
        return `v${version}`;
    }

    /** e.g. v1/content */
    static versionContentPartialPath(version: number): string {
        return path.join(OCFLObjectBase.versionFolderName(version), ST.OCFLStorageObjectContentFolder);
    }

    /** e.g. STORAGEROOT/REPO/35/6a/19/356a192b7913b04c54574d18c28d46e6395428ab/ */
    get objectRoot(): string {
        return this._objectRoot;
    }

    /** e.g. STORAGEROOT/REPO/35/6a/19/356a192b7913b04c54574d18c28d46e6395428ab/v1 */
    versionRoot(version: number): string {
        return path.join(this._objectRoot, OCFLObjectBase.versionFolderName(version));
    }
}
