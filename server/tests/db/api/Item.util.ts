import * as DBAPI from '../../../db';
import { Item as ItemBase } from '@prisma/client';

export async function createItemTest(base: ItemBase): Promise<DBAPI.Item> {
    const item: DBAPI.Item = new DBAPI.Item(base);
    const created: boolean = await item.create();
    expect(created).toBeTruthy();
    expect(item.idItem).toBeGreaterThan(0);
    return item;
}