import { GetVocabularyResult, GetVocabularyInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import * as DBAPI from '../../../../../db';

type Args = { input: GetVocabularyInput };

export default async function getVocabulary(_: Parent, args: Args, context: Context): Promise<GetVocabularyResult> {
    const { input } = args;
    const { idVocabulary } = input;
    const { prisma } = context;

    const Vocabulary = await DBAPI.Vocabulary.fetch(prisma, idVocabulary);

    return { Vocabulary };
}
