import { CreateModelInput } from '../../../../types/graphql';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import * as DBAPI from '../../../../db';
import { PrismaClient } from '@prisma/client';

const createModelTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let prisma: PrismaClient;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        prisma = utils.prisma;
    });

    describe('Mutation: createModel', () => {
        test('should work with valid input', async () => {
            const vocabularySetArgs = {
                Name: 'Test Vocabulary Set',
                SystemMaintained: false,
                idVocabularySet: 0
            };

            const VocabularySet = await DBAPI.createVocabularySet(prisma, vocabularySetArgs);
            expect(VocabularySet).toBeTruthy();

            if (VocabularySet) {
                const vocabularyArgs = {
                    idVocabularySet: VocabularySet.idVocabularySet,
                    SortOrder: 0,
                    idVocabulary: 0
                };

                const Vocabulary = await DBAPI.Vocabulary.create(prisma, vocabularyArgs);
                expect(Vocabulary).toBeTruthy();

                if (Vocabulary) {
                    const modelArgs: CreateModelInput = {
                        Authoritative: true,
                        idVCreationMethod: 0,
                        idVModality: 0,
                        idVPurpose: 0,
                        idVUnits: 0,
                        Master: true
                    };

                    const { Model } = await graphQLApi.createModel(modelArgs);
                    expect(Model).toBeTruthy();
                }
            }
        });
    });
};

export default createModelTest;
