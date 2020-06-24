/**
 * Type resolver for IntermediaryFile
 */
import * as DB from '@prisma/client';
import { IntermediaryFile } from '../../../../../types/graphql';

const IntermediaryFile = {};

export function parseIntermediaryFiles(foundIntermediaryFiles: DB.IntermediaryFile[] | null): IntermediaryFile[] | null {
    let intermediaryFiles;
    if (foundIntermediaryFiles) {
        intermediaryFiles = foundIntermediaryFiles.map(intermediaryFile => parseIntermediaryFile(intermediaryFile));
    }

    return intermediaryFiles;
}

export function parseIntermediaryFile(foundIntermediaryFile: DB.IntermediaryFile | null): IntermediaryFile | null {
    let intermediaryFile;
    if (foundIntermediaryFile) {
        const { idIntermediaryFile, DateCreated } = foundIntermediaryFile;
        intermediaryFile = {
            id: String(idIntermediaryFile),
            dateCreated: DateCreated
        };
    }

    return intermediaryFile;
}

export default IntermediaryFile;
