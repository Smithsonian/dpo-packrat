import { GetModelConstellationResult, GetModelConstellationInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetModelConstellationInput };

export default async function getModelConstellation(_: Parent, args: Args): Promise<GetModelConstellationResult> {
    const { input } = args;
    const { idModel } = input;

    const ModelConstellation = await DBAPI.ModelConstellation.fetch(idModel);
    return { ModelConstellation };
}
