import * as DBAPI from '../../../db';
import { Scene as SceneBase } from '@prisma/client';

export async function createSceneTest(base: SceneBase): Promise<DBAPI.Scene> {
    const scene: DBAPI.Scene = new DBAPI.Scene(base);
    const created: boolean = await scene.create();
    expect(created).toBeTruthy();
    expect(scene.idScene).toBeGreaterThan(0);
    return scene;
}