import { CreateSubjectResult, MutationCreateSubjectArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createSubject(_: Parent, args: MutationCreateSubjectArgs, context: Context): Promise<CreateSubjectResult> {
    const { input } = args;
    const { idUnit, idAssetThumbnail, idGeoLocation, Name } = input;
    const { prisma } = context;

    const subjectArgs = {
        idSubject: 0,
        idUnit,
        idAssetThumbnail: idAssetThumbnail || null,
        idGeoLocation: idGeoLocation || null,
        Name
    };

    const Subject = await DBAPI.createSubject(prisma, subjectArgs);

    return { Subject };
}
