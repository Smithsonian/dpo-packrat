// import {  Unit, Project, Subject, Item, Actor, Asset, AssetVersion, CaptureData, IntermediaryFile, Model, ProjectDocumentation, Scene, Stakeholder, SystemObject } from '../..';
import { SystemObjectIDType, eSystemObjectType } from '../..';
// import * as LOG from '../../../utils/logger';
// import * as CACHE from '../../../cache';

export enum eApplyGraphStateDirection {
    eSelf,
    eChild,
    eParent
}

export class ObjectGraphState {
    eType: eSystemObjectType | null = null;
    ancestorObject: SystemObjectIDType | null = null;
    captureMethod: number | null = null;
    variantTypes: Map<number, boolean> | null = null;
    modelPurpose: number | null = null;
    modelFileType: number | null = null;
}

export class ObjectGraphDataEntryHierarchy {
    idSystemObject: number = 0;
    retired: boolean = false;
    eObjectType: eSystemObjectType | null = null;
    idObject: number = 0;

    parents: number[] = [];     // array of SystemObject.idSystemObject
    children: number[] = [];    // array of SystemObject.idSystemObject
    ancestors: number[] = [];   // array of SystemObject.idSystemObject

    units: SystemObjectIDType[] = [];
    projects: SystemObjectIDType[] = [];
    subjects: SystemObjectIDType[] = [];
    items: SystemObjectIDType[] = [];

    childrenObjectTypes: eSystemObjectType[] = [];
    childrenCaptureMethods: number[] = [];
    childrenVariantTypes: number[] = [];
    childrenModelPurposes: number[] = [];
    childrenModelFileTypes: number[] = [];
}

export class ObjectGraphDataEntry {
    // The object whom this graph data entry describes
    systemObjectIDType: SystemObjectIDType;
    retired: boolean = false;

    // Derived data
    childMap: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map of child idSystemObject -> child objects
    parentMap: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map of parent idSystemObject -> parent objects
    ancestorObjectMap: Map<number, SystemObjectIDType> = new Map<number, SystemObjectIDType>(); // map of ancestor objects of significance (unit, project, subject, item), idSystemObject -> object info

    // Child data types
    childrenObjectTypes: Map<eSystemObjectType, boolean> = new Map<eSystemObjectType, boolean>();
    childrenCaptureMethods: Map<number, boolean> = new Map<number, boolean>(); // map of idVocabulary of Capture Methods associated with this object
    childrenVariantTypes: Map<number, boolean> = new Map<number, boolean>(); // map of idVocabulary of Capture Variant Types associated with this object
    childrenModelPurposes: Map<number, boolean> = new Map<number, boolean>(); // map of idVocabulary of Model Purposes associated with this object
    childrenModelFileTypes: Map<number, boolean> = new Map<number, boolean>(); // map of idVocabulary of Model File Types associated with this object

    constructor(sID: SystemObjectIDType, retired: boolean) {
        this.systemObjectIDType = sID;
        this.retired = retired;
    }

    recordChild(child: SystemObjectIDType): void {
        this.childMap.set(child.idSystemObject, child);
        // LOG.info(`${JSON.stringify(this.systemObjectIDType)} children: ${this.childMap.size}`, LOG.LS.eDB);
    }

    recordParent(parent: SystemObjectIDType): void {
        this.parentMap.set(parent.idSystemObject, parent);
        // LOG.info(`${JSON.stringify(this.systemObjectIDType)} parents: ${this.parentMap.size}`, LOG.LS.eDB);
    }

