import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COMMON from '../../../../client/src/types/server';
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

export class ModelTestCase {
    testCase: string;
    model: DBAPI.Model;
    modelName: string;
    inspectJSON: string;
    assetVersions: DBAPI.AssetVersion[];
    private systemObjectIDs: number[] | null = null;

    constructor(testCase: string, model: DBAPI.Model, modelName: string, assetVersion: DBAPI.AssetVersion, inspectJSON: string) {
        this.testCase = testCase;
        this.model = model;
        this.modelName = modelName;
        this.assetVersions = [assetVersion];
        this.inspectJSON = inspectJSON;
    }

    assetVersionIDs(): number[] {
        const retValue: number[] = [];
        for (const assetVersion of this.assetVersions)
            retValue.push(assetVersion.idAssetVersion);
        return retValue;
    }

    assetFileNameMap(): Map<string, number> {
        const retValue: Map<string, number> = new Map<string, number>();
        for (const assetVersion of this.assetVersions) {
            LOG.info(`ModelTestCase.assetFileNameMap [${assetVersion.FileName}, ${assetVersion.idAssetVersion}]`, LOG.LS.eTEST);
            retValue.set(assetVersion.FileName, assetVersion.idAsset);
        }
        return retValue;
    }

    async computeSystemObjectIDs(): Promise<number[]> {
        if (!this.systemObjectIDs) {
            this.systemObjectIDs = [];
            for (const assetVersion of this.assetVersions) {
                const idAssetVersion = assetVersion.idAssetVersion;
                const SO: DBAPI.SystemObject | null = await DBAPI.SystemObjectAssetVersion.fetchFromAssetVersionID(idAssetVersion);
                if (SO)
                    this.systemObjectIDs.push(SO.idSystemObject);
            }
        }
        return this.systemObjectIDs;
    }
}

// hashes are computed using sha256
const modelTestFiles: ModelTestFile[] = [
    { testCase: 'fbx-stand-alone', fileName: 'eremotherium_laurillardi-150k-4096.fbx', directory: '', geometry: true, hash: 'd81595f6e42c9162ddc32c4f358affeda6f1eb14cb7838cf5477536401b764d7' },
    { testCase: 'fbx-with-support', fileName: 'eremotherium_laurillardi-150k-4096.fbx', directory: 'eremotherium_laurillardi-150k-4096-fbx', geometry: true, hash: 'cfcd541913a122a8d8b415c9b5bd45818d7f483b9e683e6c2e0c557de876e694' },
    { testCase: 'fbx-with-support', fileName: 'eremotherium_laurillardi-150k-4096-diffuse.jpg', directory: 'eremotherium_laurillardi-150k-4096-fbx', geometry: false, hash: '53a46d32ecc668cb07a2b7f9f8e197c14819db3354b021b551cbdd06f3b81488' },
    { testCase: 'glb', fileName: 'eremotherium_laurillardi-150k-4096.glb', directory: '', geometry: true, hash: '08ddb4b90bace6ae9ef5c0b620f0e3f821c76cad89151d3c992dcd531ba4f498' },
    { testCase: 'glb-draco', fileName: 'eremotherium_laurillardi-Part-100k-512.glb', directory: '', geometry: true, hash: '9f9016cde5dba8ca138ba083ce616caf1f9bf424429fcd9d9af7bd112b61be8a' },
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
    { testCase: 'dae', fileName: 'clemente_helmet.dae', directory: 'clemente_helmet-dae', geometry: true, hash: '114f1b090b548109cdeeaac8f570b2fee140229758826783079f84504409bb65' },
    { testCase: 'dae', fileName: 'Image_0.jpg', directory: 'clemente_helmet-dae', geometry: false, hash: '42646b00fc588ce37e9819e0f3611b4cdf9b38a34e924361f96ef198909f0d00' },
    { testCase: 'gltf-stand-alone', fileName: 'clemente_helmet.gltf', directory: '', geometry: true, hash: 'af6a4707aaf9463c7511eeba9a00b7e2a62e5703bc08e585b00da7daeba44fb4' },
    { testCase: 'gltf-with-support', fileName: 'nmah-1981_0706_06-clemente_helmet-150k-4096.gltf', directory: 'nmah-1981_0706_06-clemente_helmet-150k-4096-gltf', geometry: true, hash: '07fd7e438cba575e41cb408e18f92255ee1789923930ce5e78c6d1f68e39528f' },
    { testCase: 'gltf-with-support', fileName: 'nmah-1981_0706_06-clemente_helmet-150k-4096-diffuse.jpg', directory: 'nmah-1981_0706_06-clemente_helmet-150k-4096-gltf', geometry: false, hash: '53858da74ae61e45039bff29752ea3ad9005f36c554d3520f8d40677635d94bd' },
    { testCase: 'gltf-with-support', fileName: 'nmah-1981_0706_06-clemente_helmet-150k-4096-normals.jpg', directory: 'nmah-1981_0706_06-clemente_helmet-150k-4096-gltf', geometry: false, hash: 'f2af32ccabf37328bc452926bc07abe824baa9c53b5be5d769b497e757b0f844' },
    { testCase: 'gltf-with-support', fileName: 'nmah-1981_0706_06-clemente_helmet-150k-4096-occlusion.jpg', directory: 'nmah-1981_0706_06-clemente_helmet-150k-4096-gltf', geometry: false, hash: '2d68c5832d2ca5bab941d6d08ad676577e56f47459c7470a3c975ce8ff23c51c' },
    { testCase: 'gltf-with-support', fileName: 'nmah-1981_0706_06-clemente_helmet-150k-4096.bin', directory: 'nmah-1981_0706_06-clemente_helmet-150k-4096-gltf', geometry: false, hash: '7aa6ad1a0c11a16adec395261d900e58eb50db238f2ce3a602f1033c0b24b4b2' },
];

