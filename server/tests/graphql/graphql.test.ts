/**
 * GraphQL Test suite
 */
/* Queries */
import TestSuiteUtils from './utils';
import getUserTest from './queries/user/getUser.test';
import getCurrentUserTest from './queries/user/getCurrentUser.test';
import getAllUsersTest from './queries/user/getAllUsers.test';
import getAccessPolicyTest from './queries/accesscontrol/getAccessPolicy.test';
import getAssetTest from './queries/asset/getAsset.test';
import getCaptureDataTest from './queries/capturedata/getCaptureData.test';
import getCaptureDataPhotoTest from './queries/capturedata/getCaptureDataPhoto.test';
import getLicenseTest from './queries/license/getLicense.test';
import getModelTest from './queries/model/getModel.test';
import getModelConstellationTest from './queries/model/getModelConstellation.test';
import getModelConstellationForAssetVersionTest from './queries/model/getModelConstellationForAssetVersion.test';
import getSceneTest from './queries/scene/getScene.test';
import getUnitTest from './queries/unit/getUnit.test';
import getVocabularyTest from './queries/vocabulary/getVocabulary.test';
import getWorkflowTest from './queries/workflow/getWorkflow.test';
import getVocabularyEntriesTest from './queries/vocabulary/getVocabularyEntries.test';
import searchIngestionSubjectsTest from './queries/unit/searchIngestionSubjects.test';
import areCameraSettingsUniformTest from './queries/ingestion/areCameraSettingsUniform.test';
import getContentsForAssetVersionsTest from './queries/asset/getContentsForAssetVersions.test';
import getSubjectsForUnitTest from './queries/unit/getSubjectsForUnit.test';
import getItemsForSubjectTest from './queries/unit/getItemsForSubject.test';
import getAssetVersionsDetailsTest from './queries/asset/getAssetVersionsDetails.test';
import getProjectDocumentationTest from './queries/unit/getProjectDocumentation.test';
import getIntermediaryFileTest from './queries/scene/getIntermediaryFile.test';
import getSourceObjectIdentiferTest from './queries/systemobject/getSourceObjectIdentifer.test';
import getSystemObjectDetailsTest from './queries/systemobject/getSystemObjectDetails.test';
import getProjectListTest from './queries/project/getProjectList.test';
import getUnitsFromNameSearchTest from './queries/unit/getUnitsFromNameSearch.test';

/* Mutations */
import createCaptureDataTest from './mutations/capturedata/createCaptureData.test';
import createUnitTest from './mutations/unit/createUnit.test';
import createProjectTest from './mutations/unit/createProject.test';
import createSubjectTest from './mutations/unit/createSubject.test';
import createUserTest from './mutations/user/createUser.test';
import updateUserTest from './mutations/user/updateUser.test';
import createVocabularyTest from './mutations/vocabulary/createVocabulary.test';
import createVocabularySetTest from './mutations/vocabulary/createVocabularySet.test';
import uploadAssetTest from './mutations/asset/uploadAsset.test';
import ingestDataTest from './mutations/ingestion/ingestData.test';
import discardUploadedAssetVersionsTest from './mutations/asset/discardUploadedAssetVersions.test';

const utils = new TestSuiteUtils();
utils.setupJest();

describe('GraphQL Test Suite', () => {
    //Queries
    getAccessPolicyTest(utils);
    getAssetTest(utils);
    getCaptureDataTest(utils);
    getCaptureDataPhotoTest(utils);
    getLicenseTest(utils);
    getModelTest(utils);
    getModelConstellationTest(utils);
    getModelConstellationForAssetVersionTest(utils);
    getSceneTest(utils);
    getUnitTest(utils);
    getUserTest(utils);
    getAllUsersTest(utils);
    getCurrentUserTest(utils);
    getVocabularyTest(utils);
    getWorkflowTest(utils);
    getVocabularyEntriesTest(utils);
    searchIngestionSubjectsTest(utils);
    areCameraSettingsUniformTest(utils);
    getContentsForAssetVersionsTest(utils);
    getSubjectsForUnitTest(utils);
    getItemsForSubjectTest(utils);
    getAssetVersionsDetailsTest(utils);
    getProjectDocumentationTest(utils);
    getIntermediaryFileTest(utils);
    getSourceObjectIdentiferTest(utils);
    getSystemObjectDetailsTest(utils);
    getProjectListTest(utils);
    getUnitsFromNameSearchTest(utils);

    // Mutations
    createCaptureDataTest(utils);
    createUnitTest(utils);
    createProjectTest(utils);
    createSubjectTest(utils);
    createUserTest(utils);
    updateUserTest(utils);
    createVocabularyTest(utils);
    createVocabularySetTest(utils);
    uploadAssetTest(utils);
    ingestDataTest(utils);
    discardUploadedAssetVersionsTest(utils);
});
