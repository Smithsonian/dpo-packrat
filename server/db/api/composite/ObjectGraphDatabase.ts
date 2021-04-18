import { Unit, Project, Subject, Item, SystemObjectIDType, Actor, Asset, AssetVersion, CaptureData, CaptureDataFile, IntermediaryFile,
    Model, ProjectDocumentation, Scene, Stakeholder, eSystemObjectType } from '../..';
import { ObjectGraphDataEntry, eApplyGraphStateDirection, ObjectGraphState } from './ObjectGraphDataEntry';
import { ObjectGraph, eObjectGraphMode } from './ObjectGraph';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';

export class ObjectGraphDatabase {
    objectMap: Map<number, ObjectGraphDataEntry> = new Map<number, ObjectGraphDataEntry>(); // map from SystemObject.idSystemObject to graph entry details

    // used by ObjectGraph
    async recordRelationship(parent: SystemObjectIDType, child: SystemObjectIDType): Promise<void> {
        // LOG.info(`RR ${JSON.stringify(parent)} -> ${JSON.stringify(child)}`, LOG.LS.eDB);
        let parentData: ObjectGraphDataEntry | undefined = this.objectMap.get(parent.idSystemObject);
        let childData: ObjectGraphDataEntry | undefined = this.objectMap.get(child.idSystemObject);

        if (!parentData) {
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(parent); /* istanbul ignore if */
            if (!sID)
                LOG.error(`ObjectGraphDatabase.recordRelationship unable to compute idSystemObject for ${JSON.stringify(parent)}`, LOG.LS.eDB);

            parentData = new ObjectGraphDataEntry(parent, sID ? sID.Retired : false);
            // LOG.info(`this.objectmap.set parent(${parent.idSystemObject}, ${JSON.stringify(parent)})`, LOG.LS.eDB);
            this.objectMap.set(parent.idSystemObject, parentData);
        }
        if (!childData) {
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(child); /* istanbul ignore if */
            if (!sID)
                LOG.error(`ObjectGraphDatabase.recordRelationship unable to compute idSystemObject for ${JSON.stringify(child)}`, LOG.LS.eDB);

            childData = new ObjectGraphDataEntry(child, sID ? sID.Retired : false);
            // LOG.info(`this.objectmap.set child (${child.idSystemObject}, ${JSON.stringify(child)})`, LOG.LS.eDB);
            this.objectMap.set(child.idSystemObject, childData);
        }

        parentData.recordChild(child);
        childData.recordParent(parent);
    }

    /** Populates sourceType, if sourceType.idSystemObject exists in the objectMap; returns true if both source and related exist in the object map */
    alreadyProcessed(sourceType: SystemObjectIDType, relatedType: SystemObjectIDType | null): boolean {
        const OBDE: ObjectGraphDataEntry | undefined = this.objectMap.get(sourceType.idSystemObject);
        let sourceFound: boolean = false;
        if (OBDE) {
            sourceType.idObject     = OBDE.systemObjectIDType.idObject;
            sourceType.eObjectType  = OBDE.systemObjectIDType.eObjectType;
            sourceFound             = true;
        }
        const relatedFound: boolean = !relatedType || this.objectMap.has(relatedType.idSystemObject);
        return sourceFound && relatedFound;
    }

    async fetch(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.fetch starting', LOG.LS.eDB);
        if (!await this.computeGraphDataFromUnits()) return false;
        if (!await this.computeGraphDataFromProjects()) return false;
        if (!await this.computeGraphDataFromSubjects()) return false;
        if (!await this.computeGraphDataFromItems()) return false;
        if (!await this.computeGraphDataFromCaptureDatas()) return false;
        if (!await this.computeGraphDataFromModels()) return false;
        if (!await this.computeGraphDataFromScenes()) return false;
        if (!await this.computeGraphDataFromIntermediaryFiles()) return false;
        if (!await this.computeGraphDataFromProjectDocumentations()) return false;
        if (!await this.computeGraphDataFromAssets()) return false;
        if (!await this.computeGraphDataFromAssetVersions()) return false;
        if (!await this.computeGraphDataFromActors()) return false;
        if (!await this.computeGraphDataFromStakeholders()) return false;

        if (!(await this.applyGraphData())) return false;
        LOG.info('ObjectGraphDatabase.fetch completed successfully', LOG.LS.eDB);
        return true;
    }

