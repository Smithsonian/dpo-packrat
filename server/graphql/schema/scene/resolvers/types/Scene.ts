/**
 * Type resolver for Scene
 */
import * as DB from '@prisma/client';
import { Scene } from '../../../../../types/graphql';

const Scene = {};

export function parseScenes(foundScenes: DB.Scene[] | null): Scene[] | null {
    let scenes;
    if (foundScenes) {
        scenes = foundScenes.map(scene => parseScene(scene));
    }

    return scenes;
}

export function parseScene(foundScene: DB.Scene | null): Scene | null {
    let scene;
    if (foundScene) {
        const { idScene, Name, IsOriented, HasBeenQCd } = foundScene;
        scene = {
            idScene: String(idScene),
            Name,
            IsOriented: Boolean(IsOriented),
            HasBeenQCd: Boolean(HasBeenQCd)
        };
    }

    return scene;
}

export default Scene;
