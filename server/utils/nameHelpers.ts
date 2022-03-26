import * as DBAPI from '../db';
import { IngestTitle, RelatedObjectInput } from '../types/graphql';
import * as CACHE from '../cache';
import * as H from './helpers';
import * as LOG from './logger';
import * as COMMON from '@dpo-packrat/common';
import sanitize from 'sanitize-filename';

export const UNKNOWN_NAME: string = '<UNKNOWN>';

/** Encapsulates a model and its parent media group(s) and subject(s) */
export type ModelHierarchy = {
    model: DBAPI.Model;
    item?: DBAPI.Item;
    subjects?: DBAPI.Subject[];
};

export class NameHelpers {
    static mediaGroupDisplayName(itemSubtitle: string | null, subjects: DBAPI.Subject[]): string {
        if (subjects.length !== 1)
            return itemSubtitle ?? UNKNOWN_NAME;
        return itemSubtitle ? `${subjects[0].Name}: ${itemSubtitle}` : subjects[0].Name;
    }

    static modelDisplayName(modelSubtitle: string, item: DBAPI.Item, subjects: DBAPI.Subject[]): string {
        if (subjects.length !== 1)
            return modelSubtitle ?? item.Title ?? UNKNOWN_NAME;
        return modelSubtitle ? `${item.Name}: ${modelSubtitle}` : item.Name;
    }

    static sceneDisplayName(sceneSubtitle: string, modelHierarchies: ModelHierarchy[]): string {
        const { title } = NameHelpers.computeModelHierarchyInfo(modelHierarchies);
        if (!title)
            return sceneSubtitle ?? UNKNOWN_NAME;
        return sceneSubtitle ? `${title}: ${sceneSubtitle}` : title;
    }

    static modelBaseFileName(model: DBAPI.Model, item: DBAPI.Item): string {
        return model.Title ? `${item.Name}_${model.Title}` : item.Name;
    }

    static sceneBaseFileName(scene: DBAPI.Scene): string {
        return scene.Name;
    }

    static sanitizeFileName(fileName: string): string {
        return sanitize(fileName.replace(/:/g, '-').replace(/ /g, '_'), { replacement: '_' });
    }

    static modelTitleOptions(item: DBAPI.Item): IngestTitle {
        const title: string = (item.Title) ? item.Name.replace(`: ${item.Title}`, '') : item.Name; // base title is the item's display name, with its subtitle removed, if any
        const subtitle: (string | null)[] = [];
        subtitle.push(item.Title);  // user can select the default item subtitle.
        if (item.Title)             // if we record an entry with a real subtitle,
            subtitle.push(null);    // provide an entry with null subtitle, indicating the user can enter one
        return { title, forced: false, subtitle };
    }

    static sceneTitleOptions(modelHierarchies: ModelHierarchy[]): IngestTitle {
        let title: string | null = null;
        let forced: boolean = false;
        let subtitle: (string | null)[] = [];
        if (modelHierarchies.length === 1) {        // if only one model parent
            title = modelHierarchies[0].model.Name; // scene must be named same as model
            forced = true;
            subtitle.push(modelHierarchies[0].model.Title);
        } else {
            ({ title, subtitle } = NameHelpers.computeModelHierarchyInfo(modelHierarchies));
        }
        return { title: title ?? '', forced, subtitle: subtitle.length > 0 ? subtitle : undefined };
    }

    static async computeSceneHierarchy(scene: DBAPI.Scene): Promise<ModelHierarchy[] | null> {
        const modelHierarchies: ModelHierarchy[] = [];
        // compute model parents of scene:
        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromScene(scene);
        if (!SOI)
            return NameHelpers.recordError(`computeModelHierarchy unable to compute system object from scene ${H.Helpers.JSONStringify(scene)}`);
        const xrefs: DBAPI.SystemObjectXref[] | null = await DBAPI.SystemObjectXref.fetchMasters(SOI.idSystemObject);
        if (!xrefs)
            return NameHelpers.recordError(`computeModelHierarchy unable to compute parents of scene ${H.Helpers.JSONStringify(scene)}`);

        for (const xref of xrefs) {
            const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(xref.idSystemObjectMaster);
            if (!oID)
                return NameHelpers.recordError(`computeModelHierarchy unable to compute object from xref ${H.Helpers.JSONStringify(xref)}`);
            if (oID.eObjectType !== COMMON.eSystemObjectType.eModel)    // ignore non-model parents
                continue;
            const model: DBAPI.Model | null = await DBAPI.Model.fetch(oID.idObject);
            if (!model)
                return NameHelpers.recordError(`computeModelHierarchy unable to compute model with idModel ${oID.idObject}`);

            const modelHierarchy: ModelHierarchy | null = await NameHelpers.computeModelHierarchy(model);
            if (!modelHierarchy)
                return NameHelpers.recordError(`computeModelHierarchy unable to compute model hierarchy from model ${H.Helpers.JSONStringify(model)}`);
            modelHierarchies.push(modelHierarchy);
        }
        return modelHierarchies;
    }

