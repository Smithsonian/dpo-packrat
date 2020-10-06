import { SystemObjectCache } from './SystemObjectCache';
import { VocabularyCache } from './VocabularyCache';

export class CacheControl {
    private static cacheBuildTriesInt: number = 3;

    // Keep this list in sync with clearAll
    static async flushAll(): Promise<void> {
        await SystemObjectCache.flush();
        await VocabularyCache.flush();
    }

    // Keep this list in sync with flushAll
    static async clearAll(): Promise<void> {
        await SystemObjectCache.clear();
        await VocabularyCache.clear();
    }

    static get cacheBuildTries(): number {
        return CacheControl.cacheBuildTriesInt;
    }
}