// Note, when extracted from logging the expected JSON below needs to have escaping added
// to the color elements below ... replace color: \"0, 0, 0\" with color: \\"0, 0, 0\\"
const modelTestCaseInspectJSONMap: Map<string, string> = new Map<string, string>([
    ['fbx-stand-alone',     '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k-4096.fbx","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":59,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":104561,"CountEmbeddedTextures":1,"CountLinkedTextures":1,"FileEncoding":"BINARY","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-2167.86767578125,"BoundingBoxP1Z":-971.3925170898438,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":2167.867919921875,"BoundingBoxP2Z":971.3912963867188,"CountVertices":104561,"CountFaces":149999,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":[{"idModelMaterial":1,"Name":"material_0"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":null,"AdditionalAttributes":null,"Source":"../../Users/blundellj/Downloads/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1}],"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096.fbx","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096.fbx","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096.fbx","AssetType":"Model"},{"Asset":{"FileName":"../../Users/blundellj/Downloads/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"../../Users/blundellj/Downloads/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"../../Users/blundellj/Downloads/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg","AssetType":"Texture Map diffuse"}]}}'],
    ['fbx-with-support',    '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k-4096.fbx","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":59,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":74796,"CountEmbeddedTextures":0,"CountLinkedTextures":1,"FileEncoding":"BINARY","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-2167.86767578125,"BoundingBoxP1Z":-971.3925170898438,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":2167.867919921875,"BoundingBoxP2Z":971.3912963867188,"CountVertices":74796,"CountFaces":149999,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":[{"idModelMaterial":1,"Name":"material_0"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":0.8,"Scalar2":0.8,"Scalar3":0.8,"Scalar4":null,"AdditionalAttributes":null,"Source":"/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1}],"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096.fbx","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096.fbx","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096.fbx","AssetType":"Model"},{"Asset":{"FileName":"/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"/Users/blundellj/OneDrive - Smithsonian Institution/Packrat demo files/model validation demo files/eremotherium_laurillardi-150k-4096-obj/eremotherium_laurillardi-150k-4096-diffuse.jpg","AssetType":"Texture Map diffuse"}]}}'],
    ['glb',                 '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k-4096.glb","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":52,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":104561,"CountEmbeddedTextures":1,"CountLinkedTextures":0,"FileEncoding":"BINARY","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-2167.867431640625,"BoundingBoxP1Z":-971.3921508789062,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":2167.86767578125,"BoundingBoxP2Z":971.3909301757812,"CountVertices":104561,"CountFaces":149999,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":[{"idModelMaterial":1,"Name":"material_0"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null}],"ModelMaterialUVMaps":null,"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096.glb","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096.glb","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096.glb","AssetType":"Model"}]}}'],
    ['glb-draco',           '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-Part-100k-512.glb","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":52,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":99766,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":64464,"CountEmbeddedTextures":3,"CountLinkedTextures":0,"FileEncoding":"BINARY","IsDracoCompressed":true,"AutomationTag":null,"CountTriangles":99766,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-68.70997619628906,"BoundingBoxP1Y":-167.00453186035156,"BoundingBoxP1Z":-61.58316421508789,"BoundingBoxP2X":56.08637237548828,"BoundingBoxP2Y":14.136469841003418,"BoundingBoxP2Z":117.65611267089844,"CountVertices":64464,"CountFaces":99766,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":99766}],"ModelMaterials":[{"idModelMaterial":1,"Name":"default"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":69,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":73,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null}],"ModelMaterialUVMaps":null,"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-Part-100k-512.glb","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-Part-100k-512.glb","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-Part-100k-512.glb","AssetType":"Model"}]}}'],
    ['obj',                 '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k-4096.obj","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":49,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":74796,"CountEmbeddedTextures":0,"CountLinkedTextures":1,"FileEncoding":"ASCII","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-971.3923950195312,"BoundingBoxP1Z":-2167.867919921875,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":971.3911743164062,"BoundingBoxP2Z":2167.86767578125,"CountVertices":74796,"CountFaces":149999,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":[{"idModelMaterial":1,"Name":"material_0"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":0.6,"Scalar2":0.6,"Scalar3":0.6,"Scalar4":null,"AdditionalAttributes":null,"Source":"eremotherium_laurillardi-150k-4096-diffuse.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1}],"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096.obj","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096.obj","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096.obj","AssetType":"Model"},{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","AssetType":"Texture Map diffuse"}]}}'],
    ['ply',                 '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k.ply","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":50,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":74796,"CountEmbeddedTextures":0,"CountLinkedTextures":1,"FileEncoding":"BINARY","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-971.3921508789062,"BoundingBoxP1Z":-2167.86767578125,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":971.3909301757812,"BoundingBoxP2Z":2167.867431640625,"CountVertices":74796,"CountFaces":149999,"CountColorChannels":1,"CountTextureCoordinateChannels":0,"HasBones":false,"HasFaceNormals":false,"HasTangents":null,"HasTextureCoordinates":false,"HasVertexNormals":null,"HasVertexColor":true,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":[{"idModelMaterial":1,"Name":""}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null,"Source":"eremotherium_laurillardi-150k-4096-diffuse.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1}],"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k.ply","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k.ply","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k.ply","AssetType":"Model"},{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","AssetType":"Texture Map diffuse"}]}}'],
    ['stl',                 '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k.stl","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":51,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":0,"CountMeshes":1,"CountVertices":74796,"CountEmbeddedTextures":0,"CountLinkedTextures":0,"FileEncoding":"BINARY","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2620849609375,"BoundingBoxP1Y":-971.3921508789062,"BoundingBoxP1Z":-2167.86767578125,"BoundingBoxP2X":892.2653198242188,"BoundingBoxP2Y":971.3909301757812,"BoundingBoxP2Z":2167.867431640625,"CountVertices":74796,"CountFaces":149999,"CountColorChannels":0,"CountTextureCoordinateChannels":0,"HasBones":false,"HasFaceNormals":false,"HasTangents":null,"HasTextureCoordinates":false,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":null,"ModelMaterialChannels":null,"ModelMaterialUVMaps":null,"ModelObjectModelMaterialXref":null,"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k.stl","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k.stl","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k.stl","AssetType":"Model"}]}}'],
    ['x3d',                 '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"eremotherium_laurillardi-150k-4096.x3d","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":56,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":149999,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":74796,"CountEmbeddedTextures":0,"CountLinkedTextures":1,"FileEncoding":"ASCII","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":149999,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-892.2651977539062,"BoundingBoxP1Y":-2167.870361328125,"BoundingBoxP1Z":-971.3923950195312,"BoundingBoxP2X":892.26220703125,"BoundingBoxP2Y":2167.870361328125,"BoundingBoxP2Z":971.391357421875,"CountVertices":74796,"CountFaces":149999,"CountColorChannels":1,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":false,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":true,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":false,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":149999}],"ModelMaterials":[{"idModelMaterial":1,"Name":""}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"Source":"eremotherium_laurillardi-150k-4096-diffuse.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1}],"ModelObjectModelMaterialXref":null,"ModelAssets":[{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096.x3d","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096.x3d","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096.x3d","AssetType":"Model"},{"Asset":{"FileName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"eremotherium_laurillardi-150k-4096-diffuse.jpg","AssetType":"Texture Map diffuse"}]}}'],
    ['dae',                 '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"clemente_helmet.dae","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":58,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":148260,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":80417,"CountEmbeddedTextures":0,"CountLinkedTextures":1,"FileEncoding":"ASCII","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":148260,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-0.09380000084638596,"BoundingBoxP1Y":-0.13996900618076324,"BoundingBoxP1Z":-0.06898897141218185,"BoundingBoxP2X":0.09380996227264404,"BoundingBoxP2Y":0.139957994222641,"BoundingBoxP2Z":0.0689619705080986,"CountVertices":80417,"CountFaces":148260,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":false,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":148260}],"ModelMaterials":[{"idModelMaterial":1,"Name":"default"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":null,"AdditionalAttributes":null,"Source":"Image_0.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1}],"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"clemente_helmet.dae","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"clemente_helmet.dae","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"clemente_helmet.dae","AssetType":"Model"},{"Asset":{"FileName":"Image_0.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"Image_0.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"Image_0.jpg","AssetType":"Texture Map diffuse"}]}}'],
    ['gltf-stand-alone',    '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"clemente_helmet.gltf","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":53,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":148260,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":80417,"CountEmbeddedTextures":3,"CountLinkedTextures":0,"FileEncoding":"ASCII","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":148260,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-0.09380000084638596,"BoundingBoxP1Y":-0.13996900618076324,"BoundingBoxP1Z":-0.06898900121450424,"BoundingBoxP2X":0.09380999952554703,"BoundingBoxP2Y":0.139957994222641,"BoundingBoxP2Z":0.06896200031042099,"CountVertices":80417,"CountFaces":148260,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":148260}],"ModelMaterials":[{"idModelMaterial":1,"Name":"default"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":69,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":73,"MaterialTypeOther":null,"idModelMaterialUVMap":null,"UVMapEmbedded":true,"ChannelPosition":null,"ChannelWidth":null,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null}],"ModelMaterialUVMaps":null,"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"clemente_helmet.gltf","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"clemente_helmet.gltf","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"clemente_helmet.gltf","AssetType":"Model"}]}}'],
    ['gltf-with-support',   '{"success":true,"error":"","modelConstellation":{"Model":{"Name":"nmah-1981_0706_06-clemente_helmet-150k-4096.gltf","DateCreated":"2021-04-01T00:00:00.000Z","idVCreationMethod":0,"idVModality":0,"idVUnits":0,"idVPurpose":0,"idVFileType":53,"idAssetThumbnail":null,"CountAnimations":0,"CountCameras":0,"CountFaces":148260,"CountLights":0,"CountMaterials":1,"CountMeshes":1,"CountVertices":80417,"CountEmbeddedTextures":0,"CountLinkedTextures":3,"FileEncoding":"ASCII","IsDracoCompressed":false,"AutomationTag":null,"CountTriangles":148260,"idModel":1},"ModelObjects":[{"idModelObject":1,"idModel":1,"BoundingBoxP1X":-0.09380000084638596,"BoundingBoxP1Y":-0.13996900618076324,"BoundingBoxP1Z":-0.06898900121450424,"BoundingBoxP2X":0.09380999952554703,"BoundingBoxP2Y":0.139957994222641,"BoundingBoxP2Z":0.06896200031042099,"CountVertices":80417,"CountFaces":148260,"CountColorChannels":0,"CountTextureCoordinateChannels":1,"HasBones":false,"HasFaceNormals":true,"HasTangents":null,"HasTextureCoordinates":true,"HasVertexNormals":null,"HasVertexColor":false,"IsTwoManifoldUnbounded":false,"IsTwoManifoldBounded":true,"IsWatertight":false,"SelfIntersecting":true,"CountTriangles":148260}],"ModelMaterials":[{"idModelMaterial":1,"Name":"default"}],"ModelMaterialChannels":[{"idModelMaterialChannel":1,"idModelMaterial":1,"idVMaterialType":64,"MaterialTypeOther":null,"idModelMaterialUVMap":1,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":1,"Scalar2":1,"Scalar3":1,"Scalar4":1,"AdditionalAttributes":null,"Source":"nmah-1981_0706_06-clemente_helmet-150k-4096-diffuse.jpg"},{"idModelMaterialChannel":2,"idModelMaterial":1,"idVMaterialType":69,"MaterialTypeOther":null,"idModelMaterialUVMap":2,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"Source":"nmah-1981_0706_06-clemente_helmet-150k-4096-normals.jpg"},{"idModelMaterialChannel":3,"idModelMaterial":1,"idVMaterialType":73,"MaterialTypeOther":null,"idModelMaterialUVMap":3,"UVMapEmbedded":false,"ChannelPosition":0,"ChannelWidth":3,"Scalar1":null,"Scalar2":null,"Scalar3":null,"Scalar4":null,"AdditionalAttributes":null,"Source":"nmah-1981_0706_06-clemente_helmet-150k-4096-occlusion.jpg"}],"ModelMaterialUVMaps":[{"idModel":1,"idAsset":2,"UVMapEdgeLength":0,"idModelMaterialUVMap":1},{"idModel":1,"idAsset":3,"UVMapEdgeLength":0,"idModelMaterialUVMap":2},{"idModel":1,"idAsset":4,"UVMapEdgeLength":0,"idModelMaterialUVMap":3}],"ModelObjectModelMaterialXref":[{"idModelObjectModelMaterialXref":1,"idModelObject":1,"idModelMaterial":1}],"ModelAssets":[{"Asset":{"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096.gltf","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":1},"AssetVersion":{"idAsset":1,"Version":0,"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096.gltf","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":1,"IngestedOrig":null},"AssetName":"nmah-1981_0706_06-clemente_helmet-150k-4096.gltf","AssetType":"Model"},{"Asset":{"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096-diffuse.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":2},"AssetVersion":{"idAsset":2,"Version":0,"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096-diffuse.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":2,"IngestedOrig":null},"AssetName":"nmah-1981_0706_06-clemente_helmet-150k-4096-diffuse.jpg","AssetType":"Texture Map diffuse"},{"Asset":{"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096-normals.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":3},"AssetVersion":{"idAsset":3,"Version":0,"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096-normals.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":3,"IngestedOrig":null},"AssetName":"nmah-1981_0706_06-clemente_helmet-150k-4096-normals.jpg","AssetType":"Texture Map normal"},{"Asset":{"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096-occlusion.jpg","idAssetGroup":null,"idVAssetType":0,"idSystemObject":null,"StorageKey":null,"idAsset":4},"AssetVersion":{"idAsset":4,"Version":0,"FileName":"nmah-1981_0706_06-clemente_helmet-150k-4096-occlusion.jpg","idUserCreator":0,"DateCreated":"2021-04-01T00:00:00.000Z","StorageHash":"","StorageSize":"0","StorageKeyStaging":"","Ingested":null,"BulkIngest":false,"idSOAttachment":null,"FilePath":"","idAssetVersion":4,"IngestedOrig":null},"AssetName":"nmah-1981_0706_06-clemente_helmet-150k-4096-occlusion.jpg","AssetType":"Texture Map occlusion"}]}}'],
]);