    static async computeModelHierarchy(model: DBAPI.Model): Promise<ModelHierarchy | null> {
        const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromModel(model);
        if (!SOI)
            return NameHelpers.recordError(`computeModelHierarchy unable to compute system object from model ${H.Helpers.JSONStringify(model)}`);
        const OG: DBAPI.ObjectGraph = new DBAPI.ObjectGraph(SOI.idSystemObject, DBAPI.eObjectGraphMode.eAncestors);
        if (!await OG.fetch())
            return NameHelpers.recordError(`computeModelHierarchy unable to compute object graph from model ${H.Helpers.JSONStringify(model)}`);
        if (!OG.item || !OG.subject)
            return NameHelpers.recordError(`computeModelHierarchy unable to compute items and/or subjects ancestors from model ${H.Helpers.JSONStringify(model)}`);
        if (OG.item.length > 1)
            return NameHelpers.recordError(`computeModelHierarchy encountered multiple item ancestors for model ${H.Helpers.JSONStringify(model)}`);
        return { model, item: OG.item[0], subjects: OG.subject };
    }

    static async computeModelHierarchiesFromSourceObjects(sourceObjects: RelatedObjectInput[]): Promise<ModelHierarchy[] | null> {
        const MHs: ModelHierarchy[] = [];
        for (const source of sourceObjects) {
            if (source.objectType !== COMMON.eSystemObjectType.eModel)
                continue;

            const oID: DBAPI.ObjectIDAndType | undefined = await CACHE.SystemObjectCache.getObjectFromSystem(source.idSystemObject);
            if (!oID)
                return NameHelpers.recordError(`computeModelHierarchiesFromSourceObjects unable to load object information from idSystemObject ${source.idSystemObject}`);

            const model: DBAPI.Model | null = await DBAPI.Model.fetch(oID.idObject);
            if (!model)
                return NameHelpers.recordError(`computeModelHierarchiesFromSourceObjects unable to load model information with idModel ${oID.idObject}`);

            const MH: ModelHierarchy | null = await NameHelpers.computeModelHierarchy(model);
            if (!MH)
                return NameHelpers.recordError(`computeModelHierarchiesFromSourceObjects unable to compute model hierarchy from model ${H.Helpers.JSONStringify(model)}`);
            MHs.push(MH);
        }
        return MHs;
    }

    private static computeModelHierarchyInfo(modelHierarchies: ModelHierarchy[]): { title: string | null, subtitle: (string | null)[] } {
        let subject: DBAPI.Subject | null | undefined = undefined;
        const subtitleSet: Set<string> = new Set<string>();
        for (const modelHierarchy of modelHierarchies) {
            if (!modelHierarchy.subjects)
                subject = null;
            else if (modelHierarchy.subjects.length > 1)
                subject = null;
            else if (subject === undefined)
                subject = modelHierarchy.subjects[0];
            else if (subject?.idSubject !== modelHierarchy.subjects[0].idSubject)
                subject = null;

            if (modelHierarchy.item && modelHierarchy.item.Title)
                subtitleSet.add(modelHierarchy.item.Title);
            // LOG.info(`NameHelpers.computeModelHierarchyInfo ${H.Helpers.JSONStringify(modelHierarchies)} -> ${H.Helpers.JSONStringify(subject)}, subtitle=${H.Helpers.JSONStringify(subtitleSet)}`, LOG.LS.eSYS);
        }

        const subtitle: (string | null)[] = [];
        if (subject !== null) {
            const mergedSubtitle: string = [...subtitleSet].join(', ');
            if (mergedSubtitle)
                subtitle.push(mergedSubtitle);
            subtitle.push('<None>');
            subtitle.push(null);
        } else
            subtitle.push(null);
        return { title: subject?.Name ?? null, subtitle };
    }

    private static recordError(error: string): null {
        LOG.error(`NameHelpers.${error}`, LOG.LS.eSYS);
        return null;
    }
}