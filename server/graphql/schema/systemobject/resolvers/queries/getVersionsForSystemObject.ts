import { DetailVersion, GetVersionsForSystemObjectResult, QueryGetVersionsForSystemObjectArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getVersionsForSystemObject(_: Parent, args: QueryGetVersionsForSystemObjectArgs): Promise<GetVersionsForSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;

    const versions: DetailVersion[] = await getAssetVersions(idSystemObject);

    return { versions };
}

async function getAssetVersions(idSystemObject: number): Promise<DetailVersion[]> {
    const versions: DetailVersion[] = [];
    // TODO: KARAN: compute DetailVersion
    console.log(idSystemObject);

    return versions;
}