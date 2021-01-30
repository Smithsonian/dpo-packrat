/* eslint-disable @typescript-eslint/no-explicit-any */
import * as LOG from '../../../utils/logger';
import * as CACHE from '../../../cache';
import * as DBAPI from '../../../db';
import { eSystemObjectType } from '../../../db';
import { SolrClient } from './SolrClient';

type SubjectInfo = {
    Unit: string | null;
    UnitID: number | null;
    Project: string[];
    ProjectID: number[];
};

type ItemInfo = {
    Unit: string[];
    UnitID: number[];
    Project: string[];
    ProjectID: number[];
    Subject: string[];
    SubjectID: number[];
};

export class ReindexSolr {
    private SubjectInfoMap: Map<number, SubjectInfo> = new Map<number, SubjectInfo>(); // map of Subject.idSubject -> Unit/Project info
    private ItemInfoMap: Map<number, ItemInfo> = new Map<number, ItemInfo>(); // map of Item.idItem -> Unit/Project/Subject

    async FullIndex(): Promise<boolean> {
        const solrClient: SolrClient = new SolrClient(null, null, null);
        solrClient._client.autoCommit = true;

        // await this.computeGraphDataFromUnits();

        solrClient._client.add(await this.computeUnits(), function(err, obj) { if (err) LOG.logger.error('ReindexSolr.FullIndex -> computeUnits()', err); else obj; });
        solrClient._client.add(await this.computeProjects(), function(err, obj) { if (err) LOG.logger.error('ReindexSolr.FullIndex -> computeProjects()', err); else obj; });
        solrClient._client.add(await this.computeSubjects(), function(err, obj) { if (err) LOG.logger.error('ReindexSolr.FullIndex -> computeSubjects()', err); else obj; });
        solrClient._client.add(await this.computeItems(), function(err, obj) { if (err) LOG.logger.error('ReindexSolr.FullIndex -> computeItems()', err); else obj; });
        solrClient._client.add(await this.computeCaptureData(), function(err, obj) { if (err) LOG.logger.error('ReindexSolr.FullIndex -> computeCaptureData()', err); else obj; });
        solrClient._client.commit(function(err, obj) { if (err) LOG.logger.error('ReindexSolr.FullIndex -> commit()', err); else obj; });
        return true;
    }

