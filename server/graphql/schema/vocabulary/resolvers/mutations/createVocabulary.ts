import { CreateVocabularyResult, MutationCreateVocabularyArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createVocabulary(_: Parent, args: MutationCreateVocabularyArgs): Promise<CreateVocabularyResult> {
    const { input } = args;
    const { idVocabularySet, SortOrder } = input;

    const vocabularyArgs = {
        idVocabulary: 0,
        idVocabularySet,
        SortOrder
    };

    const Vocabulary = new DBAPI.Vocabulary(vocabularyArgs);
    await Vocabulary.create();
    return { Vocabulary };
}
