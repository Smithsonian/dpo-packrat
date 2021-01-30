// import { Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Model, ProjectDocumentation, Scene, Stakeholder, SystemObject, eSystemObjectType } from '../..';
import { Unit, Project, Subject, Item, SystemObjectIDType } from '../..';
// import * as LOG from '../../../utils/logger';

export class ObjectGraphDatabase {
    // database
    childMap: Map<SystemObjectIDType, Map<number, SystemObjectIDType>> = new Map<SystemObjectIDType, Map<number, SystemObjectIDType>>(); // map from parent object to map of children
    parentMap: Map<SystemObjectIDType, Map<number, SystemObjectIDType>> = new Map<SystemObjectIDType, Map<number, SystemObjectIDType>>(); // map from child object to map of parents

    // state-based data
    unit: Unit | null = null;
    project: Project | null = null;
    subject: Subject | null = null;
    item: Item | null = null;

    recordRelationship(parent: SystemObjectIDType, child: SystemObjectIDType): void {
        const childMap: Map<number, SystemObjectIDType> = this.childMap.get(parent) || new Map<number, SystemObjectIDType>();
        childMap.set(child.idSystemObject, child);

        const parentList: Map<number, SystemObjectIDType> = this.parentMap.get(child) || new Map<number, SystemObjectIDType>();
        parentList.set(parent.idSystemObject, parent);
    }


}