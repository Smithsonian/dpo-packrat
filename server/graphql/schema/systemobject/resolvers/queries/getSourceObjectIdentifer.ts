import { GetSourceObjectIdentiferResult, QueryGetSourceObjectIdentiferArgs, SourceObjectIdentifier } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';

export default async function getSourceObjectIdentifer(_: Parent, args: QueryGetSourceObjectIdentiferArgs): Promise<GetSourceObjectIdentiferResult> {
    const { input } = args;
    const { idSystemObjects } = input;
    const sourceObjectIdentifiers: SourceObjectIdentifier[] = [];

    for (let i = 0; i < idSystemObjects.length; i++) {
        const idSystemObject = idSystemObjects[i];
        const identifier: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);

        const sourceObjectIdentifier: SourceObjectIdentifier = {
            idSystemObject,
            identifier: identifier?.[0]?.IdentifierValue ?? null
        };
        sourceObjectIdentifiers.push(sourceObjectIdentifier);
    }

    return { sourceObjectIdentifiers };
}
