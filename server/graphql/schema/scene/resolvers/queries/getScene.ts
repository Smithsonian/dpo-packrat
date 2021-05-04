import { GetSceneResult, GetSceneInput } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

import * as DBAPI from '../../../../../db';

type Args = { input: GetSceneInput };

export default async function getScene(_: Parent, args: Args): Promise<GetSceneResult> {
    const { input } = args;
    const { idScene } = input;
    let result: GetSceneResult = {};
    const Scene = await DBAPI.Scene.fetch(idScene);
    const xRef = await DBAPI.ModelSceneXref.fetchFromScene(idScene);
    if (Scene) {
        result = { Scene };
    }
    if (result.Scene && xRef) {
        result.Scene.ModelSceneXref = xRef;
    }
    return result;
}
