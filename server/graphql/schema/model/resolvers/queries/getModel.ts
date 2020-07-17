import { GetModelResult, GetModelInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetModelInput };

export default async function getModel(_: Parent, args: Args): Promise<GetModelResult> {
    const { input } = args;
    const { idModel } = input;

    const Model = await DBAPI.Model.fetch(idModel);
    return { Model };
}
