/**
 * GraphQL Test suite
 */
import TestSuiteUtils from './utils';
import getUserTest from './queries/user/getUser.test';
import getCurrentUserTest from './queries/user/getCurrentUser.test';
import getAccessPolicyTest from './queries/accesscontrol/getAccessPolicy.test';
import getAssetTest from './queries/asset/getAsset.test';
import getCaptureDataTest from './queries/capturedata/getCaptureData.test';
import getCaptureDataPhotoTest from './queries/capturedata/getCaptureDataPhoto.test';
import getLicenseTest from './queries/license/getLicense.test';
import getModelTest from './queries/model/getModel.test';
import getSceneTest from './queries/scene/getScene.test';
import getUnitTest from './queries/unit/getUnit.test';
import getVocabularyTest from './queries/vocabulary/getVocabulary.test';
import getWorkflowTest from './queries/workflow/getWorkflow.test';

import createCaptureDataTest from './mutations/capturedata/createCaptureData.test';
import createModelTest from './mutations/model/createModel.test';
import createSceneTest from './mutations/scene/createScene.test';
import createUnitTest from './mutations/unit/createUnit.test';
import createProjectTest from './mutations/unit/createProject.test';
import createItemTest from './mutations/unit/createItem.test';
import createSubjectTest from './mutations/unit/createSubject.test';
import createUserTest from './mutations/user/createUser.test';
import createVocabularyTest from './mutations/vocabulary/createVocabulary.test';
import createVocabularySetTest from './mutations/vocabulary/createVocabularySet.test';

const utils = new TestSuiteUtils();
utils.setupJest();

describe('GraphQL Test Suite', () => {
    // Queries
    getAccessPolicyTest(utils);
    getAssetTest(utils);
    getCaptureDataTest(utils);
    getCaptureDataPhotoTest(utils);
    getLicenseTest(utils);
    getModelTest(utils);
    getSceneTest(utils);
    getUnitTest(utils);
    getUserTest(utils);
    getCurrentUserTest(utils);
    getVocabularyTest(utils);
    getWorkflowTest(utils);

    // Mutations
    createCaptureDataTest(utils);
    createModelTest(utils);
    createSceneTest(utils);
    createUnitTest(utils);
    createProjectTest(utils);
    createItemTest(utils);
    createSubjectTest(utils);
    createUserTest(utils);
    createVocabularyTest(utils);
    createVocabularySetTest(utils);
});
