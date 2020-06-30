// Queries
import getUser from './queries/user/getUser';
import getAccessPolicy from './queries/accesscontrol/getAccessPolicy';
import getAsset from './queries/asset/getAsset';
import getCaptureData from './queries/capturedata/getCaptureData';
import getLicense from './queries/license/getLicense';
import getModel from './queries/model/getModel';
import getScene from './queries/scene/getScene';
import getUnit from './queries/unit/getUnit';
import getProject from './queries/unit/getProject';
import getItem from './queries/unit/getItem';
import getSubject from './queries/unit/getSubject';
import getVocabulary from './queries/vocabulary/getVocabulary';
import getWorkflow from './queries/workflow/getWorkflow';

// Mutations
import createUser from './mutations/user/createUser';
import createCaptureData from './mutations/capturedata/createCaptureData';
import createModel from './mutations/model/createModel';
import createScene from './mutations/scene/createScene';
import createUnit from './mutations/unit/createUnit';
import createProject from './mutations/unit/createProject';
import createItem from './mutations/unit/createItem';
import createSubject from './mutations/unit/createSubject';
import createVocabulary from './mutations/vocabulary/createVocabulary';
import createVocabularySet from './mutations/vocabulary/createVocabularySet';

const allQueries = {
    getUser,
    getAccessPolicy,
    getAsset,
    getCaptureData,
    getLicense,
    getModel,
    getScene,
    getUnit,
    getProject,
    getItem,
    getSubject,
    getVocabulary,
    getWorkflow,
    createUser,
    createCaptureData,
    createModel,
    createScene,
    createUnit,
    createProject,
    createItem,
    createSubject,
    createVocabulary,
    createVocabularySet
};

export { allQueries };
