/* eslint-disable */
// Static companion to the assertion-count gate (TR-0.8). ENFORCING: exits
// non-zero (fails CI) on any finding — wired into the lint job.
//
// The assertion-count gate catches tests that assert NOTHING. This AST pass
// catches tests that assert something meaningless in ways a count gate is blind
// to (every case still calls expect()):
//   - ALL-ASSERTIONS-IF-GUARDED: a happy path whose only assertions sit inside
//     `if (x) {…}` guards, so a null precondition passes silently.
//   - EARLY done(): a done() with assertions still after it in source order.
//   - SKIP WITHOUT A REASON: a .skip/.todo/x-form/opt-in-gate skip with no
//     SKIP_REASON comment (silent skips are invisible coverage loss).
//
// NOT gated here: `id: 0` no-op queries. A lookup by id 0 is a LEGITIMATE
// negative test (e.g. tests/db/nullZeroId.test.ts asserts fetch(0) === null), so
// flagging it produces mostly false positives. The real id:0 tautologies were
// fixed by hand instead of gated.
//
// Usage:  node tests/scanWeakAssertions.js
// Scans server/tests/**/*.test.ts (incl. the graphql aggregator sub-modules that
// jest never runs as standalone files).

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SKIP_DIRS = new Set(['node_modules', 'mock', 'fixtures']);

function walk(dir, acc) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
            if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), acc);
        } else if (e.name.endsWith('.test.ts')) {
            acc.push(path.join(dir, e.name));
        }
    }
    return acc;
}

function lineOf(node, sf) {
    return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function isExpectCall(n) {
    return ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'expect';
}

// test(...) / it(...) / fit(...) / test.only(...) — NOT .skip/.todo (they don't run).
function testCallback(n) {
    if (!ts.isCallExpression(n)) return null;
    const e = n.expression;
    let isTest = false;
    if (ts.isIdentifier(e)) isTest = ['test', 'it', 'fit'].includes(e.text);
    else if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression))
        isTest = ['test', 'it'].includes(e.expression.text) && e.name.text === 'only';
    if (!isTest) return null;
    const cb = n.arguments.find(a => ts.isArrowFunction(a) || ts.isFunctionExpression(a));
    const name = n.arguments[0] && ts.isStringLiteral(n.arguments[0]) ? n.arguments[0].text : '<dynamic>';
    return cb ? { cb, name } : null;
}

function scanTest(cb, sf) {
    const expects = [];   // { guarded, pos }
    const dones = [];     // { line, pos }

    let hasCoveringIfElse = false;
    function subtreeHasExpect(n) {
        let found = false;
        (function w(x) { if (found) return; if (isExpectCall(x)) { found = true; return; } ts.forEachChild(x, w); })(n);
        return found;
    }

    function visit(node, inIf) {
        if (isExpectCall(node)) expects.push({ guarded: inIf, pos: node.getStart(sf) });
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'done')
            dones.push({ line: lineOf(node, sf), pos: node.getStart(sf) });
        // An if/else that asserts in BOTH branches always reaches an assertion, so it
        // is not a silent-skip (distinguishes `if (c) expect(a) else expect(b)` from
        // the vacuous `if (c) { expect(a) }` with no else).
        if (ts.isIfStatement(node) && node.elseStatement &&
            subtreeHasExpect(node.thenStatement) && subtreeHasExpect(node.elseStatement))
            hasCoveringIfElse = true;
        ts.forEachChild(node, child => {
            const childInIf = inIf || (ts.isIfStatement(node) && (child === node.thenStatement || child === node.elseStatement));
            visit(child, childInIf);
        });
    }
    visit(cb.body, false);

    // An "early" done() is one with an assertion still to run after it in source
    // order — i.e. calling it did not actually stop the test. A terminal done()
    // (nothing asserts after it) is legitimate callback-style completion.
    const earlyDones = dones.filter(d => expects.some(e => e.pos > d.pos)).map(d => d.line);
    return { expects, earlyDones, hasCoveringIfElse };
}

const files = walk(ROOT, []);
const guarded = [];
const earlyDone = [];
const unreasonedSkips = [];

// A skipped describe/test must state WHY, via a SKIP_REASON comment (TR-0.8c) — a
// silent skip is invisible coverage loss. Covers literal `.skip`, the x-prefixed
// forms, `.todo`, and the `cond ? describe : describe.skip` opt-in gate form.
const SKIP_RE = /(?:\b(?:describe|test|it|fdescribe|fit)\.skip\b)|(?:\bx(?:describe|it|test)\s*\()|(?:\b(?:test|it)\.todo\b)/;

for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');

    if (SKIP_RE.test(text) && !/SKIP_REASON/.test(text))
        unreasonedSkips.push(`${rel}  (skipped test/suite without a SKIP_REASON comment)`);

    (function crawl(node) {
        const t = testCallback(node);
        if (t) {
            const r = scanTest(t.cb, sf);
            const line = lineOf(node, sf);
            if (r.expects.length > 0 && r.expects.every(e => e.guarded) && !r.hasCoveringIfElse)
                guarded.push(`${rel}:${line}  [${r.expects.length} assertion(s), all if-guarded]  ${t.name}`);
            for (const dl of r.earlyDones)
                earlyDone.push(`${rel}:${dl}  early done() — assertions run after it  (${t.name})`);
        }
        ts.forEachChild(node, crawl);
    })(sf);
}

function section(title, rows) {
    console.log(`\n=== ${title} (${rows.length}) ===`);
    if (!rows.length) { console.log('  (none)'); return; }
    for (const r of rows) console.log('  ' + r);
}

console.log(`Scanned ${files.length} *.test.ts files under tests/`);
section('ALL-ASSERTIONS-IF-GUARDED (pass silently on a null precondition)', guarded);
section('EARLY done() (execution continues past the early-exit)', earlyDone);
section('SKIP WITHOUT A REASON (add a SKIP_REASON comment)', unreasonedSkips);
console.log(`\nTotals: guarded=${guarded.length} earlyDone=${earlyDone.length} unreasonedSkips=${unreasonedSkips.length}`);

// Enforcement (TR-0.8): non-zero exit on any finding so CI fails on a new weak
// test or an undocumented skip. All categories are at zero today; keep them there.
if (guarded.length > 0 || earlyDone.length > 0 || unreasonedSkips.length > 0) {
    console.error('\nFAIL: weak-assertion or unexplained-skip test(s) present. Assert a value that ' +
        'would fail on regression (not just truthiness behind an if-guard), fix the early done(), or ' +
        'add a SKIP_REASON comment explaining any skip. See PLAN_TESTING_RELIABILITY.md TR-0.8.');
    process.exit(1);
}
