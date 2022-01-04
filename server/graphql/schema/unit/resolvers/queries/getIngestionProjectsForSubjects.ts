import { QueryGetIngestionProjectsForSubjectsArgs, GetIngestionProjectsForSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getIngestionProjectsForSubjects(_: Parent, args: QueryGetIngestionProjectsForSubjectsArgs): Promise<GetIngestionProjectsForSubjectsResult> {
    const { input } = args;
    const { idSubjects } = input;

    const Project = await DBAPI.Project.fetchRelatedToSubjects(idSubjects);

    if (Project) {
        if (Project.length) {
            return {
                Project,
                Default: false
            };
        }
    }

    const AllProjects = await DBAPI.Project.fetchAll();

    if (AllProjects) {
        return {
            Project: AllProjects,
            Default: true
        };
    }

    return {
        Project: [],
        Default: true
    };
}
