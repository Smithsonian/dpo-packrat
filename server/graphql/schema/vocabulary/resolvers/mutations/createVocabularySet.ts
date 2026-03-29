import { CreateVocabularySetResult, MutationCreateVocabularySetArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function createVocabularySet(_: Parent, args: MutationCreateVocabularySetArgs): Promise<CreateVocabularySetResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

    const { input } = args;
    const { Name, SystemMaintained } = input;

    const vocabularySetArgs = {
        idVocabularySet: 0,
        Name,
        SystemMaintained
    };

    const VocabularySet = new DBAPI.VocabularySet(vocabularySetArgs);
    await VocabularySet.create();
    return { VocabularySet };
}
