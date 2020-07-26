/**
 * Type resolver for ProjectDocumentation
 */
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

const ProjectDocumentation = {
    Project: async (parent: Parent): Promise<DBAPI.Project | null> => {
        return await DBAPI.Project.fetch(parent.idProject);
    },
    SystemObject: async (parent: Parent): Promise<DBAPI.SystemObject | null> => {
        return await DBAPI.SystemObject.fetchFromProjectDocumentationID(parent.idProjectDocumentation);
    }
};

export default ProjectDocumentation;
