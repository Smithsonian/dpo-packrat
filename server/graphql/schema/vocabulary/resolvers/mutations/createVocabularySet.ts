import { CreateVocabularySetResult, MutationCreateVocabularySetArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createVocabularySet(_: Parent, args: MutationCreateVocabularySetArgs, context: Context): Promise<CreateVocabularySetResult> {
    const { input } = args;
    const { Name, SystemMaintained } = input;
    const { prisma } = context;

    const vocabularySetArgs = {
        idVocabularySet: 0,
        Name,
        SystemMaintained
    };

    const VocabularySet = await DBAPI.createVocabularySet(prisma, vocabularySetArgs);

    return { VocabularySet };
}
