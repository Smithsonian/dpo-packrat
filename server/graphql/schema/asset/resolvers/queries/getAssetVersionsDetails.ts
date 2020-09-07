import { QueryGetAssetVersionsDetailsArgs, GetAssetVersionsDetailsResult } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';

export default async function getAssetVersionsDetails(_: Parent, args: QueryGetAssetVersionsDetailsArgs): Promise<GetAssetVersionsDetailsResult> {
    const { idAssetVersions } = args.input;
    console.log(idAssetVersions);
    // TODO: KARAN: complete this query
    return {
        valid: true,
        SubjectUnitIdentifier: [],
        Project: [],
        Item: [],
        Identifier: []
    };
}
