/**
 * Type resolver for Actor
 */
import * as DB from '@prisma/client';
import { Actor } from '../../../../../types/graphql';

const Actor = {};

export function parseActors(foundActors: DB.Actor[] | null): Actor[] | null {
    let actors;
    if (foundActors) {
        actors = foundActors.map(actor => parseActor(actor));
    }

    return actors;
}

export function parseActor(foundActor: DB.Actor | null): Actor | null {
    let actor;
    if (foundActor) {
        const { idActor, IndividualName, OrganizationName } = foundActor;
        actor = {
            idActor: String(idActor),
            IndividualName,
            OrganizationName
        };
    }

    return actor;
}

export default Actor;
