import * as COMMON from '@dpo-packrat/common';

// Recipe-aware description of the files a Cook run is expected to produce for a scene, and the
// single basename rule shared by the pre-flight guard (before a job is submitted) and the post-Cook
// verification (after a job returns). Keeping both paths on this one rule is the point of the file:
// the pre-flight guard must not accept a run the post-Cook check will later reject.

export type CookRecipeKey = 'si-generate-downloads' | 'si-voyager-scene';

// The scene descriptor is expected alongside the downloads but is not itself a download. Its extname
// is '.json', so it is not part of COMMON.cookDownloadSuffixes and must be listed explicitly.
const SVX_SUFFIX: string = '.svx.json';

export interface CookOutputPrediction {
    filenames: string[];   // predicted output filenames, all sharing sceneBaseName
    closed: boolean;       // true = the full output set is known (downloads); false = open set (scene gen)
}

export interface BasenameOffender {
    suffix: string;        // the Cook suffix both files share
    expected: string;      // the name the current run will produce (predicted, or Cook's actual output)
    actual: string;        // the existing scene asset that carries the same suffix and differs
}

// The endsWith-form suffixes that identify a recipe's outputs. si-generate-downloads emits the six
// CookDownloadDescriptors plus the SVX descriptor; si-voyager-scene's output set is open (1 SVX + N
// SVX-named Web3D models) and only the SVX name is Packrat-dictated, so it is the only asserted name.
export function cookOutputSuffixes(recipe: CookRecipeKey): string[] {
    switch (recipe) {
        case 'si-generate-downloads': return [...COMMON.cookDownloadSuffixes('full'), SVX_SUFFIX];
        case 'si-voyager-scene':      return [SVX_SUFFIX];
    }
}

// Predict the filenames a Cook run will produce for a scene, from its basename. Cook names every
// output `${outputFileBaseName}${suffix}`, so the download set is fully predictable pre-submission.
// Scene generation only predicts the SVX name; its derivative names are consumed verbatim from the
// returned SVX and are never derived or asserted by Packrat.
export function predictCookOutput(recipe: CookRecipeKey, sceneBaseName: string): CookOutputPrediction {
    switch (recipe) {
        case 'si-generate-downloads':
            return {
                filenames: [
                    ...COMMON.cookDownloadSuffixes('full').map(suffix => `${sceneBaseName}${suffix}`),
                    `${sceneBaseName}${SVX_SUFFIX}`,
                ],
                closed: true,
            };
        case 'si-voyager-scene':
            return { filenames: [`${sceneBaseName}${SVX_SUFFIX}`], closed: false };
    }
}

// The shared basename rule. For each candidate filename (a predicted name pre-flight, or a Cook
// output post-Cook), find the existing scene asset that carries the same Cook suffix; if one exists
// and its filename differs, that is an offender. Absence of a same-suffix asset is never an offender
// (first-run and partial-set scenes must pass). Reports every offender, not just the first.
export function findBasenameOffenders(recipe: CookRecipeKey, candidateFilenames: string[], existingFilenames: string[]): BasenameOffender[] {
    const suffixes: string[] = cookOutputSuffixes(recipe);
    const offenders: BasenameOffender[] = [];
    for (const candidate of candidateFilenames) {
        const suffix: string | undefined = suffixes.find(s => candidate.endsWith(s));
        if (!suffix)
            continue; // not a recognized output for this recipe; the basename rule does not apply
        const existing: string | undefined = existingFilenames.find(f => f.endsWith(suffix));
        if (existing && existing !== candidate)
            offenders.push({ suffix, expected: candidate, actual: existing });
    }
    return offenders;
}

// The deterministic ModelSceneXref tag (Usage/Quality/UVResolution) a Cook download-type key maps to.
// This is the single source of truth shared by si-generate-downloads generation and the backfill op, so
// a repaired legacy row carries values identical to a freshly generated one. Returns null for a type key
// that is not a recognized download output.
export interface DownloadTag { usage: string; quality: string; uvResolution: number; }
export function cookDownloadTagForTypeKey(typeKey: string): DownloadTag | null {
    switch (typeKey) {
        case 'objZipFull':                 return { usage: `Download:${typeKey}`, quality: 'Highest', uvResolution: 0 };
        case 'objZipLow':
        case 'gltfZipLow':
        case 'webAssetGlbLowUncompressed': return { usage: `Download:${typeKey}`, quality: 'Low', uvResolution: 4096 };
        case 'webAssetGlbARCompressed':    return { usage: 'App3D',    quality: 'AR', uvResolution: 2048 };
        case 'usdz':                       return { usage: 'iOSApp3D', quality: 'AR', uvResolution: 2048 };
    }
    return null;
}

// The Model.AutomationTag a download-type key maps to (same values si-generate-downloads writes).
export function cookModelAutomationTagForTypeKey(typeKey: string): string | null {
    const tag: DownloadTag | null = cookDownloadTagForTypeKey(typeKey);
    if (!tag)
        return null;
    switch (typeKey) {
        case 'objZipFull':
        case 'objZipLow':
        case 'gltfZipLow':
        case 'webAssetGlbLowUncompressed': return `download-${typeKey}-${tag.quality}-${tag.uvResolution}`;
        case 'webAssetGlbARCompressed':
        case 'usdz':                       return `scene-${tag.usage}-${tag.quality}-${tag.uvResolution}`;
    }
    return null;
}

// The Cook download typeKey a filename maps to, by endsWith over the canonical suffix table. Returns
// null for no match and 'ambiguous' when more than one suffix matches, so callers (backfill) never guess.
export function cookDownloadTypeKeyFromFilename(fileName: string): string | null | 'ambiguous' {
    const matches = COMMON.CookDownloadDescriptors.filter(d => fileName.endsWith(d.suffixFull));
    if (matches.length === 0)
        return null;
    if (matches.length > 1)
        return 'ambiguous';
    return matches[0].typeKey;
}
