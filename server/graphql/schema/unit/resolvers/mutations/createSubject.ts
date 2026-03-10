import { CreateSubjectResult, MutationCreateSubjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function createSubject(_: Parent, args: MutationCreateSubjectArgs): Promise<CreateSubjectResult> {
    const { input } = args;
    const { idUnit, idAssetThumbnail, idGeoLocation, idIdentifierPreferred, Name } = input;

    // Authorization: check access to the target Unit
    const ctx = Authorization.getContext();
    if (!ctx || (!ctx.isAdmin && !ctx.authorizedUnitIds.includes(idUnit))) {
        if (ctx)
            Authorization.logUnitDenial(ctx.idUser, idUnit, 'createSubject');
        throw new Error(AUTH_ERROR.UNIT_DENIED);
    }

    const subjectArgs = {
        idSubject: 0,
        idUnit,
        idAssetThumbnail: idAssetThumbnail || null,
        idGeoLocation: idGeoLocation || null,
        idIdentifierPreferred: idIdentifierPreferred || null,
        Name
    };

    const Subject = new DBAPI.Subject(subjectArgs);
    await Subject.create();

    return { Subject };
}
