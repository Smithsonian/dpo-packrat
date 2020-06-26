/**
 * GraphQL Test suite
 */
import TestSuiteUtils from './utils';
import getUserTest from './queries/user/getUser.test';
import getAccessPolicyTest from './queries/accesscontrol/getAccessPolicy.test';
import getAssetTest from './queries/asset/getAsset.test';
import getCaptureDataTest from './queries/capturedata/getCaptureData.test';
import getLicenseTest from './queries/license/getLicense.test';
import getModelTest from './queries/model/getModel.test';
import getSceneTest from './queries/scene/getScene.test';
import getUnitTest from './queries/unit/getUnit.test';
import getVocabularyTest from './queries/vocabulary/getVocabulary.test';
import getWorkflowTest from './queries/workflow/getWorkflow.test';

const utils = new TestSuiteUtils();
utils.setupJest();

describe('GraphQL Test Suite', () => {
    getAccessPolicyTest(utils);
    getAssetTest(utils);
    getCaptureDataTest(utils);
    getLicenseTest(utils);
    getModelTest(utils);
    getSceneTest(utils);
    getUnitTest(utils);
    getUserTest(utils);
    getVocabularyTest(utils);
    getWorkflowTest(utils);
});
