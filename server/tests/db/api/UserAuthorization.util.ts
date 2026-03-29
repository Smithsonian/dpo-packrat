import * as DBAPI from '../../../db';
import { UserAuthorization as UserAuthorizationBase } from '@prisma/client';

export async function createUserAuthorizationTest(base: UserAuthorizationBase): Promise<DBAPI.UserAuthorization> {
    const userAuthorization: DBAPI.UserAuthorization = new DBAPI.UserAuthorization(base);
    const created: boolean = await userAuthorization.create();
    expect(created).toBeTruthy();
    expect(userAuthorization.idUserAuthorization).toBeGreaterThan(0);
    return userAuthorization;
}