export class ModelTestSetup {
    /* #region Variable Declarations */
    modelFbx1:                  DBAPI.Model | null = null;
    modelFbx2:                  DBAPI.Model | null = null;
    modelGlb:                   DBAPI.Model | null = null;
    modelObj:                   DBAPI.Model | null = null;
    modelPly:                   DBAPI.Model | null = null;
    modelStl:                   DBAPI.Model | null = null;
    modelUsd:                   DBAPI.Model | null = null;
    modelUsdz:                  DBAPI.Model | null = null;
    modelWrl:                   DBAPI.Model | null = null;
    modelX3d:                   DBAPI.Model | null = null;
    modelDae:                   DBAPI.Model | null = null;
    modelGltf1:                 DBAPI.Model | null = null;
    modelGltf2:                 DBAPI.Model | null = null;

    assetFbxA:                  DBAPI.Asset | null | undefined = null;
    assetFbxB1:                 DBAPI.Asset | null | undefined = null;
    assetFbxB2:                 DBAPI.Asset | null | undefined = null;
    assetGlb:                   DBAPI.Asset | null | undefined = null;
    assetObj1:                  DBAPI.Asset | null | undefined = null;
    assetObj2:                  DBAPI.Asset | null | undefined = null;
    assetObj3:                  DBAPI.Asset | null | undefined = null;
    assetPly:                   DBAPI.Asset | null | undefined = null;
    assetStl:                   DBAPI.Asset | null | undefined = null;
    assetUsd1:                  DBAPI.Asset | null | undefined = null;
    assetUsd2:                  DBAPI.Asset | null | undefined = null;
    assetUsdz:                  DBAPI.Asset | null | undefined = null;
    assetWrl1:                  DBAPI.Asset | null | undefined = null;
    assetWrl2:                  DBAPI.Asset | null | undefined = null;
    assetX3d1:                  DBAPI.Asset | null | undefined = null;
    assetX3d2:                  DBAPI.Asset | null | undefined = null;
    assetDae1:                  DBAPI.Asset | null | undefined = null;
    assetDae2:                  DBAPI.Asset | null | undefined = null;
    assetGltfA:                 DBAPI.Asset | null | undefined = null;
    assetGltfB1:                DBAPI.Asset | null | undefined = null;
    assetGltfB2:                DBAPI.Asset | null | undefined = null;
    assetGltfB3:                DBAPI.Asset | null | undefined = null;
    assetGltfB4:                DBAPI.Asset | null | undefined = null;
    assetGltfB5:                DBAPI.Asset | null | undefined = null;

