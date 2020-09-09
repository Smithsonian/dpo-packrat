import { GetProjectDocumentationResult, QueryGetProjectDocumentationArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getProjectDocumentation(_: Parent, args: QueryGetProjectDocumentationArgs): Promise<GetProjectDocumentationResult> {
    const { input } = args;
    const { idProjectDocumentation } = input;
    const ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(idProjectDocumentation);
    return { ProjectDocumentation };
}
