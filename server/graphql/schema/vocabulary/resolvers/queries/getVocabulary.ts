import { GetVocabularyResult, GetVocabularyInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { resolveVocabularyByID } from '../types/Vocabulary';

type Args = { input: GetVocabularyInput };

export default async function getVocabulary(_: Parent, args: Args, context: Context): Promise<GetVocabularyResult> {
    const { input } = args;
    const { id } = input;
    const { prisma } = context;

    const vocabulary = await resolveVocabularyByID(prisma, Number.parseInt(id));

    if (vocabulary) {
        return { vocabulary };
    }

    return { vocabulary: null };
}
