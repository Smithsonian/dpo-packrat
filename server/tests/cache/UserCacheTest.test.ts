/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import { UserCache } from '../../cache';
/*
afterAll(async done => {
    await H.Helpers.sleep(4000);
    done();
});
*/
enum eCacheTestMode {
    eInitial,
    eClear,
    eFlush
}

const userCacheTest = (): void => {
    userCacheTestWorker(eCacheTestMode.eInitial);
    userCacheTestWorker(eCacheTestMode.eClear);
    userCacheTestWorker(eCacheTestMode.eFlush);
    userCacheTestClearFlush();
};

function userCacheTestWorker(eMode: eCacheTestMode): void {
    let userAll: DBAPI.User[] | null = null;

    let description: string = '';
    switch (eMode) {
        case eCacheTestMode.eInitial: description = 'initial'; break;
        case eCacheTestMode.eClear: description = 'post clear'; break;
        case eCacheTestMode.eFlush: description = 'post flush'; break;
    }

    describe('Cache: UserCache ' + description, () => {
        test('Cache: UserCache Setup ' + description, async () => {
            switch (eMode) {
                case eCacheTestMode.eInitial: break;
                case eCacheTestMode.eClear: await UserCache.clear(); break;
                case eCacheTestMode.eFlush: await UserCache.flush(); break;
            }

            userAll = await DBAPI.User.fetchUserList('', DBAPI.eUserStatus.eAll);
            expect(userAll).toBeTruthy();
            expect(userAll ? userAll.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);
        });

        test('Cache: UserCache.getUser ' + description, async () => {
            /* istanbul ignore if */
            if (!userAll)
                return;
            for (const user of userAll) {
                const userInCache: DBAPI.User | undefined = await UserCache.getUser(user.idUser);
                expect(userInCache).toBeTruthy();
                /* istanbul ignore else */
                if (userInCache)
                    expect(user).toMatchObject(userInCache);
            }
        });
    });
}

function userCacheTestClearFlush(): void {
    describe('Cache: UserCache clear/flush', () => {
        test('Cache: UserCache.clear and UserCache.flush', async () => {
            await UserCache.clear();
            await UserCache.flush();
        });
    });
}

export default userCacheTest;
