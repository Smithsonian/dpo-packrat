import { CreateSubjectResult, MutationCreateSubjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createSubject(_: Parent, args: MutationCreateSubjectArgs): Promise<CreateSubjectResult> {
    const { input } = args;
    const { idUnit, idAssetThumbnail, idGeoLocation, Name } = input;

    const subjectArgs = {
        idSubject: 0,
        idUnit,
        idAssetThumbnail: idAssetThumbnail || null,
        idGeoLocation: idGeoLocation || null,
        Name
    };

    const Subject = new DBAPI.Subject(subjectArgs);
    await Subject.create();

    return { Subject };
}
