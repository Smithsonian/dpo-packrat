/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../../../db';
import * as CACHE from '../../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { AuditFactory } from '../../../../audit/interface/AuditFactory';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';
import { cookDownloadTypeKeyFromFilename, cookDownloadTagForTypeKey, cookModelAutomationTagForTypeKey, DownloadTag } from '../../../../job/impl/Cook/CookOutputContract';
import { BulkOperationDef, BulkOpRow, BulkOpGatherArgs, BulkOpReporter, BulkOpApplyResult } from './BulkOpTypes';

// Backfill the deterministic Cook-download tag (ModelSceneXref.Usage/Quality/UVResolution +
// Model.idVPurpose=Download + Model.AutomationTag) onto legacy scene-derivative models so a repaired
// row is IDENTICAL to one produced by si-generate-downloads / si-voyager-scene. The tag is derived
// purely from the model's filename suffix via the shared CookOutputContract mapping — no guessing.
//
// Deliberate boundaries (safety):
//   - Only the deterministic identity is written. Content-derived fields (FileSize, bounding box,
//     inspection stats) are NEVER fabricated. A row whose deterministic tag is already correct but
//     whose content is incomplete is reported as 'needs-manual' (run inspection/regeneration), not fixed.
//   - A filename matching zero or more-than-one Cook suffix is 'ambiguous' (report-only).
//   - A ModelSceneXref whose Model record is missing is 'needs-manual' (report-only).
//   Only 'fixable' rows are apply-eligible; everything else is surfaced with a reason for manual handling.

type TagStatus = 'fixable' | 'ambiguous' | 'needs-manual';

interface TagState {
    status: TagStatus;
    typeKey: string | null;
    current: string;         // current usage/quality/uv (+ purpose/automationTag) summary
    proposed: string;        // proposed summary (empty for non-fixable)
    reason: string;
}

const tagSummary = (usage: string | null | undefined, quality: string | null | undefined, uv: number | null | undefined): string =>
    `${usage ?? '∅'} / ${quality ?? '∅'} / ${uv ?? '∅'}`;

async function downloadPurposeId(): Promise<number | undefined> {
    const v = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);
    return v?.idVocabulary;
}

// Classify one ModelSceneXref (a model-in-scene) that looks like a Cook download derivative.
async function classifyMSX(msx: DBAPI.ModelSceneXref, downloadVPurpose: number | undefined): Promise<TagState | null> {
    const typeKey = cookDownloadTypeKeyFromFilename(msx.Name ?? '');
    if (typeKey === null)
        return null;                                    // not a recognized download derivative — skip silently
    if (typeKey === 'ambiguous')
        return { status: 'ambiguous', typeKey: null, current: tagSummary(msx.Usage, msx.Quality, msx.UVResolution), proposed: '',
            reason: `filename '${msx.Name}' matches more than one Cook suffix — not auto-assigned` };

    const model: DBAPI.Model | null = await DBAPI.Model.fetch(msx.idModel);
    if (!model)
        return { status: 'needs-manual', typeKey, current: tagSummary(msx.Usage, msx.Quality, msx.UVResolution), proposed: '',
            reason: `Model ${msx.idModel} record missing — re-ingest/regenerate` };

    const tag: DownloadTag | null = cookDownloadTagForTypeKey(typeKey);
    const autoTag: string | null = cookModelAutomationTagForTypeKey(typeKey);
    if (!tag || !autoTag)
        return { status: 'needs-manual', typeKey, current: tagSummary(msx.Usage, msx.Quality, msx.UVResolution), proposed: '',
            reason: `no deterministic tag for '${typeKey}'` };

    const tagsMatch: boolean = msx.Usage === tag.usage && msx.Quality === tag.quality && msx.UVResolution === tag.uvResolution
        && model.idVPurpose === (downloadVPurpose ?? model.idVPurpose) && model.AutomationTag === autoTag;
    const contentComplete: boolean = msx.FileSize !== null && msx.BoundingBoxP1X !== null;
    const current: string = tagSummary(msx.Usage, msx.Quality, msx.UVResolution);
    const proposed: string = tagSummary(tag.usage, tag.quality, tag.uvResolution);

    if (tagsMatch) {
        if (contentComplete)
            return null;                                // fully correct — nothing to show
        return { status: 'needs-manual', typeKey, current, proposed,
            reason: 'tag correct but FileSize/bounding-box missing — run inspection to fully match a generated row' };
    }
    const contentNote: string = contentComplete ? '' : ' (note: FileSize/bbox missing — inspection recommended after the tag fix)';
    return { status: 'fixable', typeKey, current, proposed, reason: `${current} → ${proposed}${contentNote}` };
}

async function sceneSystemObjectIds(scopedIds?: number[]): Promise<number[]> {
    if (scopedIds && scopedIds.length > 0)
        return scopedIds;
    const scenes = await DBAPI.Scene.fetchAll();
    const ids: number[] = [];
    for (const scene of scenes ?? []) {
        const so = await DBAPI.SystemObject.fetchFromSceneID(scene.idScene);
        if (so) ids.push(so.idSystemObject);
    }
    return ids;
}

