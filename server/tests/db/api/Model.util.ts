import * as DBAPI from '../../../db';
import { Model as ModelBase, ModelMaterial as ModelMaterialBase, ModelMaterialChannel as ModelMaterialChannelBase,
    ModelMaterialUVMap as ModelMaterialUVMapBase, ModelObject as ModelObjectBase,
    ModelObjectModelMaterialXref as ModelObjectModelMaterialXrefBase } from '@prisma/client';

export async function createModelTest(base: ModelBase): Promise<DBAPI.Model> {
    const model: DBAPI.Model = new DBAPI.Model(base);
    const created: boolean = await model.create();
    expect(created).toBeTruthy();
    expect(model.idModel).toBeGreaterThan(0);
    return model;
}

export async function createModelMaterialTest(base: ModelMaterialBase): Promise<DBAPI.ModelMaterial> {
    const modelMaterial: DBAPI.ModelMaterial = new DBAPI.ModelMaterial(base);
    const created: boolean = await modelMaterial.create();
    expect(created).toBeTruthy();
    expect(modelMaterial.idModelMaterial).toBeGreaterThan(0);
    return modelMaterial;
}

export async function createModelMaterialChannelTest(base: ModelMaterialChannelBase): Promise<DBAPI.ModelMaterialChannel> {
    const modelMaterialChannel: DBAPI.ModelMaterialChannel = new DBAPI.ModelMaterialChannel(base);
    const created: boolean = await modelMaterialChannel.create();
    expect(created).toBeTruthy();
    expect(modelMaterialChannel.idModelMaterialChannel).toBeGreaterThan(0);
    return modelMaterialChannel;
}

export async function createModelMaterialUVMapTest(base: ModelMaterialUVMapBase): Promise<DBAPI.ModelMaterialUVMap> {
    const modelMaterialUVMap: DBAPI.ModelMaterialUVMap = new DBAPI.ModelMaterialUVMap(base);
    const created: boolean = await modelMaterialUVMap.create();
    expect(created).toBeTruthy();
    expect(modelMaterialUVMap.idModelMaterialUVMap).toBeGreaterThan(0);
    return modelMaterialUVMap;
}

export async function createModelObjectTest(base: ModelObjectBase): Promise<DBAPI.ModelObject> {
    const modelObject: DBAPI.ModelObject = new DBAPI.ModelObject(base);
    const created: boolean = await modelObject.create();
    expect(created).toBeTruthy();
    expect(modelObject.idModelObject).toBeGreaterThan(0);
    return modelObject;
}

export async function createModelObjectModelMaterialXrefTest(base: ModelObjectModelMaterialXrefBase): Promise<DBAPI.ModelObjectModelMaterialXref> {
    const modelObjectModelMaterialXref: DBAPI.ModelObjectModelMaterialXref = new DBAPI.ModelObjectModelMaterialXref(base);
    const created: boolean = await modelObjectModelMaterialXref.create();
    expect(created).toBeTruthy();
    expect(modelObjectModelMaterialXref.idModelObjectModelMaterialXref).toBeGreaterThan(0);
    return modelObjectModelMaterialXref;
}