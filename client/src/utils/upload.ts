/**
 * Upload utilities
 *
 * Utils for upload specific components, functionality.
 */
import randomize from 'randomatic';

const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const sizesMax = sizes.length - 1;

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;

    let i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i > sizesMax)
        i = sizesMax;

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function generateFileId(): string {
    return randomize('Aa', 6);
}
