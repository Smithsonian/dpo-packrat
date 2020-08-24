import { QueryGetIngestionProjectsForSubjectsArgs, GetIngestionProjectsForSubjectsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getIngestionProjectsForSubjects(_: Parent, args: QueryGetIngestionProjectsForSubjectsArgs): Promise<GetIngestionProjectsForSubjectsResult> {
    const { input } = args;
    const { idSubjects } = input;

    const Project = await DBAPI.Project.fetchMasterFromSubjects(idSubjects);

    if (Project) {
        return {
            Project
        };
    }

    // TODO: KARAN: if projects are empty after fetchMasterFromSubjects, send all projects

    return {
        Project: []
    };
}
