import { CreateVocabularyResult, MutationCreateVocabularyArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';
import { withAuditTransaction } from '../../../../../audit/withAuditTransaction';

export default async function createVocabulary(_: Parent, args: MutationCreateVocabularyArgs): Promise<CreateVocabularyResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

    const { input } = args;
    const { idVocabularySet, SortOrder, Term } = input;

    return withAuditTransaction(async () => {
        const vocabularyArgs = {
            idVocabulary: 0,
            idVocabularySet,
            SortOrder,
            Term
        };

        const Vocabulary = new DBAPI.Vocabulary(vocabularyArgs);
        await Vocabulary.create();
        return { Vocabulary };
    });
}
