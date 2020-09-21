import * as NAV from '../interface';
import * as LOG from '../../utils/logger';
import * as CACHE from '../../cache';
import * as DBAPI from '../../db';
import * as H from '../../utils/helpers';
import { eSystemObjectType } from '../../db';
import { ObjectIDAndType } from '../../cache';

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
        const oID: CACHE.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(filter.idRoot);
        if (!oID)
            return { success: false, error: `NavigationDB.getChildren unable to fetch information for filter ${JSON.stringify(filter)}`, entries: [], metadataColumns: [] };

        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(filter.idRoot, DBAPI.eObjectGraphMode.eDescendents, 1);
        if (!await OG.fetch())
            return { success: false, error: `NavigationDB.getChildren unable to fetch descendents for filter ${JSON.stringify(filter)}`, entries: [], metadataColumns: [] };

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
            case eSystemObjectType.eStakeholder:
            case eSystemObjectType.eUnknown:
            default:
                return { success: false, error: 'Not implemented', entries, metadataColumns: filter.metadataColumns };
        }
        return { success: false, error: 'Not implemented', entries: [], metadataColumns: [] };
    }

    /* #region Units */
    private static async computeRootUnits(filter: NAV.NavigationFilter): Promise<NAV.NavigationResultEntry[]> {
        const entries: NAV.NavigationResultEntry[] = [];

        const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchAll();
        if (!units) {
            LOG.logger.error('NavigationDB.getRoot unable to retrieve units');
            return [];
        }

        for (const unit of units) {
            const oID: CACHE.ObjectIDAndType = { idObject: unit.idUnit, eObjectType: eSystemObjectType.eUnit };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (!sID) {
                LOG.logger.error(`NavigationDB.getRoot unable to compute idSystemObject for ${JSON.stringify(oID)}`);
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

    private static async computeChildrenForUnitOrProject(filter: NAV.NavigationFilter, oID: CACHE.ObjectIDAndType, OG: DBAPI.ObjectGraph, entries: NAV.NavigationResultEntry[]): Promise<void> {
        filter; oID;
        if (OG.subject) {
            for (const subject of OG.subject) {
                const oIDSubject: ObjectIDAndType = { idObject: subject.idSubject, eObjectType: eSystemObjectType.eSubject };
                const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDSubject);
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: subject.Name,
                        objectType: eSystemObjectType.eSubject,
                        idObject: subject.idSubject,
                        metadata: await NavigationDB.computeMetadataForSubject(subject, filter.metadataColumns)
                    });
                else
                    LOG.logger.error(`NavigateDB.computeChildrenForUnit unable to fetch information for ${JSON.stringify(oIDSubject)}`);
            }
        }
    }

    private static computeMetadataForUnit(unit: DBAPI.Unit, metadataColumns: NAV.eMetadata[]): string[] {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eUnitAbbreviation: metadata.push(unit.Abbreviation || '<UNKNOWN>'); break;

                default:
                case NAV.eMetadata.eItemName:
                case NAV.eMetadata.eSubjectIdentifier:
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

        const projects: DBAPI.Project[] | null = await DBAPI.Project.fetchAll();
        if (!projects) {
            LOG.logger.error('NavigationDB.getRoot unable to retrieve projects');
            return [];
        }

        for (const project of projects) {
            const oID: CACHE.ObjectIDAndType = { idObject: project.idProject, eObjectType: eSystemObjectType.eProject };
            const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (!sID) {
                LOG.logger.error(`NavigationDB.getRoot unable to compute idSystemObject for ${JSON.stringify(oID)}`);
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
                case NAV.eMetadata.eUnitAbbreviation: {
                    const units: DBAPI.Unit[] | null = await DBAPI.Unit.fetchMasterFromProjects([project.idProject]); // TODO: consider placing this in a cache
                    let unitAbbreviation: string = '';
                    if (units) {
                        for (let index = 0; index < units.length; index++)
                            unitAbbreviation += ((index > 0) ? ', ' : '') + units[index].Abbreviation;
                    }
                    metadata.push(unitAbbreviation);
                } break;

                default:
                case NAV.eMetadata.eItemName:
                case NAV.eMetadata.eSubjectIdentifier:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    /* #region Subjects */
    private static async computeChildrenForSubject(filter: NAV.NavigationFilter, oID: CACHE.ObjectIDAndType, OG: DBAPI.ObjectGraph, entries: NAV.NavigationResultEntry[]): Promise<void> {
        filter; oID;
        const subject: DBAPI.Subject | null = (OG.subject) ? OG.subject[0] : await DBAPI.Subject.fetch(oID.idObject);
        if (!subject) {
            LOG.logger.error(`NavigateDB.computeChildrenForSubject unable to fetch subject information for ${JSON.stringify(oID)}`);
            return;
        }

        if (OG.item) {
            for (const item of OG.item) {
                const oIDITem: ObjectIDAndType = { idObject: item.idItem, eObjectType: eSystemObjectType.eItem };
                const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDITem);
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: item.Name,
                        objectType: eSystemObjectType.eItem,
                        idObject: item.idItem,
                        metadata: await NavigationDB.computeMetadataForItem(item, subject, filter.metadataColumns)
                    });
                else
                    LOG.logger.error(`NavigateDB.computeChildrenForSubject unable to fetch information for ${JSON.stringify(oIDITem)}`);
            }
        }
    }

    private static async computeMetadataForSubject(subject: DBAPI.Subject, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eUnitAbbreviation: {
                    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit);
                    metadata.push(unit ? (unit.Abbreviation || '<UNKNOWN>') : '');
                } break;

                case NAV.eMetadata.eSubjectIdentifier: {
                    const identifier: DBAPI.Identifier | null = (subject.idIdentifierPreferred)
                        ? await DBAPI.Identifier.fetch(subject.idIdentifierPreferred)
                        : null;
                    metadata.push(identifier ? identifier.IdentifierValue : '');
                } break;

                default:
                case NAV.eMetadata.eItemName:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    /* #region Items */
    private static async computeChildrenForItem(filter: NAV.NavigationFilter, oID: CACHE.ObjectIDAndType, OG: DBAPI.ObjectGraph, entries: NAV.NavigationResultEntry[]): Promise<void> {
        filter; oID;
        const item: DBAPI.Item | null = (OG.item) ? OG.item[0] : await DBAPI.Item.fetch(oID.idObject);
        if (!item) {
            LOG.logger.error(`NavigateDB.computeChildrenForItem unable to fetch item information for ${JSON.stringify(oID)}`);
            return;
        }

        if (OG.captureData) {
            for (const captureData of OG.captureData) {
                const vCaptureMethod: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(captureData.idVCaptureMethod);
                const oIDCD: ObjectIDAndType = { idObject: captureData.idCaptureData, eObjectType: eSystemObjectType.eCaptureData };
                const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDCD);
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: `Capture Set${vCaptureMethod ? ' ' + vCaptureMethod.Term : ''}: ${H.Helpers.convertDateToYYYYMMDD(captureData.DateCaptured)}`,
                        objectType: eSystemObjectType.eCaptureData,
                        idObject: captureData.idCaptureData,
                        metadata: await NavigationDB.computeMetadataForItemDerived(/* captureData, */ item, filter.metadataColumns)
                    });
                else
                    LOG.logger.error(`NavigateDB.computeChildrenForItem unable to fetch information for ${JSON.stringify(oIDCD)}`);
            }
        }

        if (OG.model) {
            for (const model of OG.model) {
                const vPurpose: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.vocabulary(model.idVPurpose);
                const oIDModel: ObjectIDAndType = { idObject: model.idModel, eObjectType: eSystemObjectType.eModel };
                const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDModel);
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: `Model${vPurpose ? ' ' + vPurpose.Term : ''}: ${H.Helpers.convertDateToYYYYMMDD(model.DateCreated)}`,
                        objectType: eSystemObjectType.eModel,
                        idObject: model.idModel,
                        metadata: await NavigationDB.computeMetadataForItemDerived(/* model, */ item, filter.metadataColumns)
                    });
                else
                    LOG.logger.error(`NavigateDB.computeChildrenForItem unable to fetch information for ${JSON.stringify(oIDModel)}`);
            }
        }

        if (OG.scene) {
            for (const scene of OG.scene) {
                const oIDScene: ObjectIDAndType = { idObject: scene.idScene, eObjectType: eSystemObjectType.eScene };
                const sID: CACHE.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oIDScene);
                if (sID)
                    entries.push({
                        idSystemObject: sID.idSystemObject,
                        name: `Scene ${scene.Name}`,
                        objectType: eSystemObjectType.eScene,
                        idObject: scene.idScene,
                        metadata: await NavigationDB.computeMetadataForItemDerived(/* scene, */ item, filter.metadataColumns)
                    });
                else
                    LOG.logger.error(`NavigateDB.computeChildrenForItem unable to fetch information for ${JSON.stringify(oIDScene)}`);
            }
        }
    }

    private static async computeMetadataForItem(item: DBAPI.Item, subject: DBAPI.Subject, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eUnitAbbreviation: {
                    const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subject.idUnit);
                    metadata.push(unit ? (unit.Abbreviation || '<UNKNOWN>') : '');
                } break;

                case NAV.eMetadata.eSubjectIdentifier: {
                    const identifier: DBAPI.Identifier | null = (subject.idIdentifierPreferred)
                        ? await DBAPI.Identifier.fetch(subject.idIdentifierPreferred)
                        : null;
                    metadata.push(identifier ? identifier.IdentifierValue : '');
                } break;

                case NAV.eMetadata.eItemName:
                    metadata.push(`Item ${item.Name}`);
                    break;

                default:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
    /* #endregion */

    private static async computeMetadataForItemDerived(item: DBAPI.Item, metadataColumns: NAV.eMetadata[]): Promise<string[]> {
        const subjects: DBAPI.Subject[] | null = await DBAPI.Subject.fetchMasterFromItems([item.idItem]);
        const metadata: string[] = [];
        for (const metadataColumn of metadataColumns) {
            switch (metadataColumn) {
                case NAV.eMetadata.eUnitAbbreviation: {
                    if (subjects && subjects.length > 0) {  // TODO: deal with multiple subjects
                        const unit: DBAPI.Unit | null = await DBAPI.Unit.fetch(subjects[0].idUnit);
                        metadata.push(unit ? (unit.Abbreviation || '<UNKNOWN>') : '');
                    } else
                        metadata.push('');
                } break;

                case NAV.eMetadata.eSubjectIdentifier: {
                    if (subjects && subjects.length > 0) {  // TODO: deal with multiple subjects
                        const identifier: DBAPI.Identifier | null = (subjects[0].idIdentifierPreferred)
                            ? await DBAPI.Identifier.fetch(subjects[0].idIdentifierPreferred)
                            : null;
                        metadata.push(identifier ? identifier.IdentifierValue : '');
                    } else
                        metadata.push('');
                } break;

                case NAV.eMetadata.eItemName:
                    metadata.push(`Item ${item.Name}`);
                    break;

                default:
                    metadata.push('');
                    break;
            }
        }
        return metadata;
    }
}
