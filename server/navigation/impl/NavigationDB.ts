import * as NAV from '../interface';
import * as LOG from '../../utils/logger';
import * as CACHE from '../../cache';
import * as DBAPI from '../../db';
// import * as H from '../../utils/helpers';
import { eSystemObjectType, ObjectIDAndType } from '../../db';

export class NavigationDB implements NAV.INavigation {
    async getObjectChildren(filter: NAV.NavigationFilter): Promise<NAV.NavigationResult> {
        return (filter.idRoot == 0)
            ? await NavigationDB.getRoot(filter)
            : await NavigationDB.getChildren(filter);
    }

    private static async getRoot(filter: NAV.NavigationFilter): Promise<NAV.NavigationResult> {
        let entries: NAV.NavigationResultEntry[] = [];

        for (const eObjectType of filter.objectTypes) {
            switch (eObjectType) {
                case eSystemObjectType.eUnit: entries = entries.concat(await NavigationDB.computeRootUnits(filter)); break;
                case eSystemObjectType.eProject: entries = entries.concat(await NavigationDB.computeRootProjects(filter)); break;

                case eSystemObjectType.eSubject:
                case eSystemObjectType.eItem:
                case eSystemObjectType.eCaptureData:
                case eSystemObjectType.eModel:
                case eSystemObjectType.eScene:
                case eSystemObjectType.eIntermediaryFile:
                case eSystemObjectType.eAsset:
                case eSystemObjectType.eAssetVersion:
                case eSystemObjectType.eProjectDocumentation:
                case eSystemObjectType.eActor:
                case eSystemObjectType.eStakeholder:
                case eSystemObjectType.eUnknown:
                default:
                    return { success: false, error: 'Not implemented', entries, metadataColumns: filter.metadataColumns };
            }

        }
        return { success: true, error: '', entries, metadataColumns: filter.metadataColumns };
    }

    private static async getChildren(filter: NAV.NavigationFilter): Promise<NAV.NavigationResult> {
        // LOG.info(`NavigationDB.getChildren(${JSON.stringify(filter)})`, LOG.LS.eNAV);
        const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(filter.idRoot);
        if (!oID)
            return { success: false, error: `NavigationDB.getChildren unable to fetch information for filter ${JSON.stringify(filter)}`, entries: [], metadataColumns: filter.metadataColumns };

        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(filter.idRoot, DBAPI.eObjectGraphMode.eDescendents, 1); /* istanbul ignore if */
        if (!await OG.fetch())
            return { success: false, error: `NavigationDB.getChildren unable to fetch descendents for filter ${JSON.stringify(filter)}`, entries: [], metadataColumns: filter.metadataColumns };

        const entries: NAV.NavigationResultEntry[] = [];

        switch (oID.eObjectType) {
            case eSystemObjectType.eUnit: await NavigationDB.computeChildrenForUnitOrProject(filter, oID, OG, entries); break;
            case eSystemObjectType.eProject: await NavigationDB.computeChildrenForUnitOrProject(filter, oID, OG, entries); break;
            case eSystemObjectType.eSubject: await NavigationDB.computeChildrenForSubject(filter, oID, OG, entries); break;
            case eSystemObjectType.eItem: await NavigationDB.computeChildrenForItem(filter, oID, OG, entries); break;

            case eSystemObjectType.eCaptureData:
            case eSystemObjectType.eModel:
            case eSystemObjectType.eScene:
            case eSystemObjectType.eIntermediaryFile:
            case eSystemObjectType.eAsset:
            case eSystemObjectType.eAssetVersion:
            case eSystemObjectType.eProjectDocumentation:
            case eSystemObjectType.eActor:
            case eSystemObjectType.eStakeholder: /* istanbul ignore next */
            case eSystemObjectType.eUnknown: /* istanbul ignore next */
            default:
                return { success: false, error: 'Not implemented', entries, metadataColumns: filter.metadataColumns };
        }
        return { success: true, error: '', entries, metadataColumns: filter.metadataColumns };
    }

