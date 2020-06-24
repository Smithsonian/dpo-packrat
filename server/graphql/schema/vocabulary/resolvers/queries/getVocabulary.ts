import { GetVocabularyResult, GetVocabularyInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveVocabularyByID } from '../types/Vocabulary';

type Args = { input: GetVocabularyInput };

export default async function getVocabulary(_: Parent, args: Args, context: Context): Promise<GetVocabularyResult> {
    const { input } = args;
    const { idVocabulary } = input;
    const { prisma } = context;

    const Vocabulary = await resolveVocabularyByID(prisma, Number.parseInt(idVocabulary));

    if (Vocabulary) {
        return { Vocabulary };
    }

    return { Vocabulary: null };
}
