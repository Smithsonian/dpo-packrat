import { GetSubjectResult, QueryGetSubjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getSubject(_: Parent, args: QueryGetSubjectArgs): Promise<GetSubjectResult> {
    const { input } = args;
    const { idSubject } = input;

    const Subject = await DBAPI.Subject.fetch(idSubject);
    return { Subject };
}
