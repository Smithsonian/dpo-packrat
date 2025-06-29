import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { createIdentifierForSystemObject } from './Identifier.util';
import { Item as ItemBase } from '@prisma/client';

export async function createItemTest(base: ItemBase): Promise<DBAPI.Item> {
    const item: DBAPI.Item = new DBAPI.Item(base);
    const created: boolean = await item.create();
    expect(created).toBeTruthy();
    expect(item.idItem).toBeGreaterThan(0);
    return item;
}

export async function createItemAndIDsForBagitTesting(base: ItemBase): Promise<DBAPI.Item> {
    const item: DBAPI.Item = await createItemTest(base);

    const vIDTypeArk: DBAPI.Vocabulary | null = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK) || null;
    let itemID1: DBAPI.Identifier | null = null;
    let itemID2: DBAPI.Identifier | null = null;
    let itemID3: DBAPI.Identifier | null = null;
    if (item) {
        itemID1 = await createIdentifierForSystemObject(item, 'ITEM_GUID_1', vIDTypeArk);
        itemID2 = await createIdentifierForSystemObject(item, 'ITEM_GUID_2', vIDTypeArk);
        itemID3 = await createIdentifierForSystemObject(item, 'ITEM_GUID_3', vIDTypeArk);
    }
    expect(itemID1).toBeTruthy();
    expect(itemID2).toBeTruthy();
    expect(itemID3).toBeTruthy();
    /*
    const ID1Desc: string = `ID1 ${itemID1 ? itemID1.idIdentifier : 'missing'}`;
    const ID2Desc: string = `ID2 ${itemID2 ? itemID2.idIdentifier : 'missing'}`;
    const ID3Desc: string = `ID3 ${itemID3 ? itemID3.idIdentifier : 'missing'}`;
    LOG.info(`createItemAndIDsForBagitTesting: item ${item.idItem}, ${ID1Desc} ${ID2Desc} ${ID3Desc}`, LOG.LS.eTEST);
    */
    return item;
}