/* eslint-disable */
// Static companion to the report-only assertion-count gate (TR-0.8).
//
// The assertion-count gate catches tests that assert NOTHING. It cannot catch
// tests that assert something meaningless — the far larger class flagged in the
// testing audit: `id: 0` no-op queries that accept null-or-anything, and happy
// paths whose only assertions sit inside `if (x) {…}` guards so a null
// precondition passes silently. Those all call expect(), so a count gate is
// blind to them. This AST pass flags them for human review. Report-only.
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

// A read/query-style call whose id:0 argument is a genuine lookup (not a
// pre-insert create placeholder, where id:0 is correct).
function isQueryCall(node) {
    if (!ts.isCallExpression(node)) return false;
    const e = node.expression;
    const nm = ts.isIdentifier(e) ? e.text : (ts.isPropertyAccessExpression(e) ? e.name.text : null);
    return !!nm && /^(get|search|are|fetch)/.test(nm);
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
    const idZeros = [];   // { line, name }  — only inside query-style calls

    function scanObjForIdZero(node) {
        (function w(n) {
            if (ts.isPropertyAssignment(n) && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name))) {
                const nm = n.name.text, init = n.initializer;
                if (/^id/i.test(nm) && init && init.kind === ts.SyntaxKind.NumericLiteral && init.text === '0')
                    idZeros.push({ line: lineOf(n, sf), name: nm });
            }
            ts.forEachChild(n, w);
        })(node);
    }

    function visit(node, inIf) {
        if (isExpectCall(node)) expects.push({ guarded: inIf, pos: node.getStart(sf) });
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'done')
            dones.push({ line: lineOf(node, sf), pos: node.getStart(sf) });
        if (isQueryCall(node))
            for (const a of node.arguments) if (ts.isObjectLiteralExpression(a)) scanObjForIdZero(a);
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
    return { expects, earlyDones, idZeros };
}

const files = walk(ROOT, []);
const guarded = [];
const earlyDone = [];

for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');

    (function crawl(node) {
        const t = testCallback(node);
        if (t) {
            const r = scanTest(t.cb, sf);
            const line = lineOf(node, sf);
            if (r.expects.length > 0 && r.expects.every(e => e.guarded))
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
console.log(`\nTotals: guarded=${guarded.length} earlyDone=${earlyDone.length}`);