export const backfillDownloadTags: BulkOperationDef = {
    key: 'backfillDownloadTags',
    label: 'Backfill Download Tags',
    columns: [
        { key: 'status', label: 'Status' },
        { key: 'modelName', label: 'Model / Download' },
        { key: 'matchedType', label: 'Cook Type' },
        { key: 'currentTag', label: 'Current (Usage/Quality/UV)' },
        { key: 'proposedTag', label: 'Proposed (Usage/Quality/UV)' },
        { key: 'details', label: 'Details' },
    ],
    rowSettings: [],
    gather: async ({ scopedIds }: BulkOpGatherArgs, report: BulkOpReporter): Promise<BulkOpRow[]> => {
        const downloadVPurpose: number | undefined = await downloadPurposeId();
        const ids: number[] = await sceneSystemObjectIds(scopedIds);
        report(0, ids.length);
        const rows: BulkOpRow[] = [];
        let processed = 0;
        for (const idSceneSO of ids) {
            const sceneSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSceneSO);
            if (sceneSO && sceneSO.idScene) {
                const msxList: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromScene(sceneSO.idScene);
                for (const msx of msxList ?? []) {
                    const state = await classifyMSX(msx, downloadVPurpose);
                    if (!state)
                        continue;
                    const modelSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromModelID(msx.idModel);
                    if (!modelSO)
                        continue;                       // no SystemObject for the model — cannot target it
                    rows.push({
                        id: modelSO.idSystemObject,
                        name: msx.Name ?? `Model ${msx.idModel}`,
                        isCandidate: state.status === 'fixable',
                        rowData: {
                            status: state.status,
                            modelName: msx.Name ?? `Model ${msx.idModel}`,
                            matchedType: state.typeKey ?? '—',
                            currentTag: state.current,
                            proposedTag: state.proposed || '—',
                            details: state.reason,
                        },
                    });
                }
            }
            report(++processed, ids.length);
        }
        return rows;
    },
    apply: async (idSystemObject: number, _rowSettings: any, _idUser: number): Promise<BulkOpApplyResult> => {
        const so: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetch(idSystemObject);
        if (!so || !so.idModel)
            return { success: false, message: 'not a model' };
        const model: DBAPI.Model | null = await DBAPI.Model.fetch(so.idModel);
        if (!model)
            return { success: false, message: `cannot fetch model ${so.idModel}` };
        const downloadVPurpose: number | undefined = await downloadPurposeId();

        const msxList: DBAPI.ModelSceneXref[] | null = await DBAPI.ModelSceneXref.fetchFromModel(model.idModel);
        let applied = 0;
        let lastProposed = '';
        for (const msx of msxList ?? []) {
            // Re-derive at apply time so a stale gathered row can never drive a wrong write.
            const typeKey = cookDownloadTypeKeyFromFilename(msx.Name ?? '');
            if (typeKey === null || typeKey === 'ambiguous')
                continue;
            const tag = cookDownloadTagForTypeKey(typeKey);
            const autoTag = cookModelAutomationTagForTypeKey(typeKey);
            if (!tag || !autoTag)
                continue;

            const before = { usage: msx.Usage, quality: msx.Quality, uv: msx.UVResolution, idVPurpose: model.idVPurpose, automationTag: model.AutomationTag };
            msx.Usage = tag.usage;
            msx.Quality = tag.quality;
            msx.UVResolution = tag.uvResolution;
            if (!await msx.update())
                return { success: false, message: `failed to update ModelSceneXref ${msx.idModelSceneXref}` };
            if (downloadVPurpose)
                model.idVPurpose = downloadVPurpose;
            model.AutomationTag = autoTag;
            if (!await model.update())
                return { success: false, message: `failed to update Model ${model.idModel}` };

            await AuditFactory.emitSemantic({
                action: DBAPI.eAuditType.eActionDownloadTagBackfill,
                idSystemObject,
                payload: { typeKey, before, after: { usage: tag.usage, quality: tag.quality, uv: tag.uvResolution, idVPurpose: model.idVPurpose, automationTag: autoTag }, idScene: msx.idScene, via: 'bulkOperation' },
            });
            RK.logInfo(RK.LogSection.eHTTP,'backfill download tags','applied',{ idSystemObject, idModel: model.idModel, typeKey },'HTTP.Route.BulkOp.BackfillDownloadTags');
            lastProposed = `${tag.usage} / ${tag.quality} / ${tag.uvResolution}`;
            applied++;
        }
        if (applied === 0)
            return { success: false, message: 'no recognized download tag to apply for this model' };
        return { success: true, message: lastProposed, rowData: { status: 'fixable', currentTag: lastProposed, proposedTag: lastProposed, details: 'tag applied' } };
    },
};
