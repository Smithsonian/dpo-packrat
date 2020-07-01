import { CreateUnitResult, MutationCreateUnitArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createUnit(_: Parent, args: MutationCreateUnitArgs, context: Context): Promise<CreateUnitResult> {
    const { input } = args;
    const { Name, Abbreviation, ARKPrefix } = input;
    const { prisma } = context;

    const unitArgs = {
        idUnit: 0,
        Name,
        Abbreviation,
        ARKPrefix
    };

    const Unit = await DBAPI.createUnit(prisma, unitArgs);

    return { Unit };
}
