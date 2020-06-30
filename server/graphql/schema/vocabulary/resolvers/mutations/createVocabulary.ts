import { CreateVocabularyResult, MutationCreateVocabularyArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createVocabulary(_: Parent, args: MutationCreateVocabularyArgs, context: Context): Promise<CreateVocabularyResult> {
    const { input } = args;
    const { idVocabularySet, SortOrder } = input;
    const { prisma } = context;

    const vocabularyArgs = {
        idVocabulary: 0,
        idVocabularySet,
        SortOrder
    };

    const Vocabulary = await DBAPI.Vocabulary.create(prisma, vocabularyArgs);

    return { Vocabulary };
}