    /* #region Units */
    private async computeUnits(): Promise<any[]> {
        LOG.logger.info('ReindexSolr.computeUnits starting');
        const docs: any[] = [];

        const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll(); /* istanbul ignore if */
        if (!units) {
            LOG.logger.error('ReindexSolr.computeUnits unable to retrieve units');
            return [];
        }

        for (const unit of units) {
            const oID: CACHE.ObjectIDAndType = { idObject: unit.idUnit, eObjectType: eSystemObjectType.eUnit };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.logger.error(`ReindexSolr.computeUnits unable to compute idSystemObject for ${JSON.stringify(oID)}`);
                continue;
            }

            const doc: any = {
                idSystemObject: sID.idSystemObject,
                ObjectType: 'Unit',
                idObject: unit.idUnit,
                Retired: sID.Retired,
                Name: unit.Name,
                Abbreviation: unit.Abbreviation,
                ARKPrefix: unit.ARKPrefix,
                Unit: unit.Abbreviation,
                UnitID: sID.idSystemObject,
                ParentID: 0,
                Identifier: this.computeIdentifiers(sID.idSystemObject)
            };
            docs.push(doc);
        }
        LOG.logger.info(`ReindexSolr.computeUnits computed ${docs.length} documents`);
        return docs;
    }
    /* #endregion */

    /* #region Projects */
    private async computeProjects(): Promise<any[]> {
        LOG.logger.info('ReindexSolr.computeProjects starting');
        const docs: any[] = [];

        const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchAll(); /* istanbul ignore if */
        if (!projects) {
            LOG.logger.error('ReindexSolr.computeProjects unable to retrieve projects');
            return [];
        }

        for (const project of projects) {
            const oID: CACHE.ObjectIDAndType = { idObject: project.idProject, eObjectType: eSystemObjectType.eProject };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.logger.error(`ReindexSolr.computeProjects unable to compute idSystemObject for ${JSON.stringify(oID)}`);
                continue;
            }

            const Unit: string[] = [];
            const UnitID: number[] = [];

            const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchMasterFromProjects([project.idProject]); // TODO: consider placing this in a cache
            if (units) {
                for (const unit of units) {
                    Unit.push(unit.Abbreviation || '');
                    const SO: DBAPI.SystemObject | null = await unit.fetchSystemObject();
                    UnitID.push(SO ? SO.idSystemObject : 0);
                }
            }

            const doc: any = {
                idSystemObject: sID.idSystemObject,
                ObjectType: 'Project',
                idObject: project.idProject,
                Retired: sID.Retired,
                Name: project.Name,
                Description: project.Description,
                Unit: Unit.length == 1 ? Unit[0] : Unit,
                UnitID: UnitID.length == 1 ? UnitID[0] : UnitID,
                Project: project.Name,
                ProjectID: sID.idSystemObject,
                ParentID: 0,
                Identifier: this.computeIdentifiers(sID.idSystemObject)
            };
            docs.push(doc);
        }
        LOG.logger.info(`ReindexSolr.computeProjects computed ${docs.length} documents`);
        return docs;
    }
    /* #endregion */

    /* #region Subjects */
    private async computeSubjects(): Promise<any[]> {
        LOG.logger.info('ReindexSolr.computeSubjects starting');
        const docs: any[] = [];

        const subjects: DBAPI.Subject[] | null = await DBAPI.Subject.fetchAll(); /* istanbul ignore if */
        if (!subjects) {
            LOG.logger.error('ReindexSolr.computeSubjects unable to retrieve subjects');
            return [];
        }

        for (const subject of subjects) {
            const oID: CACHE.ObjectIDAndType = { idObject: subject.idSubject, eObjectType: eSystemObjectType.eSubject };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.logger.error(`ReindexSolr.computeSubjects unable to compute idSystemObject for ${JSON.stringify(oID)}`);
                continue;
            }

            let Unit: string | null = null;
            let UnitID: number | null = null;
            const Project: string[] = [];
            const ProjectID: number[] = [];
            let IdentifierPreferred: string | null = null;

            const unit: DBAPI.Unit | null = (subject.idUnit != 0) ? await DBAPI.Unit.fetch(subject.idUnit) : null;
            if (unit) {
                Unit = unit.Abbreviation;
                const SO: DBAPI.SystemObject | null = await unit.fetchSystemObject();
                UnitID = SO ? SO.idSystemObject : 0;
            }

            const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchMasterFromSubjects([subject.idSubject]);
            if (projects) {
                for (const project of projects) {
                    Project.push(project.Name);
                    const SO: DBAPI.SystemObject | null = await project.fetchSystemObject();
                    ProjectID.push(SO ? SO.idSystemObject : 0);
                }
            }

            if (subject.idIdentifierPreferred) {
                const ID: DBAPI.Identifier | null = await DBAPI.Identifier.fetch(subject.idIdentifierPreferred);
                if (ID)
                    IdentifierPreferred = ID.IdentifierValue;
            }

            const doc: any = {
                idSystemObject: sID.idSystemObject,
                ObjectType: 'Subject',
                idObject: subject.idSubject,
                Retired: sID.Retired,
                Name: subject.Name,
                IdentifierPreferred,
                Unit,
                UnitID,
                Project: Project.length == 1 ? Project[0] : Project,
                ProjectID: ProjectID.length == 1 ? ProjectID[0] : ProjectID,
                Subject: subject.Name,
                SubjectID: sID.idSystemObject,
                ParentID: UnitID,
                Identifier: this.computeIdentifiers(sID.idSystemObject)
            };
            docs.push(doc);
            this.SubjectInfoMap.set(subject.idSubject, { Unit, UnitID, Project, ProjectID });
        }
        LOG.logger.info(`ReindexSolr.computeSubjects computed ${docs.length} documents`);
        return docs;
    }
    /* #endregion */

    /* #region Items */
    private async computeItems(): Promise<any[]> {
        LOG.logger.info('ReindexSolr.computeItems starting');
        const docs: any[] = [];

        const items: DBAPI.Item[] | null = await DBAPI.Item.fetchAll(); /* istanbul ignore if */
        if (!items) {
            LOG.logger.error('ReindexSolr.computeItems unable to retrieve items');
            return [];
        }

        for (const item of items) {
            const oID: CACHE.ObjectIDAndType = { idObject: item.idItem, eObjectType: eSystemObjectType.eItem };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.logger.error(`ReindexSolr.computeItems unable to compute idSystemObject for ${JSON.stringify(oID)}`);
                continue;
            }

            const Unit: string[] = [];
            const UnitID: number[] = [];
            let Project: string[] = [];
            let ProjectID: number[] = [];
            const Subject: string[] = [];
            const SubjectID: number[] = [];

            const subjects: DBAPI.Subject[] | null = await DBAPI.Subject.fetchMasterFromItems([item.idItem]);
            if (subjects) {
                for (const subject of subjects) {
                    Subject.push(subject.Name);
                    const SO: DBAPI.SystemObject | null = await subject.fetchSystemObject();
                    SubjectID.push(SO ? SO.idSystemObject : 0);

                    const subjectInfo: SubjectInfo | undefined = this.SubjectInfoMap.get(subject.idSubject);
                    if (subjectInfo) {
                        if (subjectInfo.Unit)
                            Unit.push(subjectInfo.Unit);
                        if (subjectInfo.UnitID)
                            UnitID.push(subjectInfo.UnitID);
                        Project = Project.concat(subjectInfo.Project);
                        ProjectID = ProjectID.concat(subjectInfo.ProjectID);
                    }

                }
            }

            const doc: any = {
                idSystemObject: sID.idSystemObject,
                ObjectType: 'Item',
                idObject: item.idItem,
                Retired: sID.Retired,
                Name: item.Name,
                EntireSubject: item.EntireSubject,
                Unit: Unit.length == 1 ? Unit[0] : Unit,
                UnitID: UnitID.length == 1 ? UnitID[0] : UnitID,
                Project: Project.length == 1 ? Project[0] : Project,
                ProjectID: ProjectID.length == 1 ? ProjectID[0] : ProjectID,
                Subject: Subject.length == 1 ? Subject[0] : Subject,
                SubjectID: SubjectID.length == 1 ? SubjectID[0] : SubjectID,
                Item: item.Name,
                ItemID: sID.idSystemObject,
                ParentID: SubjectID.length == 1 ? SubjectID[0] : SubjectID,
                Identifier: this.computeIdentifiers(sID.idSystemObject)
            };
            docs.push(doc);
            this.ItemInfoMap.set(item.idItem, { Unit, UnitID, Project, ProjectID, Subject, SubjectID });
        }
        LOG.logger.info(`ReindexSolr.computeItems computed ${docs.length} documents`);
        return docs;
    }
    /* #endregion */

    /* #region CaptureData */
    private async computeCaptureData(): Promise<any[]> {
        LOG.logger.info('ReindexSolr.computeCaptureData starting');
        const docs: any[] = [];

        const captureDataPhotos: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchAll(); /* istanbul ignore if */
        if (!captureDataPhotos) {
            LOG.logger.error('ReindexSolr.computeCaptureData unable to retrieve CaptureDataPhoto');
            return [];
        }

        for (const captureDataPhoto of captureDataPhotos) {
            const captureData:  DBAPI.CaptureData | null = await DBAPI.CaptureData.fetchFromCaptureDataPhoto(captureDataPhoto.idCaptureDataPhoto);
            if (!captureData) {
                LOG.logger.error(`ReindexSolr.computeCaptureData unable to compute CaptureData from CaptureDataPhoto ${JSON.stringify(captureDataPhoto)}`);
                continue;
            }

            const oID: CACHE.ObjectIDAndType = { idObject: captureData.idCaptureData, eObjectType: eSystemObjectType.eCaptureData };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.logger.error(`ReindexSolr.computeCaptureData unable to compute idSystemObject for ${JSON.stringify(oID)}`);
                continue;
            }

            let Unit: string[] = [];
            let UnitID: number[] = [];
            let Project: string[] = [];
            let ProjectID: number[] = [];
            let Subject: string[] = [];
            let SubjectID: number[] = [];
            const Item: string[] = [];
            const ItemID: number[] = [];

            const items: DBAPI.Item[] | null = await DBAPI.Item.fetchMasterFromCaptureDatas([captureData.idCaptureData]);
            if (items) {
                for (const item of items) {
                    Item.push(item.Name);
                    const SO: DBAPI.SystemObject | null = await item.fetchSystemObject();
                    ItemID.push(SO ? SO.idSystemObject : 0);

                    const itemInfo: ItemInfo | undefined = this.ItemInfoMap.get(item.idItem);
                    if (itemInfo) {
                        Unit = Unit.concat(itemInfo.Unit);
                        UnitID = UnitID.concat(itemInfo.UnitID);
                        Project = Project.concat(itemInfo.Project);
                        ProjectID = ProjectID.concat(itemInfo.ProjectID);
                        Subject = Subject.concat(itemInfo.Subject);
                        SubjectID = SubjectID.concat(itemInfo.SubjectID);
                    }
                }
            }

            const vCaptureMethod: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(captureData.idVCaptureMethod);
            const vCaptureDatasetType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(captureDataPhoto.idVCaptureDatasetType);
            const vItemPositionType: DBAPI.Vocabulary | undefined = captureDataPhoto.idVItemPositionType ? await CACHE.VocabularyCache.vocabulary(captureDataPhoto.idVItemPositionType) : undefined;
            const vFocusType: DBAPI.Vocabulary | undefined = captureDataPhoto.idVFocusType ? await CACHE.VocabularyCache.vocabulary(captureDataPhoto.idVFocusType) : undefined;
            const vLightSourceType: DBAPI.Vocabulary | undefined = captureDataPhoto.idVLightSourceType ? await CACHE.VocabularyCache.vocabulary(captureDataPhoto.idVLightSourceType) : undefined;
            const vBackgroundRemovalMethod: DBAPI.Vocabulary | undefined = captureDataPhoto.idVBackgroundRemovalMethod ? await CACHE.VocabularyCache.vocabulary(captureDataPhoto.idVBackgroundRemovalMethod) : undefined;
            const vClusterType: DBAPI.Vocabulary | undefined = captureDataPhoto.idVClusterType ? await CACHE.VocabularyCache.vocabulary(captureDataPhoto.idVClusterType) : undefined;

            const doc: any = {
                idSystemObject: sID.idSystemObject,
                ObjectType: 'CaptureData',
                idObject: captureData.idCaptureData,
                Retired: sID.Retired,

                Name: captureData.Name,
                Description: captureData.Description,
                DateCreated: captureData.DateCaptured,
                CaptureMethod: vCaptureMethod ? vCaptureMethod.Term : '',
                CaptureDatasetType: vCaptureDatasetType ? vCaptureDatasetType.Term : '',
                CaptureDatasetFieldID: captureDataPhoto.CaptureDatasetFieldID,
                ItemPositionType: vItemPositionType ? vItemPositionType.Term : '',
                ItemPositionFieldID: captureDataPhoto.ItemPositionFieldID,
                ItemArrangementFieldID: captureDataPhoto.ItemArrangementFieldID,
                FocusType: vFocusType ? vFocusType.Term : '',
                LightSourceType: vLightSourceType ? vLightSourceType.Term : '',
                BackgroundRemovalMethod: vBackgroundRemovalMethod ? vBackgroundRemovalMethod.Term : '',
                ClusterType: vClusterType ? vClusterType.Term : '',
                ClusterGeometryFieldID: captureDataPhoto.ClusterGeometryFieldID,
                CameraSettingsUniform: captureDataPhoto.CameraSettingsUniform,

                Unit: Unit.length == 1 ? Unit[0] : Unit,
                UnitID: UnitID.length == 1 ? UnitID[0] : UnitID,
                Project: Project.length == 1 ? Project[0] : Project,
                ProjectID: ProjectID.length == 1 ? ProjectID[0] : ProjectID,
                Subject: Subject.length == 1 ? Subject[0] : Subject,
                SubjectID: SubjectID.length == 1 ? SubjectID[0] : SubjectID,
                Item: Item.length == 1 ? Item[0] : Item,
                ItemID: ItemID.length == 1 ? ItemID[0] : ItemID,
                ParentID: ItemID.length == 1 ? ItemID[0] : ItemID,
                Identifier: this.computeIdentifiers(sID.idSystemObject)
            };
            docs.push(doc);
        }
        LOG.logger.info(`ReindexSolr.computeCaptureData computed ${docs.length} documents`);
        return docs;
    }
    /* #endregion */

    private async computeIdentifiers(idSystemObject: number): Promise<string[]> {
        const identifiersRet: string[] = [];
        const identifiers: DBAPI.Identifier[] | null = await DBAPI.Identifier.fetchFromSystemObject(idSystemObject);
        if (identifiers) {
            for (const identifier of identifiers)
                identifiersRet.push(identifier.IdentifierValue);
        }
        return identifiersRet;
    }
}