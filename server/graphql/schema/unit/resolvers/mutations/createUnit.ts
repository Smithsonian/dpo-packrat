import { CreateUnitResult, MutationCreateUnitArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function createUnit(_: Parent, args: MutationCreateUnitArgs): Promise<CreateUnitResult> {
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
