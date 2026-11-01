import { GetVocabularyInput, GetVocabularyResult } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';

const getVocabularyTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
    });

    describe('Query: getVocabulary', () => {
        test('returns the vocabulary for a seeded id, and null for a non-existent id', async () => {
            const all: DBAPI.Vocabulary[] | null = await DBAPI.Vocabulary.fetchAll();
            if (all && all.length > 0) {
                const input: GetVocabularyInput = { idVocabulary: all[0].idVocabulary };
                const { Vocabulary }: GetVocabularyResult = await graphQLApi.getVocabulary(input);
                expect(Vocabulary).toBeTruthy();
                expect(Vocabulary?.idVocabulary).toBe(all[0].idVocabulary);
            }

            const { Vocabulary: missing }: GetVocabularyResult = await graphQLApi.getVocabulary({ idVocabulary: 0 });
            expect(missing).toBeNull();
        });
    });
};

export default getVocabularyTest;
