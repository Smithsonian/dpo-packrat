import * as COMMON from '@dpo-packrat/common';

// Turns a raw Cook job report into ranked, structured findings so a failure reason is surfaced as
// coded report events for every recipe, instead of being left buried in the raw report body that a
// user must read by eye. Every rule keys off signals Cook itself returns — the per-step logs and
// error strings — so nothing here parses the source model, which may be very large or, like GLB,
// opaque. Recipe-specific structured checks (e.g. the inspection-result material/geometry checks)
// stay in their own job classes; this module handles the log/error signals common to all recipes.

export interface CookScanFinding {
    code: COMMON.WorkflowReportCodeType;
    level: COMMON.WorkflowReportLevel;
    message: string;
}

export interface CookScanResult {
    errors: CookScanFinding[];
    warnings: CookScanFinding[];
}

interface CookReportLike {
    state?: string;
    error?: string;
    recipe?: { name?: string };
    steps?: { [step: string]: { error?: string; log?: Array<{ message?: string }> } };
}

// The inspection recipe intentionally uploads only geometry, .mtl and .bin — never texture images —
// so Cook always reports referenced images as unloadable during inspection. Image/texture-load rules
// therefore do not apply to it; genuine missing-texture detection happens on recipes that ship the
// full textured package. The .mtl IS sent to the inspector, so its read-failure rule still applies.
const INSPECT_RECIPE_NAME: string = 'si-packrat-inspect';

// Collect every log message across all steps, plus per-step and top-level error strings, into one
// flat list the rules can scan for corroborating markers.
function collectMessages(report: CookReportLike): string[] {
    const messages: string[] = [];
    if (typeof report.error === 'string' && report.error.length > 0)
        messages.push(report.error);

    const steps = report.steps;
    if (steps && typeof steps === 'object') {
        for (const key of Object.keys(steps)) {
            const step = steps[key];
            if (!step || typeof step !== 'object')
                continue;
            if (typeof step.error === 'string' && step.error.length > 0)
                messages.push(step.error);
            if (Array.isArray(step.log)) {
                for (const entry of step.log)
                    if (entry && typeof entry.message === 'string' && entry.message.length > 0)
                        messages.push(entry.message);
            }
        }
    }
    return messages;
}

const contains = (messages: string[], needle: string): boolean =>
    messages.some(m => m.includes(needle));

// Translate a Cook tool-termination error into a friendly, actionable message using corroborating
// log lines. Known tools get a specific reason; any other terminated tool gets a named generic so
// the offending step is identified even when the exact cause is only in the raw report.
function friendlyToolError(primary: string, messages: string[]): string {
    if (primary.includes('Tool Blender: terminated with code'))
        return contains(messages, 'Error: Unsupported file type: .zip')
            ? 'Zip package is invalid or corrupt.'
            : 'Blender step failed. See the Cook report.';

    if (primary.includes('Tool MeshSmith: terminated with code'))
        return contains(messages, 'Invalid vertex index')
            ? 'Invalid mesh. Missing vertices or faces.'
            : 'MeshSmith step failed. See the Cook report.';

    const toolMatch: RegExpMatchArray | null = primary.match(/Tool ([A-Za-z0-9_]+): terminated with code/);
    if (toolMatch)
        return `Cook step "${toolMatch[1]}" failed. See the Cook report.`;

    return primary;
}

// Produce ranked, coded findings from a Cook report. Errors are only emitted when Cook itself
// reports the job as errored; the warning tier (non-blocking issues surfaced from an otherwise
// successful run) is populated by recipe-specific callers and is intentionally empty here.
export function scanCookReport(cookJobReport: unknown): CookScanResult {
    const errors: CookScanFinding[] = [];
    const warnings: CookScanFinding[] = [];
    if (!cookJobReport || typeof cookJobReport !== 'object')
        return { errors, warnings };

    const report: CookReportLike = cookJobReport as CookReportLike;

    if (report.state === 'error') {
        const messages: string[] = collectMessages(report);
        const primary: string = (typeof report.error === 'string' && report.error.length > 0)
            ? report.error
            : (messages.find(m => /terminated with code|not found|failed|invalid/i.test(m)) ?? 'Cook reported an error.');

        const message: string = friendlyToolError(primary, messages);
        errors.push({ code: COMMON.WorkflowReportCode.CookError, level: 'error', message });
    }

    // Non-blocking advisories Cook writes into step logs even on an otherwise-successful run: a
    // referenced texture image or material file it could not load and worked around. These are
    // ordinary log lines that would otherwise stay buried in the raw report body, so surface them
    // for every recipe. Benign engine chatter (e.g. a Blender DeprecationWarning) is deliberately
    // excluded by the curated rule set.
    for (const warning of collectCookLogWarnings(report))
        warnings.push(warning);

    return { errors, warnings };
}

