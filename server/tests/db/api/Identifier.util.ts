import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import { Identifier as IdentifierBase } from '@prisma/client';

export async function createIdentifierTest(base: IdentifierBase): Promise<DBAPI.Identifier> {
    const identifier: DBAPI.Identifier = new DBAPI.Identifier(base);
    const created: boolean = await identifier.create();
    expect(created).toBeTruthy();
    expect(identifier.idIdentifier).toBeGreaterThan(0);
    return identifier;
}

export async function createIdentifierForItem(item: DBAPI.Item | null,
    IdentifierValue: string | null, vIdentifierType: DBAPI.Vocabulary | null): Promise<DBAPI.Identifier | null> {
    if (!item)
        return null;

    if (!IdentifierValue)
        IdentifierValue = H.Helpers.randomSlug();

    const SO: DBAPI.SystemObject | null = await item.fetchSystemObject();
    expect(SO).toBeTruthy();
    if (!SO)
        return null;

    return await createIdentifierTest({
        IdentifierValue,
        idVIdentifierType: vIdentifierType ? vIdentifierType.idVocabulary : 0,
        idSystemObject: SO.idSystemObject,
        idIdentifier: 0
    });
}