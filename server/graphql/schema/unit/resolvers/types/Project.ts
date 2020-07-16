/**
 * Type resolver for Project
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const Project = {
    ProjectDocumentation: async (parent: Parent): Promise<DBAPI.ProjectDocumentation[] | null> => {
        return await DBAPI.ProjectDocumentation.fetchFromProject(parent.idProject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromProjectID(parent.idProject);
    },
    Workflow: async (parent: Parent): Promise<DBAPI.Workflow[] | null> => {
        return await DBAPI.Workflow.fetchFromProject(parent.idProject);
    }
};

export default Project;
