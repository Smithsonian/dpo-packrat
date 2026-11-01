import {
    inspectObjPackage, objPackageNeedsMtl, parseObjMaterialRefs, classifyPackageTextures, buildMinimalMtl
} from '../../job/impl/Cook/CookObjPackage';

describe('Cook: CookObjPackage.inspectObjPackage', () => {
    test('classifies obj, mtl and image entries', () => {
        const shape = inspectObjPackage(['model.obj', 'model.mtl', 'diffuse.jpg', 'notes.txt']);
        expect(shape.objFile).toBe('model.obj');
        expect(shape.hasMtl).toBe(true);
        expect(shape.images).toEqual(['diffuse.jpg']);
    });

    test('reports the first obj and no mtl when absent', () => {
        const shape = inspectObjPackage(['a.obj', 'b.obj', 'tex-diffuse.png', 'tex-normal.png']);
        expect(shape.objFile).toBe('a.obj');
        expect(shape.hasMtl).toBe(false);
        expect(shape.images).toHaveLength(2);
    });
});

describe('Cook: CookObjPackage.objPackageNeedsMtl', () => {
    test('true for an OBJ + textures package with no .mtl', () => {
        expect(objPackageNeedsMtl({ objFile: 'm.obj', hasMtl: false, images: ['d.jpg'] })).toBe(true);
    });

    test('false when a .mtl is already present', () => {
        expect(objPackageNeedsMtl({ objFile: 'm.obj', hasMtl: true, images: ['d.jpg'] })).toBe(false);
    });

    test('false when there is no obj', () => {
        expect(objPackageNeedsMtl({ objFile: undefined, hasMtl: false, images: ['d.jpg'] })).toBe(false);
    });

    test('false when there are no textures', () => {
        expect(objPackageNeedsMtl({ objFile: 'm.obj', hasMtl: false, images: [] })).toBe(false);
    });
});

describe('Cook: CookObjPackage.parseObjMaterialRefs', () => {
    test('extracts mtllib and usemtl references', () => {
        const refs = parseObjMaterialRefs('# header\nmtllib Gunboat-150k.mtl\nv 0 0 0\nusemtl material_0\nf 1 2 3\n');
        expect(refs.mtllib).toBe('Gunboat-150k.mtl');
        expect(refs.usemtl).toBe('material_0');
    });

    test('returns the basename of a pathed mtllib', () => {
        const refs = parseObjMaterialRefs('mtllib ./sub/Model.mtl\nusemtl M\n');
        expect(refs.mtllib).toBe('Model.mtl');
    });

    test('leaves fields undefined when the obj has no material directives', () => {
        const refs = parseObjMaterialRefs('v 0 0 0\nf 1 2 3\n');
        expect(refs.mtllib).toBeUndefined();
        expect(refs.usemtl).toBeUndefined();
    });
});

describe('Cook: CookObjPackage.classifyPackageTextures', () => {
    test('picks diffuse and normal by name convention', () => {
        const { diffuse, normal } = classifyPackageTextures(['G-150k-4096-diffuse.jpg', 'G-150k-4096-normal.jpg']);
        expect(diffuse).toBe('G-150k-4096-diffuse.jpg');
        expect(normal).toBe('G-150k-4096-normal.jpg');
    });

    test('does not reuse the normal map as the diffuse', () => {
        const { diffuse, normal } = classifyPackageTextures(['only-normal.png']);
        expect(normal).toBe('only-normal.png');
        expect(diffuse).toBeUndefined();
    });

    test('falls back to the first non-normal image when no diffuse name matches', () => {
        const { diffuse, normal } = classifyPackageTextures(['texture_a.png', 'texture_normal.png']);
        expect(normal).toBe('texture_normal.png');
        expect(diffuse).toBe('texture_a.png');
    });

    test('returns basenames from pathed entries', () => {
        const { diffuse } = classifyPackageTextures(['sub/dir/albedo.png']);
        expect(diffuse).toBe('albedo.png');
    });
});

describe('Cook: CookObjPackage.buildMinimalMtl', () => {
    test('emits a material with diffuse and normal maps', () => {
        const mtl = buildMinimalMtl('material_0', 'd.jpg', 'n.jpg');
        expect(mtl).toMatch(/^newmtl material_0$/m);
        expect(mtl).toMatch(/^map_Kd d\.jpg$/m);
        expect(mtl).toMatch(/^map_Bump n\.jpg$/m);
    });

    test('omits map lines when a texture is absent', () => {
        const mtl = buildMinimalMtl('material_0', 'd.jpg', undefined);
        expect(mtl).toMatch(/^map_Kd d\.jpg$/m);
        expect(mtl).not.toMatch(/map_Bump/);
    });

    test('still defines a valid material when both textures are absent', () => {
        const mtl = buildMinimalMtl('material_0');
        expect(mtl).toMatch(/^newmtl material_0$/m);
        expect(mtl).not.toMatch(/map_Kd/);
        expect(mtl).not.toMatch(/map_Bump/);
    });
});
