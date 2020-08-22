import * as DBAPI from '../../../db';
import { Model as ModelBase } from '@prisma/client';

export async function createModelTest(base: ModelBase): Promise<DBAPI.Model> {
    const model: DBAPI.Model = new DBAPI.Model(base);
    const created: boolean = await model.create();
    expect(created).toBeTruthy();
    expect(model.idModel).toBeGreaterThan(0);
    return model;
}