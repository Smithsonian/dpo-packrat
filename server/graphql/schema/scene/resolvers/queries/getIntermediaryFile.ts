import { GetIntermediaryFileResult, QueryGetIntermediaryFileArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

import * as DBAPI from '../../../../../db';

export default async function getIntermediaryFile(_: Parent, args: QueryGetIntermediaryFileArgs): Promise<GetIntermediaryFileResult> {
    const { input } = args;
    const { idIntermediaryFile } = input;
    const IntermediaryFile = await DBAPI.IntermediaryFile.fetch(idIntermediaryFile);
    return { IntermediaryFile };
}
