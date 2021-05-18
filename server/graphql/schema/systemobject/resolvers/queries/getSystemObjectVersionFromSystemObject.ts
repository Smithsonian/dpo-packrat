import { GetSystemObjectVersionFromSystemObjectResult, QueryGetSystemObjectVersionFromSystemObjectArgs, SystemObjectVersion } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as LOG from '../../../../../utils/logger';

export default async function getSystemObjectVersionFromSystemObjectResult(_: Parent, args: QueryGetSystemObjectVersionFromSystemObjectArgs): Promise<GetSystemObjectVersionFromSystemObjectResult> {
    const { input } = args;
    const { idSystemObject } = input;
    const systemObjectVersions: SystemObjectVersion[] | null = await DBAPI.SystemObjectVersion.fetchFromSystemObject(idSystemObject);

    if (!systemObjectVersions) {
        LOG.error(`getSystemObjectVersionFromSystemObjectResult unable to fetch systemObjectVersion for ${idSystemObject}`, LOG.LS.eGQL);
        return { systemObjectVersions: [] };
    }

    return { systemObjectVersions };
}