    /* #region Units */
    private static async computeRootUnits(filter: NAV.NavigationFilter): Promise<NAV.NavigationResultEntry[]> {
        const entries: NAV.NavigationResultEntry[] = [];

        const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll(); /* istanbul ignore if */
        if (!units) {
            LOG.error('NavigationDB.getRoot unable to retrieve units', LOG.LS.eNAV);
            return [];
        }

        for (const unit of units) {
            const oID: DBAPI.ObjectIDAndType = { idObject: unit.idUnit, eObjectType: eSystemObjectType.eUnit };
            const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.error(`NavigationDB.getRoot unable to compute idSystemObject for ${JSON.stringify(oID)}`, LOG.LS.eNAV);
                continue;
            }

            const entry: NAV.NavigationResultEntry = {
                idSystemObject: sID.idSystemObject,
                name: unit.Abbreviation || '<UNKNOWN>',
                objectType: eSystemObjectType.eUnit,
                idObject: unit.idUnit,
                metadata: NavigationDB.computeMetadataForUnit(unit, filter.metadataColumns)
            };
            entries.push(entry);
        }
        return entries;
    }

    private static async computeChildrenForUnitOrProject(filter: NAV.NavigationFilter, oID: DBAPI.ObjectIDAndType, OG: DBAPI.ObjectGraph, entries: NAV.NavigationResultEntry[]): Promise<void> {
        filter; oID; /* istanbul ignore else */
        if (OG.subject) {
            for (const subject of OG.subject) {
                const oIDSubject: ObjectIDAndType = { idObject: subject.idSubject, eObjectType: eSystemObjectType.eSubject };
                const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDSubject); /* istanbul ignore else */
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: subject.Name,
                        objectType: eSystemObjectType.eSubject,
                        idObject: subject.idSubject,
                        metadata: await NavigationDB.computeMetadataForSubject(subject, filter.metadataColumns)
                    });
                else
                    LOG.error(`NavigateDB.computeChildrenForUnit unable to fetch information for ${JSON.stringify(oIDSubject)}`, LOG.LS.eNAV);
            }
        }
    }

    private static computeMetadataForUnit(unit: DBAPI.Unit, metadataColumns: NAV.eMetadata[]): string[] {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eHierarchyUnit: metadata.push(unit.Abbreviation || '<UNKNOWN>'); break; /* istanbul ignore next */

                default:
                case NAV.eMetadata.eHierarchyItem:
                case NAV.eMetadata.eHierarchySubject:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    /* #region Projects */
    private static async computeRootProjects(filter: NAV.NavigationFilter): Promise<NAV.NavigationResultEntry[]> {
        const entries: NAV.NavigationResultEntry[] = [];

        const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchAll(); /* istanbul ignore if */
        if (!projects) {
            LOG.error('NavigationDB.getRoot unable to retrieve projects', LOG.LS.eNAV);
            return [];
        }

        for (const project of projects) {
            const oID: DBAPI.ObjectIDAndType = { idObject: project.idProject, eObjectType: eSystemObjectType.eProject };
            const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID); /* istanbul ignore if */
            if (!sID) {
                LOG.error(`NavigationDB.getRoot unable to compute idSystemObject for ${JSON.stringify(oID)}`, LOG.LS.eNAV);
                continue;
            }

            const entry: NAV.NavigationResultEntry = {
                idSystemObject: sID.idSystemObject,
                name: project.Name,
                objectType: eSystemObjectType.eProject,
                idObject: project.idProject,
                metadata: await NavigationDB.computeMetadataForProject(project, filter.metadataColumns)
            };
            entries.push(entry);
        }
        return entries;
    }

    // computeChildrenForUnitOrProject handles project's subject children, for the time being

    private static async computeMetadataForProject(project: DBAPI.Project, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eHierarchyUnit: {
                    const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchMasterFromProjects([project.idProject]); // TODO: consider placing this in a cache
                    let unitAbbreviation: string = ''; /* istanbul ignore else */
                    if (units) {
                        for (let index = 0; index < units.length; index++)
                            unitAbbreviation += ((index > 0) ? ', ' : '') + units[index].Abbreviation;
                    }
                    metadata.push(unitAbbreviation);
                } break; /* istanbul ignore next */

                default:
                case NAV.eMetadata.eHierarchyItem:
                case NAV.eMetadata.eHierarchySubject:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    /* #region Subjects */
    private static async computeChildrenForSubject(filter: NAV.NavigationFilter, oID: DBAPI.ObjectIDAndType, OG: DBAPI.ObjectGraph, entries: NAV.NavigationResultEntry[]): Promise<void> {
        filter; oID;
        const subject: DBAPI.Subject | null = (OG.subject) ? OG.subject[0] : /* istanbul ignore next */ await DBAPI.Subject.fetch(oID.idObject); /* istanbul ignore if */
        if (!subject) {
            LOG.error(`NavigateDB.computeChildrenForSubject unable to fetch subject information for ${JSON.stringify(oID)}`, LOG.LS.eNAV);
            return;
        }

        /* istanbul ignore else */
        if (OG.item) {
            for (const item of OG.item) {
                const oIDITem: ObjectIDAndType = { idObject: item.idItem, eObjectType: eSystemObjectType.eItem };
                const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDITem); /* istanbul ignore else */
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: item.Name,
                        objectType: eSystemObjectType.eItem,
                        idObject: item.idItem,
                        metadata: await NavigationDB.computeMetadataForItem(item, subject, filter.metadataColumns)
                    });
                else
                    LOG.error(`NavigateDB.computeChildrenForSubject unable to fetch information for ${JSON.stringify(oIDITem)}`, LOG.LS.eNAV);
            }
        }
    }

    private static async computeMetadataForSubject(subject: DBAPI.Subject, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eHierarchyUnit: {
                    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit);
                    metadata.push(unit ? (unit.Abbreviation || /* istanbul ignore next */ '<UNKNOWN>') : /* istanbul ignore next */ '');
                } break;

                case NAV.eMetadata.eHierarchySubject: {
                    const identifier: DBAPI.Identifier | null = (subject.idIdentifierPreferred)
                        ? await DBAPI.Identifier.fetch(subject.idIdentifierPreferred)
                        : null;
                    metadata.push(identifier ? identifier.IdentifierValue : '');
                } break; /* istanbul ignore next */

                default:
                case NAV.eMetadata.eHierarchyItem:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    /* #region Items */
    private static async computeChildrenForItem(filter: NAV.NavigationFilter, oID: DBAPI.ObjectIDAndType, OG: DBAPI.ObjectGraph, entries: NAV.NavigationResultEntry[]): Promise<void> {
        filter; oID;
        const item: DBAPI.Item | null = (OG.item) ? OG.item[0] : /* istanbul ignore next */ await DBAPI.Item.fetch(oID.idObject); /* istanbul ignore if */
        if (!item) {
            LOG.error(`NavigateDB.computeChildrenForItem unable to fetch item information for ${JSON.stringify(oID)}`, LOG.LS.eNAV);
            return;
        } /* istanbul ignore else */

        if (OG.captureData) {
            for (const captureData of OG.captureData) {
                const vCaptureMethod: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(captureData.idVCaptureMethod);
                const oIDCD: ObjectIDAndType = { idObject: captureData.idCaptureData, eObjectType: eSystemObjectType.eCaptureData };
                const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDCD); /* istanbul ignore else */
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: `Capture Set${vCaptureMethod ? ' ' + vCaptureMethod.Term : /* istanbul ignore next */ ''}`, /* : ${H.Helpers.convertDateToYYYYMMDD(captureData.DateCaptured)} */
                        objectType: eSystemObjectType.eCaptureData,
                        idObject: captureData.idCaptureData,
                        metadata: await NavigationDB.computeMetadataForItemChildren(/* captureData, */ item, filter.metadataColumns)
                    });
                else
                    LOG.error(`NavigateDB.computeChildrenForItem unable to fetch information for ${JSON.stringify(oIDCD)}`, LOG.LS.eNAV);
            }
        } /* istanbul ignore else */

        if (OG.model) {
            for (const model of OG.model) {
                const vPurpose: DBAPI.Vocabulary | undefined = model.idVPurpose ? await CACHE.VocabularyCache.vocabulary(model.idVPurpose) : undefined;
                const oIDModel: ObjectIDAndType = { idObject: model.idModel, eObjectType: eSystemObjectType.eModel };
                const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDModel); /* istanbul ignore else */
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: `Model${vPurpose ? ' ' + vPurpose.Term : /* istanbul ignore next */ ''}`, /* : ${H.Helpers.convertDateToYYYYMMDD(model.DateCreated)} */
                        objectType: eSystemObjectType.eModel,
                        idObject: model.idModel,
                        metadata: await NavigationDB.computeMetadataForItemChildren(/* model, */ item, filter.metadataColumns)
                    });
                else
                    LOG.error(`NavigateDB.computeChildrenForItem unable to fetch information for ${JSON.stringify(oIDModel)}`, LOG.LS.eNAV);
            }
        } /* istanbul ignore else */

        if (OG.scene) {
            for (const scene of OG.scene) {
                const oIDScene: ObjectIDAndType = { idObject: scene.idScene, eObjectType: eSystemObjectType.eScene };
                const sID: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDScene); /* istanbul ignore else */
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: `Scene ${scene.Name}`,
                        objectType: eSystemObjectType.eScene,
                        idObject: scene.idScene,
                        metadata: await NavigationDB.computeMetadataForItemChildren(/* scene, */ item, filter.metadataColumns)
                    });
                else
                    LOG.error(`NavigateDB.computeChildrenForItem unable to fetch information for ${JSON.stringify(oIDScene)}`, LOG.LS.eNAV);
            }
        }
    }

    private static async computeMetadataForItem(item: DBAPI.Item, subject: DBAPI.Subject, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eHierarchyUnit: {
                    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit);
                    metadata.push(unit ? (unit.Abbreviation || /* istanbul ignore next */ '<UNKNOWN>') : /* istanbul ignore next */ '');
                } break;

                case NAV.eMetadata.eHierarchySubject: {
                    const identifier: DBAPI.Identifier | null = (subject.idIdentifierPreferred)
                        ? await DBAPI.Identifier.fetch(subject.idIdentifierPreferred)
                        : /* istanbul ignore next */ null;
                    metadata.push(identifier ? identifier.IdentifierValue : /* istanbul ignore next */ '');
                } break;

                case NAV.eMetadata.eHierarchyItem:
                    metadata.push(`Item ${item.Name}`);
                    break;

                /* istanbul ignore next */
                default:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    private static async computeMetadataForItemChildren(item: DBAPI.Item, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const subjects: DBAPI.Subject[] | null = await DBAPI.Subject.fetchMasterFromItems([item.idItem]);
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eHierarchyUnit: { /* istanbul ignore else */
                    if (subjects && subjects.length > 0) {  // TODO: deal with multiple subjects
                        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subjects[0].idUnit);
                        metadata.push(unit ? (unit.Abbreviation || /* istanbul ignore next */ '<UNKNOWN>') : /* istanbul ignore next */ '');
                    } else
                        metadata.push('');
                } break;

                case NAV.eMetadata.eHierarchySubject: { /* istanbul ignore else */
                    if (subjects && subjects.length > 0) {  // TODO: deal with multiple subjects
                        const identifier: DBAPI.Identifier | null = (subjects[0].idIdentifierPreferred)
                            ? await DBAPI.Identifier.fetch(subjects[0].idIdentifierPreferred)
                            : /* istanbul ignore next */ null;
                        metadata.push(identifier ? identifier.IdentifierValue : /* istanbul ignore next */ '');
                    } else
                        metadata.push('');
                } break;

                case NAV.eMetadata.eHierarchyItem:
                    metadata.push(`Item ${item.Name}`);
                    break;

                /* istanbul ignore next */
                default:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
}