    // Returns true if applying objectGraphState updated the state of this ObjectGraphDataEntry
    applyGraphState(objectGraphState: ObjectGraphState, eDirection: eApplyGraphStateDirection): boolean {
        let retValue: boolean = false;

        if (eDirection == eApplyGraphStateDirection.eSelf ||
            eDirection == eApplyGraphStateDirection.eChild) {
            if (objectGraphState.ancestorObject) {
                if (!this.ancestorObjectMap.has(objectGraphState.ancestorObject.idSystemObject)) {
                    this.ancestorObjectMap.set(objectGraphState.ancestorObject.idSystemObject, objectGraphState.ancestorObject);
                    retValue = true;
                }
            }
        }

        if (eDirection == eApplyGraphStateDirection.eParent) {
            if (objectGraphState.eType) {
                if (!this.childrenObjectTypes.has(objectGraphState.eType)) {
                    this.childrenObjectTypes.set(objectGraphState.eType, true);
                    retValue = true;
                }
            }
        }

        if (eDirection == eApplyGraphStateDirection.eSelf ||
            eDirection == eApplyGraphStateDirection.eParent) {
            if (objectGraphState.captureMethod) {
                if (!this.childrenCaptureMethods.has(objectGraphState.captureMethod)) {
                    this.childrenCaptureMethods.set(objectGraphState.captureMethod, true);
                    retValue = true;
                }
            }

            if (objectGraphState.variantTypes) {
                for (const variantType of objectGraphState.variantTypes.keys()) {
                    if (!this.childrenVariantTypes.has(variantType)) {
                        this.childrenVariantTypes.set(variantType, true);
                        retValue = true;
                    }
                }
            }

            if (objectGraphState.modelPurpose) {
                if (!this.childrenModelPurposes.has(objectGraphState.modelPurpose)) {
                    this.childrenModelPurposes.set(objectGraphState.modelPurpose, true);
                    retValue = true;
                }
            }

            if (objectGraphState.modelFileType) {
                if (!this.childrenModelFileTypes.has(objectGraphState.modelFileType)) {
                    this.childrenModelFileTypes.set(objectGraphState.modelFileType, true);
                    retValue = true;
                }
            }
        }
        return retValue;
    }

    extractHierarchy(): ObjectGraphDataEntryHierarchy {
        const objectGraphDataEntryHierarchy: ObjectGraphDataEntryHierarchy = new ObjectGraphDataEntryHierarchy();

        objectGraphDataEntryHierarchy.idSystemObject = this.systemObjectIDType.idSystemObject;
        objectGraphDataEntryHierarchy.retired = this.retired;
        objectGraphDataEntryHierarchy.eObjectType = this.systemObjectIDType.eObjectType;
        objectGraphDataEntryHierarchy.idObject = this.systemObjectIDType.idObject;

        objectGraphDataEntryHierarchy.parents = [...this.parentMap.keys()];
        objectGraphDataEntryHierarchy.children = [...this.childMap.keys()];

        // LOG.info(`${JSON.stringify(this.systemObjectIDType)} -Parents-> ${JSON.stringify(this.parentMap.keys())} (${JSON.stringify(this.parentMap.size)})`, LOG.LS.eDB);
        // LOG.info(`${JSON.stringify(this.systemObjectIDType)} -Parents-> ${JSON.stringify(objectGraphDataEntryHierarchy.parents)} -Children-> ${JSON.stringify(objectGraphDataEntryHierarchy.children)}`, LOG.LS.eDB);

        for (const systemObjectIDType of this.ancestorObjectMap.values()) {
            switch (systemObjectIDType.eObjectType) {
                case eSystemObjectType.eUnit:       objectGraphDataEntryHierarchy.units.push(systemObjectIDType); break;
                case eSystemObjectType.eProject:    objectGraphDataEntryHierarchy.projects.push(systemObjectIDType); break;
                case eSystemObjectType.eSubject:    objectGraphDataEntryHierarchy.subjects.push(systemObjectIDType); break;
                case eSystemObjectType.eItem:       objectGraphDataEntryHierarchy.items.push(systemObjectIDType); break;
            }
            // Gather ancestors ... but don't add self as an ancestor!
            if (systemObjectIDType.idSystemObject != this.systemObjectIDType.idSystemObject)
                objectGraphDataEntryHierarchy.ancestors.push(systemObjectIDType.idSystemObject);
        }

        objectGraphDataEntryHierarchy.childrenObjectTypes = [...this.childrenObjectTypes.keys()];
        objectGraphDataEntryHierarchy.childrenCaptureMethods = [...this.childrenCaptureMethods.keys()];
        objectGraphDataEntryHierarchy.childrenVariantTypes = [...this.childrenVariantTypes.keys()];
        objectGraphDataEntryHierarchy.childrenModelPurposes = [...this.childrenModelPurposes.keys()];
        objectGraphDataEntryHierarchy.childrenModelFileTypes = [...this.childrenModelFileTypes.keys()];

        return objectGraphDataEntryHierarchy;
    }
}
