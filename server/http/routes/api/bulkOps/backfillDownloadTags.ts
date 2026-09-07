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
    current: string;         // concise Usage/Quality/UV triplet, for the visible Current column
    proposed: string;        // concise proposed triplet (empty for non-fixable)
    detail: string;          // plain-English description of the issue, for the visible Details column
    technical: string;       // full identity delta + diagnostics, CSV-only (hidden column)
    severity: 'ok' | 'warn'; // 'warn' for rows a human must handle (ambiguous / needs-manual)
}

const tagSummary = (usage: string | null | undefined, quality: string | null | undefined, uv: number | null | undefined): string =>
    `${usage ?? '∅'} / ${quality ?? '∅'} / ${uv ?? '∅'}`;

// The full recipe identity a generated row carries is broader than the Usage/Quality/UV triplet: it also
// includes Model.idVPurpose (must be Download) and Model.AutomationTag. The concise triplet is what the
// table shows; this fuller form (purpose + automation tag) is the CSV-only diagnostic so a purpose/tag-only
// fix is still fully documented without cluttering the table.
const purposeLabel = (idVPurpose: number | null | undefined, downloadVPurpose: number | undefined): string =>
    idVPurpose == null ? '∅' : (downloadVPurpose !== undefined && idVPurpose === downloadVPurpose ? 'Download' : `#${idVPurpose}`);
const identitySummary = (usage: string | null | undefined, quality: string | null | undefined, uv: number | null | undefined,
    idVPurpose: number | null | undefined, automationTag: string | null | undefined, downloadVPurpose: number | undefined): string =>
    `${tagSummary(usage, quality, uv)} · purpose=${purposeLabel(idVPurpose, downloadVPurpose)} · tag=${automationTag ?? '∅'}`;

async function downloadPurposeId(): Promise<number | undefined> {
    const v = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);
    return v?.idVocabulary;
}

// Classify one ModelSceneXref (a model-in-scene) that looks like a Cook download derivative.
async function classifyMSX(msx: DBAPI.ModelSceneXref, downloadVPurpose: number | undefined): Promise<TagState | null> {
    const triplet: string = tagSummary(msx.Usage, msx.Quality, msx.UVResolution);
    const typeKey = cookDownloadTypeKeyFromFilename(msx.Name ?? '');
    if (typeKey === null)
        return null;                                    // not a recognized download derivative — skip silently
    if (typeKey === 'ambiguous')
        return { status: 'ambiguous', typeKey: null, current: triplet, proposed: '', severity: 'warn',
            detail: 'Filename matches more than one Cook type — left unchanged for review.',
            technical: `filename '${msx.Name}' matches multiple Cook suffixes` };

    const model: DBAPI.Model | null = await DBAPI.Model.fetch(msx.idModel);
    if (!model)
        return { status: 'needs-manual', typeKey, current: triplet, proposed: '', severity: 'warn',
            detail: 'The model record is missing — re-ingest or regenerate.',
            technical: `Model ${msx.idModel} not found` };

    const tag: DownloadTag | null = cookDownloadTagForTypeKey(typeKey);
    const autoTag: string | null = cookModelAutomationTagForTypeKey(typeKey);
    if (!tag || !autoTag)
        return { status: 'needs-manual', typeKey, current: triplet, proposed: '', severity: 'warn',
            detail: 'No download tag applies to this file type.',
            technical: `typeKey '${typeKey}' has no tag mapping` };

    // Completeness is judged by FileSize alone: generation always sets it (the stored asset's StorageSize),
    // whereas the MSX bounding box is inherited from the source master and is routinely null even on a
    // freshly generated row — so it is not a completeness signal.
    const contentComplete: boolean = msx.FileSize !== null;
    const tripletDiffers: boolean = !(msx.Usage === tag.usage && msx.Quality === tag.quality && msx.UVResolution === tag.uvResolution);
    const purposeDiffers: boolean = model.idVPurpose !== (downloadVPurpose ?? model.idVPurpose);
    const autoTagDiffers: boolean = model.AutomationTag !== autoTag;
    const tagsMatch: boolean = !tripletDiffers && !purposeDiffers && !autoTagDiffers;

    const proposedTriplet: string = tagSummary(tag.usage, tag.quality, tag.uvResolution);
    const identityCurrent: string = identitySummary(msx.Usage, msx.Quality, msx.UVResolution, model.idVPurpose, model.AutomationTag, downloadVPurpose);
    const identityProposed: string = identitySummary(tag.usage, tag.quality, tag.uvResolution, downloadVPurpose ?? model.idVPurpose, autoTag, downloadVPurpose);

    if (tagsMatch) {
        if (contentComplete)
            return null;                                // fully correct — nothing to show
        return { status: 'needs-manual', typeKey, current: triplet, proposed: proposedTriplet, severity: 'warn',
            detail: 'Tag is correct but file size is missing — re-run Generate Downloads on the scene.',
            technical: `${identityCurrent} · FileSize null` };
    }
    const diffs: string[] = [];
    if (tripletDiffers) diffs.push('tag values');
    if (purposeDiffers) diffs.push('download purpose');
    if (autoTagDiffers) diffs.push('automation tag');
    const detail: string = `Differs from a generated download (${diffs.join(', ')}) — will be corrected.`
        + (contentComplete ? '' : ' File size is missing.');
    return { status: 'fixable', typeKey, current: triplet, proposed: proposedTriplet, severity: 'ok',
        detail, technical: `${identityCurrent} → ${identityProposed}` };
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
        { key: 'classification', label: 'Classification',
            tooltip: 'Fixable rows are corrected on Apply. “ambiguous” and “needs-manual” are report-only — '
                + 'Packrat will not change them automatically; they need a person (resolve an ambiguous filename, '
                + 're-ingest a missing model, or re-run Generate Downloads to complete content).' },
        { key: 'modelName', label: 'Model / Download' },
        { key: 'matchedType', label: 'Cook Type' },
        { key: 'currentTag', label: 'Current (Usage/Quality/UV)' },
        { key: 'proposedTag', label: 'Proposed (Usage/Quality/UV)' },
        { key: 'details', label: 'Details' },
        { key: 'technical', label: 'Technical', hidden: true }, // CSV-only: full identity delta + diagnostics
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
                        severity: state.severity,
                        rowData: {
                            classification: state.status,
                            modelName: msx.Name ?? `Model ${msx.idModel}`,
                            matchedType: state.typeKey ?? '—',
                            currentTag: state.current,
                            proposedTag: state.proposed || '—',
                            details: state.detail,
                            technical: state.technical,
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
        return { success: true, message: lastProposed, rowData: { classification: 'fixable', currentTag: lastProposed, proposedTag: lastProposed, details: 'tag applied' } };
    },
};
