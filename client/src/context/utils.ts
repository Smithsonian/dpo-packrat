import { Subject, Item, Project } from '../types/graphql';
import { StateSubject, StateItem, StateProject } from './ingestion';

export function parseSubjectToState(subject: Subject): StateSubject {
    // TODO: update with unit and arkId
    const { idSubject } = subject;
    return {
        id: idSubject,
        arkId: '',
        unit: '',
        name: ''
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
