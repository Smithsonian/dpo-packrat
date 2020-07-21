import { CreateVocabularyResult, MutationCreateVocabularyArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createVocabulary(_: Parent, args: MutationCreateVocabularyArgs): Promise<CreateVocabularyResult> {
    const { input } = args;
    const { idVocabularySet, SortOrder, Term } = input;

    const vocabularyArgs = {
        idVocabulary: 0,
        idVocabularySet,
        SortOrder,
        Term
    };

    const Vocabulary = new DBAPI.Vocabulary(vocabularyArgs);
    await Vocabulary.create();
    return { Vocabulary };
}
