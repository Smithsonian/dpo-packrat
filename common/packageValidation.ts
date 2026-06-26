/**
 * Package type validation — pure predicates that decide which asset type(s) an uploaded package
 * (a single file, or the file list inside a zip) is compatible with, and whether the user's selected
 * asset type is allowed.
 *
 * Decision rule is membership: a package is compatible with the selected type iff that type is among
 * the types the package could be. Each predicate evaluates the WHOLE file list (it must account for
 * every decisive file), so a contaminated package (e.g. a mesh alongside DICOM slices) satisfies no
 * structured predicate and is therefore rejected for any concrete selection.
 *
 * Pure and dependency-free so the same logic backs both the server upload gate and client-side UX.
 */
import { eVocabularyID, eFileCategory, classifyFile } from './constants';

export interface PackageSummary {
    counts: Record<eFileCategory, number>;
    total: number;
    hasHtml: boolean;
}

const emptyCounts = (): Record<eFileCategory, number> => ({
    [eFileCategory.eMesh]: 0,
    [eFileCategory.eModelMaterial]: 0,
    [eFileCategory.eImage]: 0,
    [eFileCategory.eVolumetricSlice]: 0,
    [eFileCategory.eVolumetricSidecar]: 0,
    [eFileCategory.eSceneDescriptor]: 0,
    [eFileCategory.eDocument]: 0,
    [eFileCategory.eAudio]: 0,
    [eFileCategory.eUnknown]: 0,
});

export function summarizePackage(files: string[]): PackageSummary {
    const counts: Record<eFileCategory, number> = emptyCounts();
    let hasHtml = false;
    for (const file of files) {
        counts[classifyFile(file)] += 1;
        const lower: string = file.toLowerCase();
        if (lower.endsWith('.html') || lower.endsWith('.htm'))
            hasHtml = true;
    }
    return { counts, total: files.length, hasHtml };
}

const has = (s: PackageSummary, c: eFileCategory): boolean => s.counts[c] > 0;

// ─── Per-type predicates (whole-package) ─────────────────────────────────────
// Each: required anchor present AND no foreign decisive category present.

export function canBeModel(s: PackageSummary): boolean {
    return has(s, eFileCategory.eMesh)
        && !has(s, eFileCategory.eSceneDescriptor)
        && !has(s, eFileCategory.eVolumetricSlice);
}

export function canBePhotogrammetry(s: PackageSummary): boolean {
    return has(s, eFileCategory.eImage)
        && !has(s, eFileCategory.eMesh)
        && !has(s, eFileCategory.eSceneDescriptor)
        && !has(s, eFileCategory.eVolumetricSlice)
        && !has(s, eFileCategory.eVolumetricSidecar);   // a sidecar pushes the package to Volumetric
}

export function canBeVolumetric(s: PackageSummary): boolean {
    // Anchored by slice data OR an image stack (tiff/png). Sidecar/Document ride along as ancillary.
    return (has(s, eFileCategory.eVolumetricSlice) || has(s, eFileCategory.eImage))
        && !has(s, eFileCategory.eMesh)
        && !has(s, eFileCategory.eSceneDescriptor);
}

export function canBeScene(s: PackageSummary): boolean {
    // Plausibility only: an svx plus at least one mesh. Full 5/6-derivative completeness is enforced
    // downstream in scene ingestion, not here.
    return has(s, eFileCategory.eSceneDescriptor)
        && has(s, eFileCategory.eMesh)
        && !has(s, eFileCategory.eVolumetricSlice);
}

export function canBeDocumentation(s: PackageSummary): boolean {
    // A scan sidecar (.pca/.pcr) is itself a document, so it can anchor a documentation package alone.
    const docAnchor: boolean = has(s, eFileCategory.eDocument) || has(s, eFileCategory.eVolumetricSidecar);
    // Images are only acceptable as part of html articles; a bare image set is capture data, not docs.
    const bareImages: boolean = has(s, eFileCategory.eImage) && !s.hasHtml;
    return docAnchor
        && !has(s, eFileCategory.eMesh)
        && !has(s, eFileCategory.eSceneDescriptor)
        && !has(s, eFileCategory.eVolumetricSlice)
        && !bareImages;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

// Asset types this module adjudicates. Anything outside this set — Other, Bulk Ingestion, and the
// silenced legacy capture types — is intentionally NOT gated (see isCompatible).
const validatableTypes: ReadonlySet<eVocabularyID> = new Set<eVocabularyID>([
    eVocabularyID.eAssetAssetTypeModel,
    eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry,
    eVocabularyID.eAssetAssetTypeCaptureDataSetVolumetric,
    eVocabularyID.eAssetAssetTypeScene,
    eVocabularyID.eAssetAssetTypeProjectDocumentation,
]);

export function isValidatableType(selected: eVocabularyID): boolean {
    return validatableTypes.has(selected);
}

export interface PackageAssessment {
    possibleTypes: Set<eVocabularyID>;
    summary: PackageSummary;
}

export function assessPackage(files: string[]): PackageAssessment {
    const summary: PackageSummary = summarizePackage(files);
    const possibleTypes: Set<eVocabularyID> = new Set<eVocabularyID>();
    if (canBeModel(summary))          possibleTypes.add(eVocabularyID.eAssetAssetTypeModel);
    if (canBePhotogrammetry(summary)) possibleTypes.add(eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry);
    if (canBeVolumetric(summary))     possibleTypes.add(eVocabularyID.eAssetAssetTypeCaptureDataSetVolumetric);
    if (canBeScene(summary))          possibleTypes.add(eVocabularyID.eAssetAssetTypeScene);
    if (canBeDocumentation(summary))  possibleTypes.add(eVocabularyID.eAssetAssetTypeProjectDocumentation);
    return { possibleTypes, summary };
}

// Compatible iff the selected type is one we don't gate (Other / Bulk / legacy), or the package could
// be that type. A package matching no structured predicate is incompatible with every gated type.
export function isCompatible(selected: eVocabularyID, possibleTypes: Set<eVocabularyID>): boolean {
    if (!isValidatableType(selected))
        return true;
    return possibleTypes.has(selected);
}