    /* #region Compute Graph Data */
    private async computeGraphDataFromObject(idObject: number, eObjectType: eSystemObjectType, functionName: string): Promise<boolean> {
        const oID: CACHE.ObjectIDAndType = { idObject, eObjectType };
        const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
        if (!sID) {
            LOG.error(`GraphDatabase.${functionName} unable to compute idSystemObject for ${JSON.stringify(oID)}`, LOG.LS.eDB);
            return false;
        }
        // LOG.info(`ObjectGraphDatabase.computeGraphDataFromObject ${JSON.stringify(oID)} -> ${JSON.stringify(sID)}`, LOG.LS.eDB);

        const OG: ObjectGraph = new ObjectGraph(sID.idSystemObject, eObjectGraphMode.eDescendents, 32, this); // this -> gather relationships for all objects!
        if (!await OG.fetch()) {
            LOG.error(`GraphDatabase.${functionName} unable to compute ObjectGraph for ${JSON.stringify(oID)}`, LOG.LS.eDB);
            return false;
        }

        if (!this.objectMap.has(sID.idSystemObject)) {
            const objectIDAndType: SystemObjectIDType = { idSystemObject: sID.idSystemObject, idObject, eObjectType };
            // LOG.info(`this.objectmap.set object(${sID.idSystemObject}, ${JSON.stringify(objectIDAndType)})`, LOG.LS.eDB);
            this.objectMap.set(sID.idSystemObject, new ObjectGraphDataEntry(objectIDAndType, sID.Retired));
        }
        return true;
    }

