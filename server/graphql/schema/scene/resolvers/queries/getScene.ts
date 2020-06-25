import { GetSceneResult, GetSceneInput } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';

import { fetchScene } from '../../../../../db';

type Args = { input: GetSceneInput };

export default async function getScene(_: Parent, args: Args, context: Context): Promise<GetSceneResult> {
    const { input } = args;
    const { idScene } = input;
    const { prisma } = context;

    const Scene = await fetchScene(prisma, Number.parseInt(idScene));

    if (Scene) {
        return { Scene };
    }

    return { Scene: null };
}
