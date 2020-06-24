/**
 * Type resolver for CaptureDataFile
 */
import * as DB from '@prisma/client';
import { CaptureDataFile } from '../../../../../types/graphql';

const CaptureDataFile = {};

export function parseCaptureDataFiles(foundCaptureDataFiles: DB.CaptureDataFile[] | null): CaptureDataFile[] | null {
    let captureDataFiles;
    if (foundCaptureDataFiles) {
        captureDataFiles = foundCaptureDataFiles.map(captureDataFile => parseCaptureDataFile(captureDataFile));
    }

    return captureDataFiles;
}

export function parseCaptureDataFile(foundCaptureDataFile: DB.CaptureDataFile | null): CaptureDataFile | null {
    let captureDataFile;
    if (foundCaptureDataFile) {
        const { idCaptureDataFile, CompressedMultipleFiles } = foundCaptureDataFile;
        captureDataFile = {
            idCaptureDataFile: String(idCaptureDataFile),
            CompressedMultipleFiles: Boolean(CompressedMultipleFiles)
        };
    }

    return captureDataFile;
}

export default CaptureDataFile;