    private async computeGraphDataFromUnits(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromUnits', LOG.LS.eDB);
        // iterate across all Units; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const units: Unit[] | null = await Unit.fetchAllWithSubjects(); /* istanbul ignore if */
        if (!units)
            return false;
        for (const unit of units) {
            if (!await this.computeGraphDataFromObject(unit.idUnit, eSystemObjectType.eUnit, 'computeGraphDataFromUnits'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromProjects(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromProjects', LOG.LS.eDB);
        // iterate across all Projects; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const projects: Project[] | null = await Project.fetchAll(); /* istanbul ignore if */
        if (!projects)
            return false;
        for (const project of projects) {
            if (!await this.computeGraphDataFromObject(project.idProject, eSystemObjectType.eProject, 'computeGraphDataFromProjects'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromSubjects(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromSubjects', LOG.LS.eDB);
        // iterate across all Subjects; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Subjects: Subject[] | null = await Subject.fetchAll(); /* istanbul ignore if */
        if (!Subjects)
            return false;
        for (const Subject of Subjects) {
            if (!await this.computeGraphDataFromObject(Subject.idSubject, eSystemObjectType.eSubject, 'computeGraphDataFromSubjects'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromItems(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromItems', LOG.LS.eDB);
        // iterate across all Items; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Items: Item[] | null = await Item.fetchAll(); /* istanbul ignore if */
        if (!Items)
            return false;
        for (const Item of Items) {
            if (!await this.computeGraphDataFromObject(Item.idItem, eSystemObjectType.eItem, 'computeGraphDataFromItems'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromCaptureDatas(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromCaptureDatas', LOG.LS.eDB);
        // iterate across all CaptureDatas; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const CaptureDatas: CaptureData[] | null = await CaptureData.fetchAll(); /* istanbul ignore if */
        if (!CaptureDatas)
            return false;
        for (const CaptureData of CaptureDatas) {
            if (!await this.computeGraphDataFromObject(CaptureData.idCaptureData, eSystemObjectType.eCaptureData, 'computeGraphDataFromCaptureDatas'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromModels(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromModels', LOG.LS.eDB);
        // iterate across all Models; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Models: Model[] | null = await Model.fetchAll(); /* istanbul ignore if */
        if (!Models)
            return false;
        for (const Model of Models) {
            if (!await this.computeGraphDataFromObject(Model.idModel, eSystemObjectType.eModel, 'computeGraphDataFromModels'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromScenes(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromScenes', LOG.LS.eDB);
        // iterate across all Scenes; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Scenes: Scene[] | null = await Scene.fetchAll(); /* istanbul ignore if */
        if (!Scenes)
            return false;
        for (const Scene of Scenes) {
            if (!await this.computeGraphDataFromObject(Scene.idScene, eSystemObjectType.eScene, 'computeGraphDataFromScenes'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromIntermediaryFiles(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromIntermediaryFiles', LOG.LS.eDB);
        // iterate across all IntermediaryFiles; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const IntermediaryFiles: IntermediaryFile[] | null = await IntermediaryFile.fetchAll(); /* istanbul ignore if */
        if (!IntermediaryFiles)
            return false;
        for (const IntermediaryFile of IntermediaryFiles) {
            if (!await this.computeGraphDataFromObject(IntermediaryFile.idIntermediaryFile, eSystemObjectType.eIntermediaryFile, 'computeGraphDataFromIntermediaryFiles'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromProjectDocumentations(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromProjectDocumentations', LOG.LS.eDB);
        // iterate across all ProjectDocumentations; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const ProjectDocumentations: ProjectDocumentation[] | null = await ProjectDocumentation.fetchAll(); /* istanbul ignore if */
        if (!ProjectDocumentations)
            return false;
        for (const ProjectDocumentation of ProjectDocumentations) {
            if (!await this.computeGraphDataFromObject(ProjectDocumentation.idProjectDocumentation,
                eSystemObjectType.eProjectDocumentation, 'computeGraphDataFromProjectDocumentations'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromAssets(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromAssets', LOG.LS.eDB);
        // iterate across all Assets; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Assets: Asset[] | null = await Asset.fetchAll(); /* istanbul ignore if */
        if (!Assets)
            return false;
        for (const Asset of Assets) {
            if (!await this.computeGraphDataFromObject(Asset.idAsset, eSystemObjectType.eAsset, 'computeGraphDataFromAssets'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromAssetVersions(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromAssetVersions', LOG.LS.eDB);
        // iterate across all AssetVersions; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const AssetVersions: AssetVersion[] | null = await AssetVersion.fetchAll(); /* istanbul ignore if */
        if (!AssetVersions)
            return false;
        for (const AssetVersion of AssetVersions) {
            if (!await this.computeGraphDataFromObject(AssetVersion.idAssetVersion, eSystemObjectType.eAssetVersion, 'computeGraphDataFromAssetVersions'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromActors(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromActors', LOG.LS.eDB);
        // iterate across all Actors; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Actors: Actor[] | null = await Actor.fetchAll(); /* istanbul ignore if */
        if (!Actors)
            return false;
        for (const Actor of Actors) {
            if (!await this.computeGraphDataFromObject(Actor.idActor, eSystemObjectType.eActor, 'computeGraphDataFromActors'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromStakeholders(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromStakeholders', LOG.LS.eDB);
        // iterate across all Stakeholders; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const Stakeholders: Stakeholder[] | null = await Stakeholder.fetchAll(); /* istanbul ignore if */
        if (!Stakeholders)
            return false;
        for (const Stakeholder of Stakeholders) {
            if (!await this.computeGraphDataFromObject(Stakeholder.idStakeholder, eSystemObjectType.eStakeholder, 'computeGraphDataFromStakeholders'))
                continue;
        }
        return true;
    }
    /* #endregion */

    /* #region Apply Graph Data */
    private async applyGraphData(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.applyGraphData', LOG.LS.eDB);
        // walk across all entries
        //      for each entry, extract state: compute unit, project, subject, item, capture method, variant type, model purpose, and model file type
        //      walk all children
        //          determine if applicable computed values (unit, project, subject, item) have been applied to child; if not:
        //              apply computed value
        //              descend into children (recurse: extract state, apply, descend)
        //      walk all parents
        //          determine if applicable computed values (capture method, variant type, model purpose, and model file type) have been applied to parent; if not:
        //              apply computed value
        //              ascend into parents (recurse: extract state, apply, ascend)

        let retValue: boolean = true;
        for (const objectGraphDataEntry of this.objectMap.values()) {
            const objectGraphState = await this.extractState(objectGraphDataEntry.systemObjectIDType);
            retValue = this.applyGraphState(objectGraphDataEntry, objectGraphState) && retValue;
        }
        return retValue;
    }

    private async applyGraphState(objectGraphDataEntry: ObjectGraphDataEntry, objectGraphState: ObjectGraphState): Promise<boolean> {
        // Apply extracted state to the current object.
        objectGraphDataEntry.applyGraphState(objectGraphState, eApplyGraphStateDirection.eSelf);
        let retValue: boolean = true;
        retValue = (await this.applyGraphStateRecursive(objectGraphDataEntry, objectGraphState, eApplyGraphStateDirection.eChild, 32)) && retValue;
        retValue = (await this.applyGraphStateRecursive(objectGraphDataEntry, objectGraphState, eApplyGraphStateDirection.eParent, 32)) && retValue;
        return retValue;
    }

    private async applyGraphStateRecursive(objectGraphDataEntry: ObjectGraphDataEntry, objectGraphState: ObjectGraphState,
        eDirection: eApplyGraphStateDirection, depth: number): Promise<boolean> {
        if (eDirection == eApplyGraphStateDirection.eSelf)
            return false;
        if (depth <= 0)
            return false;

        const relationMap: Map<number, SystemObjectIDType> | undefined =
            eDirection == eApplyGraphStateDirection.eChild ? objectGraphDataEntry.childMap : objectGraphDataEntry.parentMap;
        if (!relationMap)
            return true;

        for (const systemObjectIDType of relationMap.values()) {
            const relationEntry: ObjectGraphDataEntry | undefined = this.objectMap.get(systemObjectIDType.idSystemObject);
            if (relationEntry) {
                if (relationEntry.applyGraphState(objectGraphState, eDirection))
                    // if applying this state changes things, then recurse:
                    await this.applyGraphStateRecursive(relationEntry, objectGraphState, eDirection, depth - 1);
            }
        }
        return true;
    }

    private async extractState(systemObjectIDType: SystemObjectIDType): Promise<ObjectGraphState> {
        const objectGraphState = new ObjectGraphState();

        objectGraphState.eType = systemObjectIDType.eObjectType;
        switch (systemObjectIDType.eObjectType) {
            case eSystemObjectType.eUnit:
            case eSystemObjectType.eProject:
            case eSystemObjectType.eSubject:
            case eSystemObjectType.eItem:
                objectGraphState.ancestorObject = systemObjectIDType;
                break;

            case eSystemObjectType.eCaptureData:{
                const captureData: CaptureData | null = await CaptureData.fetch(systemObjectIDType.idObject);
                if (captureData) {
                    objectGraphState.captureMethod = captureData.idVCaptureMethod;
                    const captureDataFiles: CaptureDataFile[] | null = await CaptureDataFile.fetchFromCaptureData(captureData.idCaptureData);
                    if (captureDataFiles) {
                        objectGraphState.variantTypes = new Map<number, boolean>();
                        for (const captureDataFile of captureDataFiles)
                            if (captureDataFile.idVVariantType)
                                objectGraphState.variantTypes.set(captureDataFile.idVVariantType, true);
                    }
                } else
                    LOG.error(`ObjectGraphDatabase.applyGraphData() Unable to load CaptureData from ${systemObjectIDType}`, LOG.LS.eDB);
            } break;

            case eSystemObjectType.eModel: {
                const model: Model | null = await Model.fetch(systemObjectIDType.idObject);
                if (model) {
                    objectGraphState.modelPurpose = model.idVPurpose;
                    objectGraphState.modelFileType = model.idVFileType;
                } else
                    LOG.error(`ObjectGraphDatabase.applyGraphData() Unable to load Model from ${systemObjectIDType}`, LOG.LS.eDB);
            } break;
        }

        return objectGraphState;
    }
    /* #endregion */
}