// A Cook step-log line that signals a real asset problem, keyed to a friendly, user-facing message.
// Kept curated (not a blanket "[ISSUE]"/"WARNING" match) so engine deprecation notices and other
// noise do not become user-visible advisories.
interface CookLogWarningRule { test: RegExp; message: string; skipRecipes?: string[] }
const COOK_LOG_WARNING_RULES: CookLogWarningRule[] = [
    { test: /cannot load image file|cannot load image|could not load .*(texture|image)/i,
        message: 'A referenced texture image could not be loaded (the file is missing or unreadable). The model ingests without that texture.',
        skipRecipes: [INSPECT_RECIPE_NAME] },
    { test: /cannot read from mtl file|cannot read .*\.mtl|could not read .*material library/i,
        message: 'A referenced material library (.mtl) could not be read (the file is missing or unreadable). The model ingests without its materials.' },
    { test: /missing texture|texture file .*not found|referenced texture .*missing/i,
        message: 'A referenced texture file is missing. The model ingests without that texture.',
        skipRecipes: [INSPECT_RECIPE_NAME] },
];

// Scan the raw Cook step logs for the curated asset-problem markers above and return one CookWarning
// per distinct match. Pure and separate from the verify path so it is unit-testable.
export function collectCookLogWarnings(cookJobReport: unknown): CookScanFinding[] {
    const warnings: CookScanFinding[] = [];
    if (!cookJobReport || typeof cookJobReport !== 'object')
        return warnings;
    const report: CookReportLike = cookJobReport as CookReportLike;
    const recipeName: string = report.recipe?.name ?? '';
    const messages: string[] = collectMessages(report);
    for (const rule of COOK_LOG_WARNING_RULES) {
        if (rule.skipRecipes && rule.skipRecipes.includes(recipeName))
            continue;
        if (messages.some(m => rule.test.test(m)))
            pushWarning(warnings, rule.message);
    }
    return warnings;
}

function pushWarning(warnings: CookScanFinding[], message: string): void {
    if (warnings.some(w => w.message === message))
        return;
    warnings.push({ code: COMMON.WorkflowReportCode.CookWarning, level: 'warn', message });
}

// Non-blocking advisories derived from a successful inspection result: likely mistakes that do not
// prevent ingest, so they are surfaced as CookWarning rather than failing the job. Kept pure and
// separate from the verify path so it is unit-testable. Only the first mesh is examined, matching
// the existing single-mesh convention in the inspector.
interface InspectionMaterial { name?: string; channels?: Array<{ type?: string }> }

export function collectInspectionWarnings(inspectionRoot: unknown): CookScanFinding[] {
    const warnings: CookScanFinding[] = [];
    if (!inspectionRoot || typeof inspectionRoot !== 'object')
        return warnings;

    const root = inspectionRoot as {
        scene?: { materials?: InspectionMaterial[] };
        meshes?: Array<{ statistics?: { hasNormals?: boolean } }>;
    };
    const firstMeshStats = Array.isArray(root.meshes) ? root.meshes[0]?.statistics : undefined;

    // Missing normals are a likely oversight but are derivable downstream, so advise rather than block.
    if (firstMeshStats?.hasNormals === false)
        pushWarning(warnings, 'Model has no normals; they will be derived downstream.');

    // A material Cook resolved with no diffuse channel is effectively empty: it comes from an empty
    // .mtl or a usemtl name that matched no material definition, so Cook falls back to a default
    // (roughness-only) material. The geometry still ingests, so advise rather than block. A material
    // carrying a diffuse channel — a texture uri and/or a colour value — is a normal material and is
    // not flagged, so a legitimately untextured, solid-colour model does not trip this.
    const materials: InspectionMaterial[] = Array.isArray(root.scene?.materials) ? (root.scene as { materials: InspectionMaterial[] }).materials : [];
    for (const material of materials) {
        const hasDiffuse: boolean = Array.isArray(material?.channels)
            && material.channels.some(c => typeof c?.type === 'string' && c.type.toLowerCase() === 'diffuse');
        if (!hasDiffuse)
            pushWarning(warnings, `Material "${material?.name ?? 'unnamed'}" has no diffuse channel (empty or unmatched .mtl).`);
    }

    return warnings;
}
