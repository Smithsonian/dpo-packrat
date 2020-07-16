/**
 * Type resolver for SystemObject
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const SystemObject = {
    Actor: async (parent: Parent): Promise<DBAPI.Actor | null> => {
        return await DBAPI.Actor.fetch(parent.idActor);
    },
    Asset: async (parent: Parent): Promise<DBAPI.Asset | null> => {
        return await DBAPI.Asset.fetch(parent.idAsset);
    },
    AssetVersion: async (parent: Parent): Promise<DBAPI.AssetVersion | null> => {
        return await DBAPI.AssetVersion.fetch(parent.idAssetVersion);
    },
    CaptureData: async (parent: Parent): Promise<DBAPI.CaptureData | null> => {
        return await DBAPI.CaptureData.fetch(parent.idCaptureData);
    },
    IntermediaryFile: async (parent: Parent): Promise<DBAPI.IntermediaryFile | null> => {
        return await DBAPI.IntermediaryFile.fetch(parent.idIntermediaryFile);
    },
    Item: async (parent: Parent): Promise<DBAPI.Item | null> => {
        return await DBAPI.Item.fetch(parent.idItem);
    },
    Model: async (parent: Parent): Promise<DBAPI.Model | null> => {
        return await DBAPI.Model.fetch(parent.idModel);
    },
    Project: async (parent: Parent): Promise<DBAPI.Project | null> => {
        return await DBAPI.Project.fetch(parent.idProject);
    },
    ProjectDocumentation: async (parent: Parent): Promise<DBAPI.ProjectDocumentation | null> => {
        return await DBAPI.ProjectDocumentation.fetch(parent.idProjectDocumentation);
    },
    Scene: async (parent: Parent): Promise<DBAPI.Scene | null> => {
        return await DBAPI.Scene.fetch(parent.idScene);
    },
    Stakeholder: async (parent: Parent): Promise<DBAPI.Stakeholder | null> => {
        return await DBAPI.Stakeholder.fetch(parent.idStakeholder);
    },
    Subject: async (parent: Parent): Promise<DBAPI.Subject | null> => {
        return await DBAPI.Subject.fetch(parent.idSubject);
    },
    Unit: async (parent: Parent): Promise<DBAPI.Unit | null> => {
        return await DBAPI.Unit.fetch(parent.idUnit);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow | null> => {
        return await DBAPI.Workflow.fetch(parent.idWorkflow);
    },
    WorkflowStep: async (parent: Parent): Promise<DBAPI.WorkflowStep | null> => {
        return await DBAPI.WorkflowStep.fetch(parent.idWorkflowStep);
    },
    AccessContextObject: async (parent: Parent): Promise<DBAPI.AccessContextObject[] | null> => {
        return await DBAPI.AccessContextObject.fetchFromSystemObject(parent.idSystemObject);
    },
    Identifier: async (parent: Parent): Promise<DBAPI.Identifier[] | null> => {
        return await DBAPI.Identifier.fetchFromSystemObject(parent.idSystemObject);
    },
    LicenseAssignment: async (parent: Parent): Promise<DBAPI.LicenseAssignment[] | null> => {
        return await DBAPI.LicenseAssignment.fetchFromSystemObject(parent.idSystemObject);
    },
    Metadata: async (parent: Parent): Promise<DBAPI.Metadata[] | null> => {
        return await DBAPI.Metadata.fetchFromSystemObject(parent.idSystemObject);
    },
    SystemObjectVersion: async (parent: Parent): Promise<DBAPI.SystemObjectVersion[] | null> => {
        return await DBAPI.SystemObjectVersion.fetchFromSystemObject(parent.idSystemObject);
    },
    SystemObjectDerived: async (parent: Parent): Promise<DBAPI.SystemObject[] | null> => {
        return await DBAPI.SystemObject.fetchDerivedFromXref(parent.idSystemObject);
    },
    SystemObjectMaster: async (parent: Parent): Promise<DBAPI.SystemObject[] | null> => {
        return await DBAPI.SystemObject.fetchMasterFromXref(parent.idSystemObject);
    },
    UserPersonalizationSystemObject: async (parent: Parent): Promise<DBAPI.UserPersonalizationSystemObject[] | null> => {
        return await DBAPI.UserPersonalizationSystemObject.fetchFromSystemObject(parent.idSystemObject);
    },
    WorkflowStepXref: async (parent: Parent): Promise<DBAPI.WorkflowStep[] | null> => {
        return await DBAPI.SystemObject.fetchWorkflowStepFromXref(parent.idSystemObject);
    }
};

export default SystemObject;
