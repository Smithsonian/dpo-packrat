import { GetModelConstellationResult, GetModelConstellationInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
// import * as LOG from '../../../../../utils/logger';

type Args = { input: GetModelConstellationInput };

export default async function getModelConstellation(_: Parent, args: Args): Promise<GetModelConstellationResult> {
    const { input } = args;
    const { idModel } = input;

    const ModelConstellation = await DBAPI.ModelConstellation.fetch(idModel);
    // LOG.info(`getModelConstellation(${idModel}) = ${JSON.stringify(ModelConstellation)}`, LOG.LS.eGQL);
    return { ModelConstellation };
}
