import { GetAssetResult, GetAssetInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

type Args = { input: GetAssetInput };

export default async function getAsset(_: Parent, args: Args): Promise<GetAssetResult> {
    const { input } = args;
    const { idAsset } = input;

    const Asset = await DBAPI.Asset.fetch(idAsset);

    return { Asset };
}
