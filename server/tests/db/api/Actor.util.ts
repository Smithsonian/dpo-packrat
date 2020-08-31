import * as DBAPI from '../../../db';
import { Actor as ActorBase } from '@prisma/client';

export async function createActorTest(base: ActorBase): Promise<DBAPI.Actor> {
    const actor: DBAPI.Actor = new DBAPI.Actor(base);
    const created: boolean = await actor.create();
    expect(created).toBeTruthy();
    expect(actor.idActor).toBeGreaterThan(0);
    return actor;
}