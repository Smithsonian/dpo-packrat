/**
 * Unit tests for the scene display-unit validity helpers:
 * SceneHelpers.unitToMeters, SceneHelpers.bestFitSceneUnit, SceneHelpers.validateBoundingBox.
 * These are the pure pieces of the Scene Scale QC check; the SVX read/write path is exercised elsewhere.
 */
import { SceneHelpers } from '../../utils/sceneHelpers';

describe('SceneHelpers.unitToMeters', () => {
    test('maps known units to meter scale factors', () => {
        expect(SceneHelpers.unitToMeters('mm')).toBeCloseTo(0.001);
        expect(SceneHelpers.unitToMeters('cm')).toBeCloseTo(0.01);
        expect(SceneHelpers.unitToMeters('m')).toBe(1);
        expect(SceneHelpers.unitToMeters('km')).toBe(1000);
        expect(SceneHelpers.unitToMeters('in')).toBeCloseTo(0.0254);
        expect(SceneHelpers.unitToMeters('ft')).toBeCloseTo(0.3048);
        expect(SceneHelpers.unitToMeters('yd')).toBeCloseTo(0.9144);
        expect(SceneHelpers.unitToMeters('mi')).toBeCloseTo(1609.344);
    });
    test('maps micrometer (um) to 1e-6 m', () => {
        expect(SceneHelpers.unitToMeters('um')).toBeCloseTo(0.000001);
    });
    test('is case-insensitive', () => {
        expect(SceneHelpers.unitToMeters('MM')).toBeCloseTo(0.001);
        expect(SceneHelpers.unitToMeters('M')).toBe(1);
    });
    test('returns null for inherit / unrecognized / empty', () => {
        expect(SceneHelpers.unitToMeters('inherit')).toBeNull();
        expect(SceneHelpers.unitToMeters('parsec')).toBeNull();
        expect(SceneHelpers.unitToMeters(null)).toBeNull();
        expect(SceneHelpers.unitToMeters(undefined)).toBeNull();
    });
});

describe('SceneHelpers.bestFitSceneUnit', () => {
    test('> 1 m -> m', () => {
        expect(SceneHelpers.bestFitSceneUnit(1.5)).toBe('m');
        expect(SceneHelpers.bestFitSceneUnit(5)).toBe('m');
    });
    test('> 0.1 and <= 1 -> cm (1.0 is the cm boundary)', () => {
        expect(SceneHelpers.bestFitSceneUnit(1)).toBe('cm');
        expect(SceneHelpers.bestFitSceneUnit(0.5)).toBe('cm');
        expect(SceneHelpers.bestFitSceneUnit(0.15)).toBe('cm');
    });
    test('<= 0.1 -> mm (0.1 is the mm boundary)', () => {
        expect(SceneHelpers.bestFitSceneUnit(0.1)).toBe('mm');
        expect(SceneHelpers.bestFitSceneUnit(0.05)).toBe('mm');
        expect(SceneHelpers.bestFitSceneUnit(0)).toBe('mm');
    });
});

describe('SceneHelpers.validateBoundingBox', () => {
    test('absent when null or malformed', () => {
        expect(SceneHelpers.validateBoundingBox(null).state).toBe('absent');
        expect(SceneHelpers.validateBoundingBox(undefined).state).toBe('absent');
        expect(SceneHelpers.validateBoundingBox({ min: [0, 0], max: [1, 1] }).state).toBe('absent');
    });
    test('valid box returns the longest side', () => {
        const r = SceneHelpers.validateBoundingBox({ min: [0, 0, 0], max: [2, 1, 0.5] });
        expect(r.state).toBe('valid');
        expect(r.longestSide).toBeCloseTo(2);
    });
    test('non-finite coordinates (NaN / Infinity) -> nonfinite', () => {
        expect(SceneHelpers.validateBoundingBox({ min: [0, 0, 0], max: [NaN, 1, 1] }).state).toBe('nonfinite');
        expect(SceneHelpers.validateBoundingBox({ min: [0, 0, 0], max: [Infinity, 1, 1] }).state).toBe('nonfinite');
    });
    test('inverted extents (min > max) -> inverted', () => {
        expect(SceneHelpers.validateBoundingBox({ min: [0, 0, 0], max: [-1, 1, 1] }).state).toBe('inverted');
    });
    test('collapsed axis (< 1e-9) -> degenerate', () => {
        expect(SceneHelpers.validateBoundingBox({ min: [0, 0, 0], max: [1, 1, 0] }).state).toBe('degenerate');
        expect(SceneHelpers.validateBoundingBox({ min: [0, 0, 0], max: [1, 1, 1e-10] }).state).toBe('degenerate');
    });
});

describe('SceneHelpers.unionModelObjectBoundingBox', () => {
    const mo = (p1: number[], p2: number[]) => ({
        BoundingBoxP1X: p1[0], BoundingBoxP1Y: p1[1], BoundingBoxP1Z: p1[2],
        BoundingBoxP2X: p2[0], BoundingBoxP2Y: p2[1], BoundingBoxP2Z: p2[2],
    });

    test('null / empty yields null', () => {
        expect(SceneHelpers.unionModelObjectBoundingBox(null)).toBeNull();
        expect(SceneHelpers.unionModelObjectBoundingBox([])).toBeNull();
    });
    test('single complete box passes through', () => {
        expect(SceneHelpers.unionModelObjectBoundingBox([mo([0, 0, 0], [2, 1, 0.5])])).toEqual({ min: [0, 0, 0], max: [2, 1, 0.5] });
    });
    test('unions multiple ModelObjects per axis', () => {
        const r = SceneHelpers.unionModelObjectBoundingBox([mo([0, 0, 0], [1, 1, 1]), mo([-1, 2, 0.5], [0.5, 3, 4])]);
        expect(r).toEqual({ min: [-1, 0, 0], max: [1, 3, 4] });
    });
    test('tolerates P1/P2 ordering (P1 > P2)', () => {
        expect(SceneHelpers.unionModelObjectBoundingBox([mo([2, 1, 0.5], [0, 0, 0])])).toEqual({ min: [0, 0, 0], max: [2, 1, 0.5] });
    });
    test('skips ModelObjects with a null or non-finite coordinate', () => {
        const withNull = { BoundingBoxP1X: 0, BoundingBoxP1Y: 0, BoundingBoxP1Z: 0, BoundingBoxP2X: null, BoundingBoxP2Y: 1, BoundingBoxP2Z: 1 };
        expect(SceneHelpers.unionModelObjectBoundingBox([withNull])).toBeNull();
        expect(SceneHelpers.unionModelObjectBoundingBox([withNull, mo([0, 0, 0], [1, 1, 1])])).toEqual({ min: [0, 0, 0], max: [1, 1, 1] });
    });
});
