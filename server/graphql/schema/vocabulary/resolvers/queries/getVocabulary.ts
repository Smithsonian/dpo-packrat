import { GetVocabularyResult, GetVocabularyInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

import * as DBAPI from '../../../../../db';

type Args = { input: GetVocabularyInput };

export default async function getVocabulary(_: Parent, args: Args): Promise<GetVocabularyResult> {
    const { input } = args;
    const { idVocabulary } = input;

    const Vocabulary = await DBAPI.Vocabulary.fetch(idVocabulary);
    return { Vocabulary };
}
