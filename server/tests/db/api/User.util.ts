import * as DBAPI from '../../../db';
import { User as UserBase } from '@prisma/client';

export async function createUserTest(base: UserBase): Promise<DBAPI.User> {
    const user: DBAPI.User = new DBAPI.User(base);
    const created: boolean = await user.create();
    expect(created).toBeTruthy();
    expect(user.idUser).toBeGreaterThan(0);
    return user;
}