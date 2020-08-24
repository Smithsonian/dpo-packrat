import { IngestDataResult, MutationIngestDataArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function ingestData(_: Parent, args: MutationIngestDataArgs): Promise<IngestDataResult> {
    const { input } = args;
    console.log(JSON.stringify(input, null, 2));
    return { success: true };
}
