/**
 * Type resolver for VocabularySet
 */
import { VocabularySet } from '../../../../../types/graphql';
import { PrismaClient } from '@prisma/client';
import * as DB from '@prisma/client';
import { fetchVocabularySetForVocabularyID } from '../../../../../db';

const VocabularySet = {};

export async function resolveVocabularySetByVocabularyID(prisma: PrismaClient, vocabularyId: number): Promise<VocabularySet | null> {
    const foundVocabularySet = await fetchVocabularySetForVocabularyID(prisma, vocabularyId);

    return parseVocabularySet(foundVocabularySet);
}

export function parseVocabularySet(foundVocabularySet: DB.VocabularySet | null): VocabularySet | null {
    let vocabularySet;
    if (foundVocabularySet) {
        const { idVocabularySet, Name, SystemMaintained } = foundVocabularySet;
        vocabularySet = {
            idVocabularySet: String(idVocabularySet),
            Name,
            SystemMaintained: Boolean(SystemMaintained)
        };
    }

    return vocabularySet;
}

export default VocabularySet;
