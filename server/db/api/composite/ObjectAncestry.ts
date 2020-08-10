/* eslint-disable camelcase */
// import * as DBC from '../../connection';
import { Unit, Project, Subject, Item, CaptureData, Model, Scene,
    IntermediaryFile, ProjectDocumentation, SystemObjectPairs } from '../..';

import * as LOG from '../../../utils/logger';

export class ObjectAncestry {
    idSystemObject: number = 0;
    unit: Unit[] | null = null;
    project: Project[] | null = null;
    subject: Subject[] | null = null;
    item: Item[] | null = null;
    captureData: CaptureData[] | null = null;
    model: Model[] | null = null;
    scene: Scene[] | null = null;
    intermediaryFile: IntermediaryFile[] | null = null;
    projectDocumentation: ProjectDocumentation[] | null = null;

    pushCount: number = 0;
    maxPushCount: number = 100;

    constructor(idSystemObject: number) {
        this.idSystemObject = idSystemObject;
    }

    async fetch(): Promise<boolean> {
        if (!this.idSystemObject)
            return true;

        // Types of hierarchies:
        // Unit -> Project -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile
        // Unit -> Project -> ProjectDocumentation
        // Unit -> Subject -> Item -> CaptureData / Model / Scene / IntermediaryFile

        try {
            // First, determine what kind of object this is; then extract related objectw
            const SOP: SystemObjectPairs | null = await SystemObjectPairs.fetch(this.idSystemObject);
            if (!SOP)
                return false;
            if (SOP.CaptureData && !this.pushCaptureData(SOP.CaptureData))
                return true;
            if (SOP.Model && !this.pushModel(SOP.Model))
                return true;
            if (SOP.Scene && !this.pushScene(SOP.Scene))
                return true;
            if (SOP.IntermediaryFile && !this.pushIntermediaryFile(SOP.IntermediaryFile))
                return true;
            if (SOP.ProjectDocumentation && !this.pushProjectDocumentation(SOP.ProjectDocumentation))
                return true;
            if (SOP.Item && !this.pushItem(SOP.Item))
                return true;
            if (SOP.Subject && !this.pushSubject(SOP.Subject))
                return true;
            if (SOP.Project && !this.pushProject(SOP.Project))
                return true;
            if (SOP.Unit && !this.pushUnit(SOP.Unit))
                return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.ObjectAncestry.fetch', error);
            return false;
        }

        return true;
    }

    private async pushIntermediaryFile(intermediaryFile: IntermediaryFile): Promise<boolean> {
        if (!this.intermediaryFile)
            this.intermediaryFile = [];
        this.intermediaryFile.push(intermediaryFile);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const items: Item[] | null = await Item.fetchMasterFromIntermediaryFiles([intermediaryFile.idIntermediaryFile]);
        if (!items)
            return true;
        for (const item of items)
            if (!this.pushItem(item))
                return false;
        return true;
    }

    private async pushScene(scene: Scene): Promise<boolean> {
        if (!this.scene)
            this.scene = [];
        this.scene.push(scene);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const items: Item[] | null = await Item.fetchMasterFromScenes([scene.idScene]);
        if (!items)
            return true;
        for (const item of items)
            if (!this.pushItem(item))
                return false;
        return true;
    }

    private async pushModel(model: Model): Promise<boolean> {
        if (!this.model)
            this.model = [];
        this.model.push(model);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const items: Item[] | null = await Item.fetchMasterFromModels([model.idModel]);
        if (!items)
            return true;
        for (const item of items)
            if (!this.pushItem(item))
                return false;
        return true;
    }

    private async pushCaptureData(captureData: CaptureData): Promise<boolean> {
        if (!this.captureData)
            this.captureData = [];
        this.captureData.push(captureData);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const items: Item[] | null = await Item.fetchMasterFromCaptureDatas([captureData.idCaptureData]);
        if (!items)
            return true;
        for (const item of items)
            if (!this.pushItem(item))
                return false;
        return true;
    }

    private async pushItem(item: Item): Promise<boolean> {
        if (!this.item)
            this.item = [];
        this.item.push(item);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const subjects: Subject[] | null = await Subject.fetchMasterFromItems([item.idItem]);
        if (!subjects)
            return true;
        for (const subject of subjects)
            if (!this.pushSubject(subject))
                return false;
        return true;
    }

    private async pushSubject(subject: Subject): Promise<boolean> {
        if (!this.subject)
            this.subject = [];
        this.subject.push(subject);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        if (subject.idUnit) {
            const unit: Unit | null = await Unit.fetch(subject.idUnit);
            if (unit && !this.pushUnit(unit))
                return false;
            return true;
        }

        const projects: Project[] | null = await Project.fetchMasterFromSubjects([subject.idSubject]);
        if (!projects)
            return true;
        for (const project of projects)
            if (!this.pushProject(project))
                return false;
        return true;
    }

    private async pushProjectDocumentation(projectDocumentation: ProjectDocumentation): Promise<boolean> {
        if (!this.projectDocumentation)
            this.projectDocumentation = [];
        this.projectDocumentation.push(projectDocumentation);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const projects: Project[] | null = await Project.fetchMasterFromProjectDocumentations([projectDocumentation.idProjectDocumentation]);
        if (!projects)
            return true;
        for (const project of projects)
            if (!this.pushProject(project))
                return false;
        return true;
    }

    private async pushProject(project: Project): Promise<boolean> {
        if (!this.project)
            this.project = [];
        this.project.push(project);
        if (this.pushCount++ >= this.maxPushCount)
            return false;

        const units: Unit[] | null = await Unit.fetchMasterFromProjects([project.idProject]);
        if (!units)
            return true;

        for (const unit of units)
            if (!this.pushUnit(unit))
                return false;
        return true;
    }

    private async pushUnit(unit: Unit): Promise<boolean> {
        if (!this.unit)
            this.unit = [];
        this.unit.push(unit);
        if (this.pushCount++ >= this.maxPushCount)
            return false;
        return true;
    }
}