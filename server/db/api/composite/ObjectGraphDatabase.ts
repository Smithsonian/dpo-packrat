import { Unit, Project, Subject, Item, SystemObjectIDType, Actor, Asset, AssetVersion, CaptureData, CaptureDataFile, IntermediaryFile,
    Model, ProjectDocumentation, Scene, Stakeholder, SystemObjectInfo, ObjectIDAndType, SystemObjectIDAndType } from '../..';
import { ObjectGraphDataEntry, eApplyGraphStateDirection, ObjectGraphState } from './ObjectGraphDataEntry';
import { ObjectGraph, eObjectGraphMode } from './ObjectGraph';
import * as COMMON from '@dpo-packrat/common';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
// import * as H from '../../../utils/helpers';

export class ObjectGraphDatabase {
    objectMap: Map<number, ObjectGraphDataEntry> = new Map<number, ObjectGraphDataEntry>(); // map from SystemObject.idSystemObject to graph entry details

    // used by ObjectGraph
    async recordRelationship(parent: SystemObjectIDType, child: SystemObjectIDType): Promise<void> {
        // LOG.info(`RR ${JSON.stringify(parent)} -> ${JSON.stringify(child)}`, LOG.LS.eDB);
        let parentData: ObjectGraphDataEntry | undefined = this.objectMap.get(parent.idSystemObject);
        let childData: ObjectGraphDataEntry | undefined = this.objectMap.get(child.idSystemObject);

        if (!parentData) {
            const sID: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(parent); /* istanbul ignore if */
            if (!sID)
                LOG.error(`ObjectGraphDatabase.recordRelationship unable to compute idSystemObject for ${JSON.stringify(parent)}`, LOG.LS.eDB);

            parentData = new ObjectGraphDataEntry(parent, sID ? sID.Retired : false);
            // LOG.info(`this.objectmap.set parent(${parent.idSystemObject}, ${JSON.stringify(parent)})`, LOG.LS.eDB);
            this.objectMap.set(parent.idSystemObject, parentData);
        }
        if (!childData) {
            const sID: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(child); /* istanbul ignore if */
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
    public async fetchFromSystemObject(idSystemObject: number): Promise<boolean> {
        // LOG.info(`ObjectGraphDatabase.fetchFromSystemObject ${idSystemObject}`, LOG.LS.eDB);
        const oIDsID: SystemObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectAndSystemFromSystem(idSystemObject);
        if (!oIDsID) {
            LOG.error(`ObjectGraphDatabase.fetchFromSystemObject unable to compute ObjectUDAndType / SystemObjectInfo for ${idSystemObject}`, LOG.LS.eDB);
            return false;
        }
        if (!await this.computeGraphDataFromObjectWorker(oIDsID, 'computeGraphDataFromSystemObject', eObjectGraphMode.eAll)) {
            LOG.error(`ObjectGraphDatabase.fetchFromSystemObject unable to compute graph for ${idSystemObject}`, LOG.LS.eDB);
            return false;
        }
        return await this.applyGraphData();
    }

    private async computeGraphDataFromObject(idObject: number, eObjectType: COMMON.eSystemObjectType, functionName: string): Promise<boolean> {
        const oID: ObjectIDAndType = { idObject, eObjectType };
        const sID: SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
        if (!sID) {
            LOG.error(`ObjectGraphDatabase.${functionName} unable to compute idSystemObject for ${JSON.stringify(oID)}`, LOG.LS.eDB);
            return false;
        }
        // LOG.info(`ObjectGraphDatabase.computeGraphDataFromObject ${JSON.stringify(oID)} -> ${JSON.stringify(sID)}`, LOG.LS.eDB);
        return this.computeGraphDataFromObjectWorker({ oID, sID }, functionName, eObjectGraphMode.eDescendents);
    }

    private async computeGraphDataFromObjectWorker(oIDsID: SystemObjectIDAndType, functionName: string, eOGMode: eObjectGraphMode): Promise<boolean> {
        const OG: ObjectGraph = new ObjectGraph(oIDsID.sID.idSystemObject, eOGMode, 32, this); // this -> gather relationships for all objects!
        if (!await OG.fetch()) {
            LOG.error(`ObjectGraphDatabase.${functionName} unable to compute ObjectGraph for ${JSON.stringify(oIDsID)}`, LOG.LS.eDB);
            return false;
        }
        // LOG.info(`ObjectGraphDatabase.${functionName} (${JSON.stringify(oIDsID)}) fetched OG ${JSON.stringify(OG, H.Helpers.saferStringify)}`, LOG.LS.eDB);

        if (!this.objectMap.has(oIDsID.sID.idSystemObject)) {
            // LOG.info(`this.objectmap.set object(${sID.idSystemObject}, ${JSON.stringify(oIDsID)})`, LOG.LS.eDB);
            const systemObjectIDType: SystemObjectIDType = { idSystemObject: oIDsID.sID.idSystemObject, idObject: oIDsID.oID.idObject, eObjectType: (oIDsID.oID.eObjectType + 0) };
            this.objectMap.set(oIDsID.sID.idSystemObject, new ObjectGraphDataEntry(systemObjectIDType, oIDsID.sID.Retired));
        }
        return true;
    }

    private async computeGraphDataFromUnits(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromUnits', LOG.LS.eDB);
        // iterate across all Units; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const units: Unit[] | null = await Unit.fetchAllWithSubjects(); /* istanbul ignore if */
        if (!units)
            return false;
        let count: number = 0;
        const total: number = units.length;
        for (const unit of units) {
            LOG.info(`ObjectGraphDatabase.computeGraphDataFromUnits ${++count}/${total}`, LOG.LS.eDB);
            if (!await this.computeGraphDataFromObject(unit.idUnit, COMMON.eSystemObjectType.eUnit, 'computeGraphDataFromUnits'))
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
        // let count: number = 0;
        // const total: number = projects.length;
        for (const project of projects) {
            // LOG.info(`ObjectGraphDatabase.computeGraphDataFromProjects ${++count}/${total}`, LOG.LS.eDB);
            if (!await this.computeGraphDataFromObject(project.idProject, COMMON.eSystemObjectType.eProject, 'computeGraphDataFromProjects'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromSubjects(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromSubjects', LOG.LS.eDB);
        // iterate across all Subjects; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const subjects: Subject[] | null = await Subject.fetchAll(); /* istanbul ignore if */
        if (!subjects)
            return false;
        // let count: number = 0;
        // const total: number = subjects.length;
        for (const subject of subjects) {
            // LOG.info(`ObjectGraphDatabase.computeGraphDataFromSubjects ${++count}/${total}`, LOG.LS.eDB);
            if (!await this.computeGraphDataFromObject(subject.idSubject, COMMON.eSystemObjectType.eSubject, 'computeGraphDataFromSubjects'))
                continue;
        }
        return true;
    }

    private async computeGraphDataFromItems(): Promise<boolean> {
        LOG.info('ObjectGraphDatabase.computeGraphDataFromItems', LOG.LS.eDB);
        // iterate across all Items; for each, compute ObjectGraph; extract ObjectGraph data into a "database"
        const items: Item[] | null = await Item.fetchAll(); /* istanbul ignore if */
        if (!items)
            return false;
        // let count: number = 0;
        // const total: number = items.length;
        for (const item of items) {
            // LOG.info(`ObjectGraphDatabase.computeGraphDataFromItems ${++count}/${total}`, LOG.LS.eDB);
            if (!await this.computeGraphDataFromObject(item.idItem, COMMON.eSystemObjectType.eItem, 'computeGraphDataFromItems'))
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
            if (!await this.computeGraphDataFromObject(CaptureData.idCaptureData, COMMON.eSystemObjectType.eCaptureData, 'computeGraphDataFromCaptureDatas'))
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
            if (!await this.computeGraphDataFromObject(Model.idModel, COMMON.eSystemObjectType.eModel, 'computeGraphDataFromModels'))
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
            if (!await this.computeGraphDataFromObject(Scene.idScene, COMMON.eSystemObjectType.eScene, 'computeGraphDataFromScenes'))
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
            if (!await this.computeGraphDataFromObject(IntermediaryFile.idIntermediaryFile, COMMON.eSystemObjectType.eIntermediaryFile, 'computeGraphDataFromIntermediaryFiles'))
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
                COMMON.eSystemObjectType.eProjectDocumentation, 'computeGraphDataFromProjectDocumentations'))
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
            if (!await this.computeGraphDataFromObject(Asset.idAsset, COMMON.eSystemObjectType.eAsset, 'computeGraphDataFromAssets'))
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
            if (!await this.computeGraphDataFromObject(AssetVersion.idAssetVersion, COMMON.eSystemObjectType.eAssetVersion, 'computeGraphDataFromAssetVersions'))
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
            if (!await this.computeGraphDataFromObject(Actor.idActor, COMMON.eSystemObjectType.eActor, 'computeGraphDataFromActors'))
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
            if (!await this.computeGraphDataFromObject(Stakeholder.idStakeholder, COMMON.eSystemObjectType.eStakeholder, 'computeGraphDataFromStakeholders'))
                continue;
        }
        return true;
    }
    /* #endregion */

    /* #region Apply Graph Data */
    private async applyGraphData(): Promise<boolean> {
        const log: boolean = (this.objectMap.size > 20);
        if (log)
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
        const entries: number = this.objectMap.size;
        let entry: number = 0;
        for (const objectGraphDataEntry of this.objectMap.values()) {
            const objectGraphState = await this.extractState(objectGraphDataEntry.systemObjectIDType);
            // if (ObjectGraphDataEntry.SODebugSet.has(objectGraphDataEntry.systemObjectIDType.idSystemObject))
            //     LOG.info(`ObjectGraphDatabase.applyGraphData(${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}) ${JSON.stringify(objectGraphDataEntry, H.Helpers.saferStringify)}\nOGS: ${JSON.stringify(objectGraphState, H.Helpers.saferStringify)}`, LOG.LS.eDB);
            retValue = await this.applyGraphState(objectGraphDataEntry, objectGraphState, ++entry, entries) && retValue;
        }
        if (log)
            LOG.info('ObjectGraphDatabase.applyGraphData finished', LOG.LS.eDB);
        return retValue;
    }

    private async applyGraphState(objectGraphDataEntry: ObjectGraphDataEntry, objectGraphState: ObjectGraphState,
        entry: number, entries: number): Promise<boolean> {
        // LOG.info(`ObjectGraphDatabase.applyGraphState     ---> [0] ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)}: OGS ${JSON.stringify(objectGraphState, H.Helpers.saferStringify)}`, LOG.LS.eDB);
        // Apply extracted state to the current object.
        objectGraphDataEntry.applyGraphState(objectGraphState, eApplyGraphStateDirection.eSelf);
        let retValue: boolean = true;
        retValue = (await this.applyGraphStateRecursive(objectGraphDataEntry, objectGraphState, eApplyGraphStateDirection.eChild, entry, entries, 32)) && retValue;
        retValue = (await this.applyGraphStateRecursive(objectGraphDataEntry, objectGraphState, eApplyGraphStateDirection.eParent, entry, entries, 32)) && retValue;
        return retValue;
    }

    private async applyGraphStateRecursive(objectGraphDataEntry: ObjectGraphDataEntry, objectGraphState: ObjectGraphState,
        eDirection: eApplyGraphStateDirection, entry: number, entries: number, depth: number): Promise<boolean> {
        if (eDirection == eApplyGraphStateDirection.eSelf)
            return false;
        if (depth <= 0)
            return false;

        if ((entry % 1000) == 0)
            LOG.info(`ObjectGraphDatabase.applyGraphStateRecursive ${entry}/${entries}: [${32 - depth}] ${JSON.stringify(objectGraphDataEntry.systemObjectIDType)} [${eApplyGraphStateDirection[eDirection]}]`,
                LOG.LS.eDB);
        const relationMap: Map<number, SystemObjectIDType> | undefined =
            eDirection == eApplyGraphStateDirection.eChild ? objectGraphDataEntry.childMap : objectGraphDataEntry.parentMap;
        if (!relationMap)
            return true;

        for (const systemObjectIDType of relationMap.values()) {
            const relationEntry: ObjectGraphDataEntry | undefined = this.objectMap.get(systemObjectIDType.idSystemObject);
            if (relationEntry) {
                if (relationEntry.applyGraphState(objectGraphState, eDirection))
                    // if applying this state changes things, then recurse:
                    await this.applyGraphStateRecursive(relationEntry, objectGraphState, eDirection, entry, entries, depth - 1);
            }
        }
        return true;
    }

    private async extractState(systemObjectIDType: SystemObjectIDType): Promise<ObjectGraphState> {
        const objectGraphState = new ObjectGraphState();

        objectGraphState.eType = systemObjectIDType.eObjectType;
        objectGraphState.ancestorObject = systemObjectIDType;
        switch (systemObjectIDType.eObjectType) {
            /*
            case COMMON.eSystemObjectType.eUnit:
            case COMMON.eSystemObjectType.eProject:
            case COMMON.eSystemObjectType.eSubject:
            case COMMON.eSystemObjectType.eItem:
            case COMMON.eSystemObjectType.eAsset:
                objectGraphState.ancestorObject = systemObjectIDType;
                break;
            */
            case COMMON.eSystemObjectType.eCaptureData:{
                const captureData: CaptureData | null = await CaptureData.fetch(systemObjectIDType.idObject);
                if (captureData) {
                    objectGraphState.captureMethod = captureData.idVCaptureMethod;
                    objectGraphState.commonDateCreated = captureData.DateCaptured;
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

            case COMMON.eSystemObjectType.eModel: {
                const model: Model | null = await Model.fetch(systemObjectIDType.idObject);
                if (model) {
                    objectGraphState.modelPurpose = model.idVPurpose;
                    objectGraphState.modelFileType = model.idVFileType;
                    objectGraphState.commonDateCreated = model.DateCreated;
                } else
                    LOG.error(`ObjectGraphDatabase.applyGraphData() Unable to load Model from ${systemObjectIDType}`, LOG.LS.eDB);
            } break;

            case COMMON.eSystemObjectType.eIntermediaryFile: {
                const intermediaryFile: IntermediaryFile | null = await IntermediaryFile.fetch(systemObjectIDType.idObject);
                if (intermediaryFile)
                    objectGraphState.commonDateCreated = intermediaryFile.DateCreated;
            } break;

            case COMMON.eSystemObjectType.eAssetVersion: {
                const assetVersion: AssetVersion | null = await AssetVersion.fetch(systemObjectIDType.idObject);
                if (assetVersion)
                    objectGraphState.commonDateCreated = assetVersion.DateCreated;
            } break;
        }

        return objectGraphState;
    }
    /* #endregion */
}
