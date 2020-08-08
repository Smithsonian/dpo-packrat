import { Subject, Item, Project } from '../types/graphql';
import { StateSubject, StateItem, StateProject } from './ingestion';

export function parseSubjectToState(subject: Subject): StateSubject {
    // TODO: how to handle no arkId and unit name?
    const { idSubject, Name, Unit } = subject;

    return {
        id: idSubject,
        name: Name,
        arkId: Unit?.ARKPrefix ?? `${Name}-unit-arkId`,
        unit: Unit?.Name ?? `${Name} unit`
    };
}

export function parseItemToState(item: Item, selected: boolean): StateItem {
    const { idItem, Name, EntireSubject } = item;
    return {
        id: String(idItem),
        entireSubject: EntireSubject,
        name: Name,
        selected
    };
}

export function parseProjectToState(project: Project, selected: boolean): StateProject {
    const { idProject, Name } = project;

    return {
        id: idProject,
        name: Name,
        selected
    };
}
