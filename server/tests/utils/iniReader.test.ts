/**
 * Unit tests for the section-aware INI reader used by the volumetric sidecar parsers.
 */
import { parseIni, normalizeKey } from '../../utils/iniReader';

describe('iniReader — normalizeKey', () => {
    test('lowercases and strips non-alphanumerics', () => {
        expect(normalizeKey('Volume_SizeX')).toBe('volumesizex');
        expect(normalizeKey('Image Pixel Size (um)')).toBe('imagepixelsizeum');
        expect(normalizeKey('Voltage')).toBe('voltage');
    });
});

describe('iniReader — parseIni', () => {
    test('scopes keys by section and looks them up case-insensitively', () => {
        const doc = parseIni('[Geometry]\nVoxelSizeX=0.1\n[Xray]\nVoltage=210\n');
        expect(doc.hasSection('geometry')).toBe(true);
        expect(doc.hasSection('XRAY')).toBe(true);
        expect(doc.get('Xray', 'Voltage')).toBe('210');
        expect(doc.get('geometry', 'voxelsizex')).toBe('0.1');
        expect(doc.get('geometry', 'voltage')).toBeUndefined();
    });

    test('the same key in different sections does not collide', () => {
        const doc = parseIni('[Warmup]\nkV=215\n[Xray]\nVoltage=210\n');
        // a section-blind parser would let Warmup.kV masquerade as the scan voltage
        expect(doc.get('warmup', 'kv')).toBe('215');
        expect(doc.get('xray', 'voltage')).toBe('210');
    });

    test('splits on the first separator so colon-bearing values survive', () => {
        const doc = parseIni('[AutoScO]\nImageString=359:718:1077\nMGainVoltage=0:\n');
        expect(doc.get('autosco', 'imagestring')).toBe('359:718:1077');
        expect(doc.get('autosco', 'mgainvoltage')).toBe('0:');
    });

    test('last value wins for a duplicate key within a section', () => {
        const doc = parseIni('[S]\nk=1\nk=2\n');
        expect(doc.get('s', 'k')).toBe('2');
    });

    test('strips inline ; and # comments', () => {
        const doc = parseIni('[S]\nk=value ; trailing\nj=v2 # note\n');
        expect(doc.get('s', 'k')).toBe('value');
        expect(doc.get('s', 'j')).toBe('v2');
    });

    test('entries() yields every section/key/value triple', () => {
        const doc = parseIni('[A]\nx=1\n[B]\ny=2\n');
        const entries = doc.entries();
        expect(entries).toEqual(expect.arrayContaining([
            { section: 'a', key: 'x', value: '1' },
            { section: 'b', key: 'y', value: '2' },
        ]));
    });
});
