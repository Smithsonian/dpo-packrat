import { CreateVocabularySetResult, MutationCreateVocabularySetArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createVocabularySet(_: Parent, args: MutationCreateVocabularySetArgs): Promise<CreateVocabularySetResult> {
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
