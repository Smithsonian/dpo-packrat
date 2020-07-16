/**
 * Type resolver for User
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const User = {
    AccessPolicy: async (parent: Parent): Promise<DBAPI.AccessPolicy[] | null> => {
        return await DBAPI.AccessPolicy.fetchFromUser(parent.idUser);
    },
    AssetVersion: async (parent: Parent): Promise<DBAPI.AssetVersion[] | null> => {
        return await DBAPI.AssetVersion.fetchFromUser(parent.idUser);
    },
    LicenseAssignment: async (parent: Parent): Promise<DBAPI.LicenseAssignment[] | null> => {
        return await DBAPI.LicenseAssignment.fetchFromUser(parent.idUser);
    },
    Metadata: async (parent: Parent): Promise<DBAPI.Metadata[] | null> => {
        return await DBAPI.Metadata.fetchFromUser(parent.idUser);
    },
    UserPersonalizationSystemObject: async (parent: Parent): Promise<DBAPI.UserPersonalizationSystemObject[] | null> => {
        return await DBAPI.UserPersonalizationSystemObject.fetchFromUser(parent.idUser);
    },
    UserPersonalizationUrl: async (parent: Parent): Promise<DBAPI.UserPersonalizationUrl[] | null> => {
        return await DBAPI.UserPersonalizationUrl.fetchFromUser(parent.idUser);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow[] | null> => {
        return await DBAPI.Workflow.fetchFromUser(parent.idUser);
    },
    WorkflowStep: async (parent: Parent): Promise<DBAPI.WorkflowStep[] | null> => {
        return await DBAPI.WorkflowStep.fetchFromUser(parent.idUser);
    }
};

export default User;