    assetVersionFbxA:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionFbxB1:          DBAPI.AssetVersion | null | undefined = null;
    assetVersionFbxB2:          DBAPI.AssetVersion | null | undefined = null;
    assetVersionGlb:            DBAPI.AssetVersion | null | undefined = null;
    assetVersionObj1:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionObj2:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionObj3:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionPly:            DBAPI.AssetVersion | null | undefined = null;
    assetVersionStl:            DBAPI.AssetVersion | null | undefined = null;
    assetVersionUsd1:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionUsd2:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionUsdz:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionWrl1:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionWrl2:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionX3d1:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionX3d2:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionDae1:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionDae2:           DBAPI.AssetVersion | null | undefined = null;
    assetVersionGltfA:          DBAPI.AssetVersion | null | undefined = null;
    assetVersionGltfB1:         DBAPI.AssetVersion | null | undefined = null;
    assetVersionGltfB2:         DBAPI.AssetVersion | null | undefined = null;
    assetVersionGltfB3:         DBAPI.AssetVersion | null | undefined = null;
    assetVersionGltfB4:         DBAPI.AssetVersion | null | undefined = null;
    assetVersionGltfB5:         DBAPI.AssetVersion | null | undefined = null;

    userOwner:                  DBAPI.User | null = null;
    vocabModel:                 DBAPI.Vocabulary | undefined = undefined;
    vocabModelUVMapFile:        DBAPI.Vocabulary | undefined = undefined;
    vocabMCreation:             DBAPI.Vocabulary | undefined = undefined;
    vocabMModality:             DBAPI.Vocabulary | undefined = undefined;
    vocabMUnits:                DBAPI.Vocabulary | undefined = undefined;
    vocabMPurposeMaster:        DBAPI.Vocabulary | undefined = undefined;
    vocabMPurposeDownload:      DBAPI.Vocabulary | undefined = undefined;

