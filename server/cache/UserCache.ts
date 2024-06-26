import * as LOG from '../utils/logger';
import * as DBAPI from '../db';
import { CacheControl } from './CacheControl';
import { User } from '../db';

export class UserCache {
    private static singleton: UserCache | null = null;
    private userMap: Map<number, DBAPI.User> = new Map<number, DBAPI.User>(); // map of { idUser, User }

    // **************************
    // Boilerplate Implementation
    // **************************
    private constructor() { }

    private async flushInternal(): Promise<void> {
        for (let nTry: number = 1; nTry <= CacheControl.cacheBuildTries; nTry++) {
            /* istanbul ignore else */
            if (await this.flushInternalWorker())
                break;
        }
    }

    private static async getInstance(): Promise<UserCache> {
        if (!UserCache.singleton) {
            UserCache.singleton = new UserCache();
            await UserCache.singleton.flushInternal();
        }
        return UserCache.singleton;
    }

    // **************************
    // Cache Construction
    // **************************
    private async flushInternalWorker(): Promise<boolean> {
        LOG.info('CACHE UserCache.flushInternalWorker() start', LOG.LS.eCACHE );
        // TODO: replace with paged output
        const UserFetch: User[] | null = await User.fetchUserList('', DBAPI.eUserStatus.eAll); /* istanbul ignore next */
        if (!UserFetch) {
            LOG.error('UserCache.flushInternalWorker unable to fetch Users', LOG.LS.eCACHE );
            return false;
        }

        for (const user of UserFetch)
            this.userMap.set(user.idUser, user);
        LOG.info('CACHE UserCache.flushInternalWorker() done', LOG.LS.eCACHE );
        return true;
    }

    // *************************
    // #region Private Interface
    // *************************
    private async getUserInternal(idUser: number): Promise<DBAPI.User | undefined> {
        let user: User | undefined | null = this.userMap.get(idUser); /* istanbul ignore if */
        if (!user) { // cache miss, look it up
            user = await User.fetch(idUser);
            if (user)
                this.userMap.set(idUser, user);
        } /* istanbul ignore next */
        return user ?? undefined;
    }
    // #endregion

    // **************************
    // #region Public Interface
    // **************************
    // #endregion
    /**
     * Fetches user
     * @param idUser User ID to fetch
     */
    static async getUser(idUser: number): Promise<DBAPI.User | undefined> {
        return await (await this.getInstance()).getUserInternal(idUser);
    }

    static async flush(): Promise<void> {
        UserCache.singleton = null;
        await this.getInstance();
    }

    static async clear(): Promise<void> {
        UserCache.singleton = null;
    }
}