import { CreateUnitResult, MutationCreateUnitArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function createUnit(_: Parent, args: MutationCreateUnitArgs): Promise<CreateUnitResult> {
    const ctx = Authorization.getContext();
    if (!ctx || !ctx.isAdmin)
        throw new Error(AUTH_ERROR.ADMIN_REQUIRED);

    const { input } = args;
    const { Name, Abbreviation, ARKPrefix } = input;

    const unitArgs = {
        idUnit: 0,
        Name,
        Abbreviation,
        ARKPrefix
    };

    const Unit = new DBAPI.Unit(unitArgs);
    await Unit.create();
    return { Unit };
}
