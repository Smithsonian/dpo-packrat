import { GetSubjectResult, QueryGetSubjectArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getSubject(_: Parent, args: QueryGetSubjectArgs, context: Context): Promise<GetSubjectResult> {
    const { input } = args;
    const { idSubject } = input;
    const { prisma } = context;

    const Subject = await DBAPI.fetchSubject(prisma, idSubject);

    return { Subject };
}
