import { GetSceneResult, GetSceneInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

import * as DBAPI from '../../../../../db';

type Args = { input: GetSceneInput };

export default async function getScene(_: Parent, args: Args): Promise<GetSceneResult> {
    const { input } = args;
    const { idScene } = input;
    const Scene = await DBAPI.Scene.fetch(idScene);
    return { Scene };
}
