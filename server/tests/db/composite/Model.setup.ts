import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as STORE from '../../../storage/interface';
import * as H from '../../../utils/helpers';
import * as UTIL from '../api';
import * as LOG from '../../../utils/logger';
import * as path from 'path';

class ModelTestFile {
    testCase: string;
    fileName: string;
    directory: string;
    geometry: boolean; // true -> geometry file; false -> support file, such as a texture map
    hash: string;

    constructor(testCase: string, fileName: string, directory: string, geometry: boolean, hash: string) {
        this.testCase = testCase;
        this.fileName = fileName;
        this.directory = directory;
        this.geometry = geometry;
        this.hash = hash;
    }
}

class ModelTestCase {
    testCase: string;
    model: DBAPI.Model;
    modelName: string;
    assetVersionIDs: number[];
    inspectJSON: string;

    constructor(testCase: string, model: DBAPI.Model, modelName: string, assetVersionID: number, inspectJSON: string) {
        this.testCase = testCase;
        this.model = model;
        this.modelName = modelName;
        this.assetVersionIDs = [assetVersionID];
        this.inspectJSON = inspectJSON;
    }
}

const modelTestFiles: ModelTestFile[] = [
    { testCase: 'fbx-stand-alone', fileName: 'eremotherium_laurillardi-150k-4096.fbx', directory: '', geometry: true, hash: 'd81595f6e42c9162ddc32c4f358affeda6f1eb14cb7838cf5477536401b764d7' },
    { testCase: 'fbx-with-support', fileName: 'eremotherium_laurillardi-150k-4096.fbx', directory: 'eremotherium_laurillardi-150k-4096-fbx', geometry: true, hash: 'cfcd541913a122a8d8b415c9b5bd45818d7f483b9e683e6c2e0c557de876e694' },
    { testCase: 'fbx-with-support', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-fbx', geometry: false, hash: '53a46d32ecc668cb07a2b7f9f8e197c14819db3354b021b551cbdd06f3b81488' },
    { testCase: 'glb', fileName: 'eremotherium_laurillardi-150k-4096.glb', directory: '', geometry: true, hash: '08ddb4b90bace6ae9ef5c0b620f0e3f821c76cad89151d3c992dcd531ba4f498' },
    { testCase: 'obj', fileName: 'eremotherium_laurillardi-150k-4096.obj', directory: 'eremotherium_laurillardi-150k-4096-obj', geometry: true, hash: '7da41672c635249a622dcc4e96a8e01747de55b091586dc49a10b465e36ec12b' },
    { testCase: 'obj', fileName: 'eremotherium_laurillardi-150k-4096.mtl', directory: 'eremotherium_laurillardi-150k-4096-obj', geometry: false, hash: 'a1f7b4c19ee36d68ec3746f4ac9696738076c249f8426fafd87a5a45f3fd8f32' },
    { testCase: 'obj', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-obj', geometry: false, hash: '53a46d32ecc668cb07a2b7f9f8e197c14819db3354b021b551cbdd06f3b81488' },
    { testCase: 'ply', fileName: 'eremotherium_laurillardi-150k.ply', directory: '', geometry: true, hash: 'd4825a2586cadb7ccbc40e8562dfb240d8b58669db1e06f4138d427ac6c14c15' },
    { testCase: 'stl', fileName: 'eremotherium_laurillardi-150k.stl', directory: '', geometry: true, hash: '3984d9039384ba9881635a8c7503c75ffb333c2b27270f9beb87dfd0a26aa762' },
    { testCase: 'usd', fileName: 'eremotherium_laurillardi-150k-4096-5.usdc', directory: 'eremotherium_laurillardi-150k-4096-usd', geometry: true, hash: 'd73a56f429da81d9ed3338e4edb468ba346be138e93697a4d886dbf63533bc7f' },
    { testCase: 'usd', fileName: 'baseColor-1.jpg', directory: 'eremotherium_laurillardi-150k-4096-usd/0', geometry: false, hash: '53a46d32ecc668cb07a2b7f9f8e197c14819db3354b021b551cbdd06f3b81488' },
    { testCase: 'usdz', fileName: 'eremotherium_laurillardi-150k-4096.usdz', directory: '', geometry: true, hash: 'ca689b07dc534f6e9f3dab7693bcdf894d65fca17f1fb6be34009ada3b6c5b8c' },
    { testCase: 'wrl', fileName: 'eremotherium_laurillardi-150k-4096.x3d.wrl', directory: 'eremotherium_laurillardi-150k-4096-wrl', geometry: true, hash: '06192884a751101c02680babf6b676797867150c89a712ebaf83408f9769433b' },
    { testCase: 'wrl', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-wrl', geometry: false, hash: '53a46d32ecc668cb07a2b7f9f8e197c14819db3354b021b551cbdd06f3b81488' },
    { testCase: 'x3d', fileName: 'eremotherium_laurillardi-150k-4096.x3d', directory: 'eremotherium_laurillardi-150k-4096-x3d', geometry: true, hash: '3d87c1d33849bed8a048f5235368ba7e36e3b21b27303bb959842de9c665b673' },
    { testCase: 'x3d', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-x3d', geometry: false, hash: '53a46d32ecc668cb07a2b7f9f8e197c14819db3354b021b551cbdd06f3b81488' },
];

const modelTestCaseInspectJSONMap: Map<string, string> = new Map<string, string>([
    ['fbx-stand-alone',     '{"success":true,"error":"","modelObjects":[{"idModelObject":1,"idModel":0,"idModelMetrics":1,"idModelMetricsOrig":1}],"ModelMetrics":[{"idModelMetrics":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-2167.86767578125,"BoundingBoxP1Z":-971.3925170898438,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":2167.867919921875,"BoundingBoxP2Z":971.3912963867188,"CountPoint":104561,"CountFace":149999,"CountColorChannel":0,"CountTextureCoorinateChannel":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true}],"modelMaterials":[{"idModelMaterial":1,"idModelObject":1,"Name":"material_0"}],"modelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":64,"idModelMaterialUVMapOrig":1},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":65,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0.2,"Scalar2":0.2,"Scalar3":0.2,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":65,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":66,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0.2,"Scalar2":0.2,"Scalar3":0.2,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":66,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":4,"idModelMaterial":1,"idVMaterialType":67,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":67,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":5,"idModelMaterial":1,"idVMaterialType":70,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":20,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":70,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":6,"idModelMaterial":1,"idVMaterialType":71,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":"{ color: \\"0, 0, 0\\", }","idVMaterialTypeOrig":71,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":7,"idModelMaterial":1,"idVMaterialType":74,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":74,"idModelMaterialUVMapOrig":null}],"uvMaps":[[1,"../../Users/blundellj/Downloads/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg"]]}'], // eslint-disable-line no-useless-escape
    ['fbx-with-support',    '{"success":true,"error":"","modelObjects":[{"idModelObject":1,"idModel":0,"idModelMetrics":1,"idModelMetricsOrig":1}],"ModelMetrics":[{"idModelMetrics":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-2167.86767578125,"BoundingBoxP1Z":-971.3925170898438,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":2167.867919921875,"BoundingBoxP2Z":971.3912963867188,"CountPoint":74796,"CountFace":149999,"CountColorChannel":0,"CountTextureCoorinateChannel":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true}],"modelMaterials":[{"idModelMaterial":1,"idModelObject":1,"Name":"material_0"}],"modelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":0.8,"Scalar2":0.8,"Scalar3":0.8,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":64,"idModelMaterialUVMapOrig":1},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":65,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0.8,"Scalar2":0.8,"Scalar3":0.8,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":65,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":66,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":66,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":4,"idModelMaterial":1,"idVMaterialType":67,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":67,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":5,"idModelMaterial":1,"idVMaterialType":70,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":70,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":6,"idModelMaterial":1,"idVMaterialType":71,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":"{ color: \\"0, 0, 0\\", }","idVMaterialTypeOrig":71,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":7,"idModelMaterial":1,"idVMaterialType":74,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":74,"idModelMaterialUVMapOrig":null}],"uvMaps":[[1,"/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg"]]}'], // eslint-disable-line no-useless-escape
    ['glb',                 '{"success":true,"error":"","modelObjects":[{"idModelObject":1,"idModel":0,"idModelMetrics":1,"idModelMetricsOrig":1}],"ModelMetrics":[{"idModelMetrics":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-2167.86767578125,"BoundingBoxP1Z":-971.3924560546875,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":2167.867919921875,"BoundingBoxP2Z":971.3912353515625,"CountPoint":104561,"CountFace":149999,"CountColorChannel":0,"CountTextureCoorinateChannel":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true}],"modelMaterials":[{"idModelMaterial":1,"idModelObject":1,"Name":"material_0"}],"modelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null,"idVMaterialTypeOrig":64,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":67,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":67,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":76,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":76,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":4,"idModelMaterial":1,"idVMaterialType":75,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":75,"idModelMaterialUVMapOrig":null}],"uvMaps":[]}'], // eslint-disable-line no-useless-escape
    ['obj',                 '{"success":true,"error":"","modelObjects":[{"idModelObject":1,"idModel":0,"idModelMetrics":1,"idModelMetricsOrig":1}],"ModelMetrics":[{"idModelMetrics":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-971.3923950195312,"BoundingBoxP1Z":-2167.867919921875,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":971.3911743164062,"BoundingBoxP2Z":2167.86767578125,"CountPoint":74796,"CountFace":149999,"CountColorChannel":0,"CountTextureCoorinateChannel":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true}],"modelMaterials":[{"idModelMaterial":1,"idModelObject":1,"Name":"material_0"}],"modelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":0.6,"Scalar2":0.6,"Scalar3":0.6,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":64,"idModelMaterialUVMapOrig":1},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":65,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":65,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":66,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":66,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":4,"idModelMaterial":1,"idVMaterialType":67,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":0,"Scalar3":0,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":67,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":5,"idModelMaterial":1,"idVMaterialType":70,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":0,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":70,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":6,"idModelMaterial":1,"idVMaterialType":71,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":"{ color: \\"1, 1, 1\\", }","idVMaterialTypeOrig":71,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":7,"idModelMaterial":1,"idVMaterialType":74,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":"{ ior: 1, }","idVMaterialTypeOrig":74,"idModelMaterialUVMapOrig":null}],"uvMaps":[[1,"eremotherium_laurillardi-150k-4096-diffuse.jpg"]]}'], // eslint-disable-line no-useless-escape
    ['ply',                 '{"success":true,"error":"","modelObjects":[{"idModelObject":1,"idModel":0,"idModelMetrics":1,"idModelMetricsOrig":1}],"ModelMetrics":[{"idModelMetrics":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-971.3921508789062,"BoundingBoxP1Z":-2167.86767578125,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":971.3909301757812,"BoundingBoxP2Z":2167.867431640625,"CountPoint":74796,"CountFace":149999,"CountColorChannel":1,"CountTextureCoorinateChannel":0,"HasBones":false,"HasFaceNormals":false,"HasTangents":null,"HasTextureCoordinates":false,"HasVertexNormals":null,"HasVertexColor":true,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true}],"modelMaterials":[{"idModelMaterial":1,"idModelObject":1,"Name":""}],"modelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null,"idVMaterialTypeOrig":64,"idModelMaterialUVMapOrig":1},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":65,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null,"idVMaterialTypeOrig":65,"idModelMaterialUVMapOrig":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":66,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":false,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null,"idVMaterialTypeOrig":66,"idModelMaterialUVMapOrig":null}],"uvMaps":[[1,"eremotherium_laurillardi-150k-4096-diffuse.jpg"]]}'], // eslint-disable-line no-useless-escape
    ['stl',                 '{"success":true,"error":"","modelObjects":[{"idModelObject":1,"idModel":0,"idModelMetrics":1,"idModelMetricsOrig":1}],"ModelMetrics":[{"idModelMetrics":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-971.3921508789062,"BoundingBoxP1Z":-2167.86767578125,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":971.3909301757812,"BoundingBoxP2Z":2167.867431640625,"CountPoint":74796,"CountFace":149999,"CountColorChannel":0,"CountTextureCoorinateChannel":0,"HasBones":false,"HasFaceNormals":false,"HasTangents":null,"HasTextureCoordinates":false,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true}],"modelMaterials":null,"modelMaterialChannels":null,"uvMaps":[]}'], // eslint-disable-line no-useless-escape
    ['x3d',                 '{"success":true,"error":"","modelObjects":[],"ModelMetrics":[],"modelMaterials":[{"idModelMaterial":1,"idModelObject":0,"Name":""}],"modelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"idVMaterialTypeOrig":64,"idModelMaterialUVMapOrig":1}],"uvMaps":[[1,"eremotherium_laurillardi-150k-4096-diffuse.jpg"]]}'], // eslint-disable-line no-useless-escape
]);

export class ModelTestSetup {
    /* #region Variable Declarations */
    modelFbx1:          DBAPI.Model | null = null;
    modelFbx2:          DBAPI.Model | null = null;
    modelGlb:           DBAPI.Model | null = null;
    modelObj:           DBAPI.Model | null = null;
    modelPly:           DBAPI.Model | null = null;
    modelStl:           DBAPI.Model | null = null;
    modelUsd:           DBAPI.Model | null = null;
    modelUsdz:          DBAPI.Model | null = null;
    modelWrl:           DBAPI.Model | null = null;
    modelX3d:           DBAPI.Model | null = null;

    assetFbxA:          DBAPI.Asset | null = null;
    assetFbxB1:         DBAPI.Asset | null = null;
    assetFbxB2:         DBAPI.Asset | null = null;
    assetGlb:           DBAPI.Asset | null = null;
    assetObj1:          DBAPI.Asset | null = null;
    assetObj2:          DBAPI.Asset | null = null;
    assetObj3:          DBAPI.Asset | null = null;
    assetPly:           DBAPI.Asset | null = null;
    assetStl:           DBAPI.Asset | null = null;
    assetUsd1:          DBAPI.Asset | null = null;
    assetUsd2:          DBAPI.Asset | null = null;
    assetUsdz:          DBAPI.Asset | null = null;
    assetWrl1:          DBAPI.Asset | null = null;
    assetWrl2:          DBAPI.Asset | null = null;
    assetX3d1:          DBAPI.Asset | null = null;
    assetX3d2:          DBAPI.Asset | null = null;

    assetVersionFbxA:   DBAPI.AssetVersion | null = null;
    assetVersionFbxB1:  DBAPI.AssetVersion | null = null;
    assetVersionFbxB2:  DBAPI.AssetVersion | null = null;
    assetVersionGlb:    DBAPI.AssetVersion | null = null;
    assetVersionObj1:   DBAPI.AssetVersion | null = null;
    assetVersionObj2:   DBAPI.AssetVersion | null = null;
    assetVersionObj3:   DBAPI.AssetVersion | null = null;
    assetVersionPly:    DBAPI.AssetVersion | null = null;
    assetVersionStl:    DBAPI.AssetVersion | null = null;
    assetVersionUsd1:   DBAPI.AssetVersion | null = null;
    assetVersionUsd2:   DBAPI.AssetVersion | null = null;
    assetVersionUsdz:   DBAPI.AssetVersion | null = null;
    assetVersionWrl1:   DBAPI.AssetVersion | null = null;
    assetVersionWrl2:   DBAPI.AssetVersion | null = null;
    assetVersionX3d1:   DBAPI.AssetVersion | null = null;
    assetVersionX3d2:   DBAPI.AssetVersion | null = null;

    userOwner:          DBAPI.User | null = null;
    vocabModel:         DBAPI.Vocabulary | undefined = undefined;
    vocabMCreation:     DBAPI.Vocabulary | undefined = undefined;
    vocabMModality:     DBAPI.Vocabulary | undefined = undefined;
    vocabMUnits:        DBAPI.Vocabulary | undefined = undefined;
    vocabMPurpose:      DBAPI.Vocabulary | undefined = undefined;

    storage:            STORE.IStorage | null = null;
    /* #endregion */
    testCaseMap: Map<string, ModelTestCase> = new Map<string, ModelTestCase>(); // map of testcase name to ModelTestCase structure

    //** Returns null if initialize cannot locate test files.  Do not treat this as an error */
    async initialize(testCase: string | null = null): Promise<boolean | null> {
        // let assigned: boolean = true;
        this.userOwner = await UTIL.createUserTest({ Name: 'Model Test', EmailAddress: 'modeltest@si.edu', SecurityID: 'Model Test', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });
        if (!this.userOwner) {
            LOG.logger.error('ModelTestSetup failed to create user');
            return false;
        }

        this.vocabModel = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eAssetAssetTypeModel);
        this.vocabMCreation = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelCreationMethodCAD);
        this.vocabMModality = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelModalityMesh);
        this.vocabMUnits = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelUnitsMillimeter);
        this.vocabMPurpose = await CACHE.VocabularyCache.vocabularyByEnum(CACHE.eVocabularyID.eModelPurposeMaster);
        if (!this.vocabModel || !this.vocabMCreation || !this.vocabMModality || !this.vocabMUnits || !this.vocabMPurpose) {
            LOG.logger.error('ModelTestSetup failed to fetch Model-related Vocabulary');
            return false;
        }

        this.storage = await STORE.StorageFactory.getInstance();
        if (!this.storage) {
            LOG.logger.error('ModelTestSetup failed to retrieve storage interface');
            return false;
        }

        for (const MTD of modelTestFiles) {
            if (testCase && MTD.testCase != testCase)
                continue;
            const fileExists: boolean = await this.testFileExistence(MTD);
            if (!fileExists) {
                LOG.logger.info(`ModelTestSetup unable to locate file for ${JSON.stringify(MTD)}`);
                return null;
            }

            let model: DBAPI.Model | null | undefined = undefined;

            if (MTD.geometry) {
                const vocabMFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(MTD.fileName);
                if (!vocabMFileType) {
                    LOG.logger.error('ModelTestSetup failed to fetch Model file type Vocabulary');
                    return false;
                }

                model = await UTIL.createModelTest({
                    Name: MTD.fileName,
                    DateCreated: UTIL.nowCleansed(),
                    idVCreationMethod: this.vocabMCreation.idVocabulary,
                    Master: true, Authoritative: true,
                    idVModality: this.vocabMModality.idVocabulary,
                    idVUnits: this.vocabMUnits.idVocabulary,
                    idVPurpose: this.vocabMPurpose.idVocabulary,
                    idVFileType: vocabMFileType.idVocabulary,
                    idAssetThumbnail: null,
                    CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0,
                    CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY',
                    idModel: 0
                });
            } else {
                const MTC: ModelTestCase | undefined = this.testCaseMap.get(MTD.testCase);
                if (!MTC) {
                    LOG.logger.error(`ModelTestSetup attempting to ingest non-model ${MTD.fileName} without model already created`);
                    return false;
                }
                model = MTC.model;
            }

            const { success, asset, assetVersion } = await this.ingestFile(MTD, model);
            if (!success) {
                LOG.logger.error('ModelTestSetup failed to ingest model');
                return false;
            }

            // record test case data
            if (assetVersion) {
                let MTC: ModelTestCase | undefined = this.testCaseMap.get(MTD.testCase);
                if (!MTC) {
                    const inspectJSON: string | undefined = modelTestCaseInspectJSONMap.get(MTD.testCase) || '';
                    MTC = new ModelTestCase(MTD.testCase, model, MTD.fileName, assetVersion.idAssetVersion, inspectJSON);
                    this.testCaseMap.set(MTD.testCase, MTC);
                } else {
                    MTC.assetVersionIDs.push(assetVersion.idAssetVersion);
                }
            }

            switch (MTD.testCase) {
                case 'fbx-stand-alone':
                    this.modelFbx1 = model;
                    this.assetFbxA = asset;
                    this.assetVersionFbxA = assetVersion;
                    break;
                case 'fbx-with-support':
                    if (MTD.geometry) {
                        this.modelFbx2 = model;
                        this.assetFbxB1 = asset;
                        this.assetVersionFbxB1 = assetVersion;
                    } else {
                        this.assetFbxB2 = asset;
                        this.assetVersionFbxB2 = assetVersion;
                    }
                    break;
                case 'glb':
                    this.modelGlb = model;
                    this.assetGlb = asset;
                    this.assetVersionGlb = assetVersion;
                    break;
                case 'obj':
                    if (MTD.geometry) {
                        this.modelObj = model;
                        this.assetObj1 = asset;
                        this.assetVersionObj1 = assetVersion;
                    } else if (!this.assetObj2) {
                        this.assetObj2 = asset;
                        this.assetVersionObj2 = assetVersion;
                    } else {
                        this.assetObj3 = asset;
                        this.assetVersionObj3 = assetVersion;
                    }
                    break;
                case 'ply':
                    this.modelPly = model;
                    this.assetPly = asset;
                    this.assetVersionPly = assetVersion;
                    break;
                case 'stl':
                    this.modelStl = model;
                    this.assetStl = asset;
                    this.assetVersionStl = assetVersion;
                    break;
                case 'usd':
                    if (MTD.geometry) {
                        this.modelUsd = model;
                        this.assetUsd1 = asset;
                        this.assetVersionUsd1 = assetVersion;
                    } else {
                        this.assetUsd2 = asset;
                        this.assetVersionUsd2 = assetVersion;
                    }
                    break;
                case 'usdz':
                    this.modelUsdz = model;
                    this.assetUsdz = asset;
                    this.assetVersionUsdz = assetVersion;
                    break;
                case 'wrl':
                    if (MTD.geometry) {
                        this.modelWrl = model;
                        this.assetWrl1 = asset;
                        this.assetVersionWrl1 = assetVersion;
                    } else {
                        this.assetWrl2 = asset;
                        this.assetVersionWrl2 = assetVersion;
                    }
                    break;
                case 'x3d':
                    if (MTD.geometry) {
                        this.modelX3d = model;
                        this.assetX3d1 = asset;
                        this.assetVersionX3d1 = assetVersion;
                    } else {
                        this.assetX3d2 = asset;
                        this.assetVersionX3d2 = assetVersion;
                    }
                    break;
            }
        }

        return true;
    }

    getTestCase(testCase: string): ModelTestCase | undefined {
        return this.testCaseMap.get(testCase);
    }

    private async ingestFile(MTD: ModelTestFile, model: DBAPI.Model): Promise<{ success: boolean, asset: DBAPI.Asset | null, assetVersion: DBAPI.AssetVersion | null}> {
        if (!this.userOwner || !this.vocabModel || !this.storage)
            return { success: false, asset: null, assetVersion: null };

        const wsRes: STORE.WriteStreamResult = await this.storage.writeStream(MTD.fileName);
        if (!wsRes.success || !wsRes.writeStream || !wsRes.storageKey) {
            LOG.logger.error(`ModelTestSetup.ingestFile Unable to create write stream for ${MTD.fileName}: ${wsRes.error}`);
            return { success: false, asset: null, assetVersion: null };
        }
        const filePath: string = this.computeFilePath(MTD);
        const wrRes: H.IOResults = await H.Helpers.writeFileToStream(filePath, wsRes.writeStream);
        if (!wrRes.success) {
            LOG.logger.error(`ModelTestSetup.ingestFile Unable to write ${filePath} to stream: ${wrRes.error}`);
            return { success: false, asset: null, assetVersion: null };
        }

        const ASCNAI: STORE.AssetStorageCommitNewAssetInput = {
            storageKey: wsRes.storageKey,
            storageHash: null,
            FileName: MTD.fileName,
            FilePath: MTD.directory,
            idAssetGroup: 0,
            idVAssetType: this.vocabModel.idVocabulary,
            idUserCreator: this.userOwner.idUser,
            DateCreated: new Date()
        };

        const comRes: STORE.AssetStorageResultCommit = await STORE.AssetStorageAdapter.commitNewAsset(ASCNAI);
        if (!comRes.success || !comRes.assets || comRes.assets.length != 1 || !comRes.assetVersions || comRes.assetVersions.length != 1) {
            LOG.logger.error(`ModelTestSetup.ingestFile Unable to commit asset: ${comRes.error}`);
            return { success: false, asset: null, assetVersion: null };
        }

        const opInfo: STORE.OperationInfo = { message: 'Ingesting asset', idUser: this.userOwner.idUser,
            userEmailAddress: this.userOwner.EmailAddress, userName: this.userOwner.Name };
        const IAR: STORE.IngestAssetResult = await STORE.AssetStorageAdapter.ingestAsset(comRes.assets[0], comRes.assetVersions[0], model, opInfo);
        return { success: IAR.success, asset: comRes.assets[0] || null, assetVersion: comRes.assetVersions[0] || null };
    }

    private computeFilePath(MTD: ModelTestFile): string {
        return path.join(__dirname, '../../mock/models', MTD.directory, MTD.fileName);
    }

    private async testFileExistence(MTD: ModelTestFile): Promise<boolean> {
        const filePath: string = this.computeFilePath(MTD);
        const res: H.StatResults = await H.Helpers.stat(filePath);
        let success: boolean = res.success && (res.stat !== null) && res.stat.isFile();

        if (MTD.hash) {
            const hashRes: H.HashResults = await H.Helpers.computeHashFromFile(filePath, 'sha256');
            if (!hashRes.success) {
                LOG.logger.error(`ModelTestSetup.testFileExistience('${filePath}') unable to compute hash ${hashRes.error}`);
                success = false;
            } else if (hashRes.hash != MTD.hash) {
                LOG.logger.error(`ModelTestSetup.testFileExistience('${filePath}') computed different hash ${hashRes.hash} than expected ${MTD.hash}`);
                success = false;
            }
        }

        LOG.logger.info(`ModelTestSetup.testFileExistience('${filePath}') = ${success}`);
        return success;
    }
}