    storage:                    STORE.IStorage | null = null;
    testCaseMap:                Map<string, ModelTestCase> = new Map<string, ModelTestCase>(); // map of testcase name to ModelTestCase structure
    masterCreated:              boolean = false;
    /* #endregion */

    //** Returns null if initialize cannot locate test files.  Do not treat this as an error */
    async initialize(testCase?: undefined): Promise<boolean | null>;
    async initialize(testCase: string): Promise<boolean | null>;
    async initialize(testCase: string[]): Promise<boolean | null>;
    async initialize(testCase: string | string[] | undefined): Promise<boolean | null> {
        // let assigned: boolean = true;
        this.userOwner = await UTIL.createUserTest({ Name: 'Model Test', EmailAddress: 'modeltest@si.edu', SecurityID: 'Model Test', Active: true, DateActivated: UTIL.nowCleansed(), DateDisabled: null, WorkflowNotificationTime: UTIL.nowCleansed(), EmailSettings: 0, idUser: 0 });
        if (!this.userOwner) {
            LOG.error('ModelTestSetup failed to create user', LOG.LS.eTEST);
            return false;
        }

        this.vocabModel             = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModel);
        this.vocabModelUVMapFile    = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile);
        this.vocabMCreation         = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelCreationMethodCAD);
        this.vocabMModality         = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelModalityMesh);
        this.vocabMUnits            = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelUnitsMillimeter);
        this.vocabMPurposeMaster    = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeMaster);
        this.vocabMPurposeDownload  = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eModelPurposeDownload);

        if (!this.vocabModel || !this.vocabModelUVMapFile || !this.vocabMCreation || !this.vocabMModality || !this.vocabMUnits || !this.vocabMPurposeMaster || !this.vocabMPurposeDownload) {
            LOG.error('ModelTestSetup failed to fetch Model-related Vocabulary', LOG.LS.eTEST);
            return false;
        }

        this.storage = await STORE.StorageFactory.getInstance();
        if (!this.storage) {
            LOG.error('ModelTestSetup failed to retrieve storage interface', LOG.LS.eTEST);
            return false;
        }

        // normalize parameters used to select test case
        const testCaseSet: Set<string> | null = testCase ? new Set<string>() : null;
        if (testCase) {
            if (typeof(testCase) === 'string')
                testCaseSet!.add(testCase); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            else if (Array.isArray(testCase)) {
                for (const testCaseEntry of testCase) {
                    if (typeof(testCaseEntry) === 'string')
                        testCaseSet!.add(testCaseEntry); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                }
            }
        }

        for (const MTD of modelTestFiles) {
            if (testCaseSet && !testCaseSet.has(MTD.testCase))
                continue;
            const fileExists: boolean = await this.testFileExistence(MTD);
            if (!fileExists) {
                LOG.info(`ModelTestSetup unable to locate file for ${JSON.stringify(MTD)}`, LOG.LS.eTEST);
                return null;
            }

            let model: DBAPI.Model | null | undefined = undefined;

            if (MTD.geometry) {
                const vocabMFileType: DBAPI.Vocabulary | undefined = await CACHE.VocabularyCache.mapModelFileByExtension(MTD.fileName);
                if (!vocabMFileType) {
                    LOG.error('ModelTestSetup failed to fetch Model file type Vocabulary', LOG.LS.eTEST);
                    return false;
                }

                // // create one master model
                // let idVPurpose: number = this.vocabMPurposeDownload.idVocabulary;
                // if (!this.masterCreated) {
                //     this.masterCreated = true;
                //     idVPurpose = this.vocabMPurposeMaster.idVocabulary;
                // }
                const idVPurpose = this.vocabMPurposeMaster.idVocabulary;

                model = await UTIL.createModelTest({
                    Name: MTD.fileName,
                    DateCreated: UTIL.nowCleansed(),
                    idVCreationMethod: this.vocabMCreation.idVocabulary,
                    idVModality: this.vocabMModality.idVocabulary,
                    idVUnits: this.vocabMUnits.idVocabulary,
                    idVPurpose,
                    idVFileType: vocabMFileType.idVocabulary,
                    idAssetThumbnail: null,
                    CountAnimations: 0, CountCameras: 0, CountFaces: 0, CountLights: 0, CountMaterials: 0, CountMeshes: 0, CountVertices: 0,
                    CountEmbeddedTextures: 0, CountLinkedTextures: 0, FileEncoding: 'BINARY', IsDracoCompressed: false, AutomationTag: null,
                    CountTriangles: 0,
                    idModel: 0
                });
            } else {
                const MTC: ModelTestCase | undefined = this.testCaseMap.get(MTD.testCase);
                if (!MTC) {
                    LOG.error(`ModelTestSetup attempting to ingest non-model ${MTD.fileName} without model already created`, LOG.LS.eTEST);
                    return false;
                }
                model = MTC.model;
            }

            const { success, asset, assetVersion } = await this.ingestFile(MTD, model);
            if (!success) {
                LOG.error('ModelTestSetup failed to ingest model', LOG.LS.eTEST);
                return false;
            }

            // record test case data
            if (assetVersion) {
                let MTC: ModelTestCase | undefined = this.testCaseMap.get(MTD.testCase);
                if (!MTC) {
                    const inspectJSON: string | undefined = modelTestCaseInspectJSONMap.get(MTD.testCase) || '';
                    MTC = new ModelTestCase(MTD.testCase, model, MTD.fileName, assetVersion, inspectJSON);
                    this.testCaseMap.set(MTD.testCase, MTC);
                } else
                    MTC.assetVersions.push(assetVersion);
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
                case 'dae':
                    if (MTD.geometry) {
                        this.modelDae = model;
                        this.assetDae1 = asset;
                        this.assetVersionDae1 = assetVersion;
                    } else {
                        this.assetDae2 = asset;
                        this.assetVersionDae2 = assetVersion;
                    }
                    break;
                case 'gltf-stand-alone':
                    this.modelGltf1 = model;
                    this.assetGltfA = asset;
                    this.assetVersionGltfA = assetVersion;
                    break;
                case 'gltf-with-support':
                    if (MTD.geometry) {
                        this.modelGltf2 = model;
                        this.assetGltfB1 = asset;
                        this.assetVersionGltfB1 = assetVersion;
                    } else if (!this.assetGltfB2) {
                        this.assetGltfB2 = asset;
                        this.assetVersionGltfB2 = assetVersion;
                    } else if (!this.assetGltfB3) {
                        this.assetGltfB3 = asset;
                        this.assetVersionGltfB3 = assetVersion;
                    } else if (!this.assetGltfB4) {
                        this.assetGltfB4 = asset;
                        this.assetVersionGltfB4 = assetVersion;
                    } else if (!this.assetGltfB5) {
                        this.assetGltfB5 = asset;
                        this.assetVersionGltfB5 = assetVersion;
                    }
                    break;
            }
        }

        return true;
    }

    getTestCase(testCase: string): ModelTestCase | undefined {
        return this.testCaseMap.get(testCase);
    }

    private async ingestFile(MTD: ModelTestFile, model: DBAPI.Model): Promise<{ success: boolean, asset?: DBAPI.Asset | null | undefined, assetVersion?: DBAPI.AssetVersion | null | undefined}> {
        if (!this.userOwner || !this.vocabModel || !this.vocabModelUVMapFile || !this.storage)
            return { success: false };

        const LocalFilePath: string = this.computeFilePath(MTD);
        const ISI: STORE.IngestStreamOrFileInput = {
            readStream: null,
            localFilePath: LocalFilePath,
            asset: null,
            FileName: MTD.fileName,
            FilePath: MTD.directory,
            idAssetGroup: 0,
            idVAssetType: MTD.geometry ? this.vocabModel.idVocabulary : this.vocabModelUVMapFile.idVocabulary,
            allowZipCracking: true,
            idUserCreator: this.userOwner.idUser,
            SOBased: model,
            Comment: null
        };

        const { success, asset, assetVersion } = await STORE.AssetStorageAdapter.ingestStreamOrFile(ISI);
        return { success, asset, assetVersion };
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
                LOG.error(`ModelTestSetup.testFileExistience('${filePath}') unable to compute hash ${hashRes.error}`, LOG.LS.eTEST);
                success = false;
            } else if (hashRes.hash != MTD.hash) {
                LOG.error(`ModelTestSetup.testFileExistience('${filePath}') computed different hash ${hashRes.hash} than expected ${MTD.hash}`, LOG.LS.eTEST);
                success = false;
            }
        }

        LOG.info(`ModelTestSetup.testFileExistience('${filePath}') = ${success}`, LOG.LS.eTEST);
        return success;
    }
}