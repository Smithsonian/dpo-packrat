/**
 * Type resolver for User
 */
import { Parent, Args, Context } from '../../../../../types/resolvers';
import { UserPersonalizationSystemObject, UserPersonalizationUrl, LicenseAssignment, AccessPolicy, AssetVersion, Metadata, Workflow, WorkflowStep } from '@prisma/client';
import * as DBAPI from '../../../../../db';

const User = {
    AccessPolicy: async (parent: Parent): Promise<AccessPolicy[] | null> => {
        return await DBAPI.AccessPolicy.fetchFromUser(parent.idUser);
    },
    AssetVersion: async (parent: Parent, _: Args, context: Context): Promise<AssetVersion[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchAssetVersionFromUser(prisma, idUser);
    },
    LicenseAssignment: async (parent: Parent, _: Args, context: Context): Promise<LicenseAssignment[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchLicenseAssignmentFromUser(prisma, idUser);
    },
    Metadata: async (parent: Parent, _: Args, context: Context): Promise<Metadata[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchMetadataFromUser(prisma, idUser);
    },
    UserPersonalizationSystemObject: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationSystemObject[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUserPersonalizationSystemObjectFromUser(prisma, idUser);
    },
    UserPersonalizationUrl: async (parent: Parent, _: Args, context: Context): Promise<UserPersonalizationUrl[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchUserPersonalizationUrlFromUser(prisma, idUser);
    },
    Workflow: async (parent: Parent, _: Args, context: Context): Promise<Workflow[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowFromUser(prisma, idUser);
    },
    WorkflowStep: async (parent: Parent, _: Args, context: Context): Promise<WorkflowStep[] | null> => {
        const { idUser } = parent;
        const { prisma } = context;

        return await DBAPI.fetchWorkflowStepFromUser(prisma, idUser);
    }
};

export default User;
