import getUser from './queries/user/getUser';
import getAccessPolicy from './queries/accesscontrol/getAccessPolicy';
import getAsset from './queries/asset/getAsset';
import getCaptureData from './queries/capturedata/getCaptureData';
import getLicense from './queries/license/getLicense';
import getModel from './queries/model/getModel';
import getScene from './queries/scene/getScene';
import getUnit from './queries/unit/getUnit';
import getVocabulary from './queries/vocabulary/getVocabulary';
import getWorkflow from './queries/workflow/getWorkflow';

const allQueries = {
    getUser,
    getAccessPolicy,
    getAsset,
    getCaptureData,
    getLicense,
    getModel,
    getScene,
    getUnit,
    getVocabulary,
    getWorkflow
};

export { allQueries };
