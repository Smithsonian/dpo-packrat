// import { Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Model, ProjectDocumentation, Scene, Stakeholder, SystemObject } from '../..';
import { Unit, Project, Subject, Item, SystemObjectIDType, eSystemObjectType } from '../..';
// import * as LOG from '../../../utils/logger';
// import * as CACHE from '../../../cache';

export class ObjectGraphDataEntry {
    // The object whom this graph data entry describes
    objectIDAndType: SystemObjectIDType = { idSystemObject: 0, idObject: 0, eType: eSystemObjectType.eUnknown };

    // Derived data
    childMap: Map<SystemObjectIDType, boolean> = new Map<SystemObjectIDType, boolean>(); // map of child objects
    parentMap: Map<SystemObjectIDType, boolean> = new Map<SystemObjectIDType, boolean>(); // map of parent objects

    unitMap: Map<Unit, boolean> = new Map<Unit, boolean>(); // map of Units associted with this object
    projectMap: Map<Project, boolean> = new Map<Project, boolean>(); // map of Projects associted with this object
    subjectMap: Map<Subject, boolean> = new Map<Subject, boolean>(); // map of Subjects associted with this object
    itemMap: Map<Item, boolean> = new Map<Item, boolean>(); // map of Items associted with this object

}