import { RollbackSystemObjectVersionResult, MutationRollbackSystemObjectVersionArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
// import * as DBAPI from '../../../../../db';
// import * as LOG from '../../../../../utils/logger';

export default async function rollbackSystemObjectVersion(_: Parent, args: MutationRollbackSystemObjectVersionArgs): Promise<RollbackSystemObjectVersionResult> {
    const { input: { idSystemObjectVersion } } = args;
    const result = { success: false, message: 'Unable to identify idSystemObjectVersion' };
    console.log('idSystemObjectVersion', idSystemObjectVersion); // use variable to prevent compilation error

    // TODO: JON Insert DBAPI code here

    return result;
}