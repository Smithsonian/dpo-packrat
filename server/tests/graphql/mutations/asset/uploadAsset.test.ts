import fs from 'fs';
import { join } from 'path';
import GraphQLApi from '../../../../graphql';
import TestSuiteUtils from '../../utils';
import { UploadAssetInput, UploadStatus } from '../../../../types/graphql';
import { Context } from '../../../../types/resolvers';
import { CreateUserInput } from '../../../../types/graphql';
import * as CACHE from '../../../../cache';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../../../../utils/helpers';
import { Config } from '../../../../config';

let rootRepositoryOrig: string;
let rootRepositoryNew: string;
let rootStagingOrig: string;
let rootStagingNew: string;

beforeAll(() => {
    rootRepositoryOrig = Config.storage.rootRepository;
    rootStagingOrig = Config.storage.rootStaging;

    rootRepositoryNew = join('var', 'test', H.Helpers.randomSlug());
    rootStagingNew = join('var', 'test', H.Helpers.randomSlug());

    Config.storage.rootRepository = rootRepositoryNew;
    Config.storage.rootStaging = rootStagingNew;
});

afterAll(async done => {
    Config.storage.rootRepository = rootRepositoryOrig;
    Config.storage.rootStaging = rootStagingOrig;
    await H.Helpers.removeDirectory(rootRepositoryNew, true);
    await H.Helpers.removeDirectory(rootStagingNew, true);
    // await H.Helpers.sleep(2000);
    done();
});

const uploadAssetTest = (utils: TestSuiteUtils): void => {
    let graphQLApi: GraphQLApi;
    let createUserInput: () => CreateUserInput;

    beforeAll(() => {
        graphQLApi = utils.graphQLApi;
        createUserInput = utils.createUserInput;
    });

    describe('Mutation: uploadAsset', () => {
        test('should work with valid input', async () => {
            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            if (User) {
                const context: Context = {
                    user: User,
                    isAuthenticated: true
                };

                const filename: string = 'mock.upload.ts';
                const path: string = join(__dirname, `../../../mock/graphql/${filename}`);
                const file = fs.createReadStream(path);

                const Vocabulary = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeOther);
                if (Vocabulary) {
                    const { idVocabulary } = Vocabulary;

                    const uploadAssetInput: UploadAssetInput = {
                        file: {
                            createReadStream: () => file,
                            filename,
                            encoding: 'us-ascii',
                            mimetype: 'text/plain'
                        },
                        type: idVocabulary
                    };
                    const { status } = await graphQLApi.uploadAsset(uploadAssetInput, context);
                    expect(status).toBe(UploadStatus.Complete);
                }
            }
        });

        test('should fail with invalid input', async () => {
            const userInput = createUserInput();
            const { User } = await graphQLApi.createUser(userInput);

            if (User) {
                const context: Context = {
                    user: User,
                    isAuthenticated: true
                };

                const Vocabulary = await CACHE.VocabularyCache.vocabularySetEntriesByEnum(COMMON.eVocabularySetID.eAssetAssetType);

                if (Vocabulary) {
                    const [{ idVocabulary }] = Vocabulary;
                    const uploadAssetInput: UploadAssetInput = {
                        file: null,
                        type: idVocabulary
                    };

                    await expect(graphQLApi.uploadAsset(uploadAssetInput, context)).rejects.toThrow();
                }
            }
        });
    });
};

export default uploadAssetTest;
