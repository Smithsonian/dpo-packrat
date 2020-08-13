import { VocabularyEntry, QueryGetVocabularyEntriesArgs, GetVocabularyEntriesResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import { VocabularyCache } from '../../../../../cache';

export default async function getVocabularyEntries(_: Parent, args: QueryGetVocabularyEntriesArgs): Promise<GetVocabularyEntriesResult> {
    const { input } = args;
    const { eVocabSetIDs } = input;

    const VocabularyEntries: VocabularyEntry[] = [];

    for (let i = 0; i < eVocabSetIDs.length; i++) {
        const eVocabSetID = eVocabSetIDs[i];

        const VocabularyEntry: VocabularyEntry = {
            eVocabSetID,
            Vocabulary: []
        };

        const Vocabulary = await VocabularyCache.vocabularySetEntriesByEnum(eVocabSetID);

        if (Vocabulary) {
            VocabularyEntry.Vocabulary = Vocabulary;
        }

        VocabularyEntries.push(VocabularyEntry);
    }

    return { VocabularyEntries };
}
