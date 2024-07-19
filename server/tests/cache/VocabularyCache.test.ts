/* eslint-disable @typescript-eslint/no-explicit-any */
import * as DBAPI from '../../db';
import * as COMMON from '@dpo-packrat/common';
import * as H from '../../utils/helpers';
import { VocabularyCache } from '../../cache';
import * as LOG from '../../utils/logger';
/*
afterAll(async done => {
    await H.Helpers.sleep(4000);
    done();
});
*/
enum eCacheTestMode {
    eInitial,
    eClear,
    eFlush
}

const vocabularyCacheTest = (): void => {
    vocabularyCacheTestWorker(eCacheTestMode.eInitial);
    vocabularyCacheTestWorker(eCacheTestMode.eClear);
    vocabularyCacheTestWorker(eCacheTestMode.eFlush);
    vocabularyCacheTestClearFlush();
};

function vocabularyCacheTestWorker(eMode: eCacheTestMode): void {
    let vocabularyAll: DBAPI.Vocabulary[] | null = null;
    let vocabularySetAll: DBAPI.VocabularySet[] | null = null;
    const vocabularyMap: Map<number, DBAPI.Vocabulary> = new Map<number, DBAPI.Vocabulary>();
    const vocabularySetMap: Map<number, DBAPI.VocabularySet> = new Map<number, DBAPI.VocabularySet>();

    let description: string = '';
    switch (eMode) {
        case eCacheTestMode.eInitial: description = 'initial'; break;
        case eCacheTestMode.eClear: description = 'post clear'; break;
        case eCacheTestMode.eFlush: description = 'post flush'; break;
    }

    describe('Cache: VocabularyCache ' + description, () => {
        test('Cache: VocabularyCache Setup ' + description, async () => {
            switch (eMode) {
                case eCacheTestMode.eInitial: break;
                case eCacheTestMode.eClear: await VocabularyCache.clear(); break;
                case eCacheTestMode.eFlush: await VocabularyCache.flush(); break;
            }

            vocabularyAll = await DBAPI.Vocabulary.fetchAll();
            expect(vocabularyAll).toBeTruthy();
            expect(vocabularyAll ? vocabularyAll.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);

            vocabularySetAll = await DBAPI.VocabularySet.fetchAll();
            expect(vocabularySetAll).toBeTruthy();
            expect(vocabularySetAll ? vocabularySetAll.length : /* istanbul ignore next */ 0).toBeGreaterThan(0);

            /* istanbul ignore else */
            if (vocabularyAll)
                for (const vocabulary of vocabularyAll)
                    vocabularyMap.set(vocabulary.idVocabulary, vocabulary);

            /* istanbul ignore else */
            if (vocabularySetAll)
                for (const vocabularySet of vocabularySetAll)
                    vocabularySetMap.set(vocabularySet.idVocabularySet, vocabularySet);
        });

        test('Cache: VocabularyCache.vocabulary ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularyAll)
                return;
            for (const vocabulary of vocabularyAll) {
                const vocabularyInCache: DBAPI.Vocabulary | undefined =
                    await VocabularyCache.vocabulary(vocabulary.idVocabulary);
                expect(vocabularyInCache).toBeTruthy();
                /* istanbul ignore else */
                if (vocabularyInCache)
                    expect(vocabulary).toMatchObject(vocabularyInCache);
            }
        });

        test('Cache: VocabularyCache.vocabularyByEnum ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularyAll)
                return;

            // iterate through all enums of COMMON.eVocabularyID; for each:
            for (const sVocabID in COMMON.eVocabularyID) {
                if (!isNaN(Number(sVocabID)))
                    continue;

                const eVocabID: COMMON.eVocabularyID = (<any>COMMON.eVocabularyID)[sVocabID];
                const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
                // LOG.info(`*** sVocab=${sVocabID}, eVocabID=${COMMON.eVocabularyID[eVocabID]}, vocabulary=${JSON.stringify(vocabulary)}`, LOG.LS.eTEST);

                switch (eVocabID) {
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeARK: testVocabulary(vocabulary, 'ARK'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeDOI: testVocabulary(vocabulary, 'DOI'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID: testVocabulary(vocabulary, 'Edan Record ID'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeAccession: testVocabulary(vocabulary, 'Accession #'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeAccessionNumber: testVocabulary(vocabulary, 'Accession Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeArchivesCollectionNumber: testVocabulary(vocabulary, 'Archives Collection Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeBankCharterNumber: testVocabulary(vocabulary, 'Bank Charter Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeBarcode: testVocabulary(vocabulary, 'Barcode'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeCallNumber: testVocabulary(vocabulary, 'Call Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeCatalogID: testVocabulary(vocabulary, 'Catalog ID'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeCatalogNumber: testVocabulary(vocabulary, 'Catalog Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeCollectorDonorNumber: testVocabulary(vocabulary, 'Collector/Donor Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeControlNumber: testVocabulary(vocabulary, 'Control Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeDesignPatentNumber: testVocabulary(vocabulary, 'Design Patent Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeDesignerNumber: testVocabulary(vocabulary, 'Designer Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeFieldIdentifier: testVocabulary(vocabulary, 'Field Identifier'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeGUID: testVocabulary(vocabulary, 'GUID'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeIDNumber: testVocabulary(vocabulary, 'ID Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeIdentifier: testVocabulary(vocabulary, 'Identifier'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeImageID: testVocabulary(vocabulary, 'Image ID'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeImageNumber: testVocabulary(vocabulary, 'Image Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeInventoryNumber: testVocabulary(vocabulary, 'Inventory Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeISBN: testVocabulary(vocabulary, 'ISBN'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeISSN: testVocabulary(vocabulary, 'ISSN'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeLabelNumber: testVocabulary(vocabulary, 'Label Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeLicenseNumber: testVocabulary(vocabulary, 'License Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeLocalNumber: testVocabulary(vocabulary, 'Local Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeMakerNumber: testVocabulary(vocabulary, 'Maker Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeModelNumber: testVocabulary(vocabulary, 'Model Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeNonaccessionNumber: testVocabulary(vocabulary, 'Nonaccession Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeObjectNumber: testVocabulary(vocabulary, 'Object Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeOriginalObjectIdentifier: testVocabulary(vocabulary, 'Original Object Identifier'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeOtherNumbers: testVocabulary(vocabulary, 'Other Numbers'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypePatentNumber: testVocabulary(vocabulary, 'Patent Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypePlateLetters: testVocabulary(vocabulary, 'Plate Letters'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypePlateNumber: testVocabulary(vocabulary, 'Plate Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypePublisherNumber: testVocabulary(vocabulary, 'Publisher Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeRecordID: testVocabulary(vocabulary, 'Record ID'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeRecordNumber: testVocabulary(vocabulary, 'Record Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeSerialNumber: testVocabulary(vocabulary, 'Serial Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeSeriesStandardNumber: testVocabulary(vocabulary, 'Series Standard Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeStandardNumber: testVocabulary(vocabulary, 'Standard Number'); break;
                    case COMMON.eVocabularyID.eIdentifierIdentifierTypeUSNMNumber: testVocabulary(vocabulary, 'USNM Number'); break;

                    case COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion: testVocabulary(vocabulary, 'Bulk Ingestion'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry: testVocabulary(vocabulary, 'Capture Data Set: Photogrammetry'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde: testVocabulary(vocabulary, 'Capture Data Set: Diconde'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDicom: testVocabulary(vocabulary, 'Capture Data Set: Dicom'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine: testVocabulary(vocabulary, 'Capture Data Set: Laser Line'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser: testVocabulary(vocabulary, 'Capture Data Set: Spherical Laser'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight: testVocabulary(vocabulary, 'Capture Data Set: Structured Light'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetOther: testVocabulary(vocabulary, 'Capture Data Set: Other'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile: testVocabulary(vocabulary, 'Capture Data File'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeModel: testVocabulary(vocabulary, 'Model'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile: testVocabulary(vocabulary, 'Model Geometry File'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile: testVocabulary(vocabulary, 'Model UV Map File'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeScene: testVocabulary(vocabulary, 'Scene'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeProjectDocumentation: testVocabulary(vocabulary, 'Project Documentation'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeIntermediaryFile: testVocabulary(vocabulary, 'Intermediary File'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeAttachment: testVocabulary(vocabulary, 'Attachment'); break;
                    case COMMON.eVocabularyID.eAssetAssetTypeOther: testVocabulary(vocabulary, 'Other'); break;

                    case COMMON.eVocabularyID.eCaptureDataCaptureMethodPhotogrammetry: testVocabulary(vocabulary, 'Photogrammetry'); break;
                    case COMMON.eVocabularyID.eCaptureDataCaptureMethodCT: testVocabulary(vocabulary, 'CT'); break;
                    case COMMON.eVocabularyID.eCaptureDataCaptureMethodStructuredLight: testVocabulary(vocabulary, 'Structured Light'); break;
                    case COMMON.eVocabularyID.eCaptureDataCaptureMethodLaserLine: testVocabulary(vocabulary, 'Laser Line'); break;
                    case COMMON.eVocabularyID.eCaptureDataCaptureMethodSphericalLaser: testVocabulary(vocabulary, 'Spherical Laser'); break;

                    case COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw: testVocabulary(vocabulary, 'Raw'); break;
                    case COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed: testVocabulary(vocabulary, 'Processed'); break;
                    case COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera: testVocabulary(vocabulary, 'From Camera'); break;
                    case COMMON.eVocabularyID.eCaptureDataFileVariantTypeMasks: testVocabulary(vocabulary, 'Masks'); break;

                    case COMMON.eVocabularyID.eModelCreationMethodScanToMesh: testVocabulary(vocabulary, 'Scan To Mesh'); break;
                    case COMMON.eVocabularyID.eModelCreationMethodCAD: testVocabulary(vocabulary, 'CAD'); break;

                    case COMMON.eVocabularyID.eModelModalityPointCloud: testVocabulary(vocabulary, 'Point Cloud'); break;
                    case COMMON.eVocabularyID.eModelModalityMesh: testVocabulary(vocabulary, 'Mesh'); break;

                    case COMMON.eVocabularyID.eModelUnitsMicrometer: testVocabulary(vocabulary, 'Micrometer'); break;
                    case COMMON.eVocabularyID.eModelUnitsMillimeter: testVocabulary(vocabulary, 'Millimeter'); break;
                    case COMMON.eVocabularyID.eModelUnitsCentimeter: testVocabulary(vocabulary, 'Centimeter'); break;
                    case COMMON.eVocabularyID.eModelUnitsMeter: testVocabulary(vocabulary, 'Meter'); break;
                    case COMMON.eVocabularyID.eModelUnitsKilometer: testVocabulary(vocabulary, 'Kilometer'); break;
                    case COMMON.eVocabularyID.eModelUnitsInch: testVocabulary(vocabulary, 'Inch'); break;
                    case COMMON.eVocabularyID.eModelUnitsFoot: testVocabulary(vocabulary, 'Foot'); break;
                    case COMMON.eVocabularyID.eModelUnitsYard: testVocabulary(vocabulary, 'Yard'); break;
                    case COMMON.eVocabularyID.eModelUnitsMile: testVocabulary(vocabulary, 'Mile'); break;
                    case COMMON.eVocabularyID.eModelUnitsAstronomicalUnit: testVocabulary(vocabulary, 'Astronomical Unit'); break;

                    case COMMON.eVocabularyID.eModelPurposeMaster: testVocabulary(vocabulary, 'Master'); break;
                    case COMMON.eVocabularyID.eModelPurposeVoyagerSceneModel: testVocabulary(vocabulary, 'Voyager Scene Model'); break;
                    case COMMON.eVocabularyID.eModelPurposeDownload: testVocabulary(vocabulary, 'Download'); break;
                    case COMMON.eVocabularyID.eModelPurposeIntermediateProcessingStep: testVocabulary(vocabulary, 'Intermediate Processing Step'); break;

                    case COMMON.eVocabularyID.eModelFileTypeobj: testVocabulary(vocabulary, 'obj - Alias Wavefront Object'); break;
                    case COMMON.eVocabularyID.eModelFileTypeply: testVocabulary(vocabulary, 'ply - Stanford Polygon File Format'); break;
                    case COMMON.eVocabularyID.eModelFileTypestl: testVocabulary(vocabulary, 'stl - StereoLithography'); break;
                    case COMMON.eVocabularyID.eModelFileTypeglb: testVocabulary(vocabulary, 'glb - GL Transmission Format Binary'); break;
                    case COMMON.eVocabularyID.eModelFileTypegltf: testVocabulary(vocabulary, 'gltf - GL Transmission Format'); break;
                    case COMMON.eVocabularyID.eModelFileTypeusd: testVocabulary(vocabulary, 'usd - Universal Scene Description'); break;
                    case COMMON.eVocabularyID.eModelFileTypeusdz: testVocabulary(vocabulary, 'usdz - Universal Scene Description (zipped)'); break;
                    case COMMON.eVocabularyID.eModelFileTypex3d: testVocabulary(vocabulary, 'x3d'); break;
                    case COMMON.eVocabularyID.eModelFileTypewrl: testVocabulary(vocabulary, 'wrl - VRML'); break;
                    case COMMON.eVocabularyID.eModelFileTypedae: testVocabulary(vocabulary, 'dae - COLLADA'); break;
                    case COMMON.eVocabularyID.eModelFileTypefbx: testVocabulary(vocabulary, 'fbx - Filmbox'); break;
                    case COMMON.eVocabularyID.eModelFileTypema: testVocabulary(vocabulary, 'ma - Maya'); break;
                    case COMMON.eVocabularyID.eModelFileType3ds: testVocabulary(vocabulary, '3ds - 3D Studio'); break;
                    case COMMON.eVocabularyID.eModelFileTypeptx: testVocabulary(vocabulary, 'ptx'); break;
                    case COMMON.eVocabularyID.eModelFileTypepts: testVocabulary(vocabulary, 'pts'); break;

                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse: testVocabulary(vocabulary, 'Diffuse'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeSpecular: testVocabulary(vocabulary, 'Specular'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeAmbient: testVocabulary(vocabulary, 'Ambient'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeEmissive: testVocabulary(vocabulary, 'Emissive'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeBump: testVocabulary(vocabulary, 'Bump'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNormal: testVocabulary(vocabulary, 'Normal'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness: testVocabulary(vocabulary, 'Glossiness'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOpacity: testVocabulary(vocabulary, 'Opacity'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement: testVocabulary(vocabulary, 'Displacement'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion: testVocabulary(vocabulary, 'Occlusion'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeReflection: testVocabulary(vocabulary, 'Reflection'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeMetalness: testVocabulary(vocabulary, 'Metalness'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeRoughness: testVocabulary(vocabulary, 'Roughness'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNone: testVocabulary(vocabulary, 'None'); break;
                    case COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeUnknown: testVocabulary(vocabulary, 'Unknown'); break;

                    case COMMON.eVocabularyID.eMetadataMetadataSourceBulkIngestion:    testVocabulary(vocabulary, 'Bulk Ingestion'); break;
                    case COMMON.eVocabularyID.eMetadataMetadataSourceImage:            testVocabulary(vocabulary, 'Image'); break;

                    case COMMON.eVocabularyID.eJobJobTypeCookBake:                     testVocabulary(vocabulary, 'Cook: bake'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookDecimateUnwrap:           testVocabulary(vocabulary, 'Cook: decimate-unwrap'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookDecimate:                 testVocabulary(vocabulary, 'Cook: decimate'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookGenerateUsdz:             testVocabulary(vocabulary, 'Cook: generate-usdz'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookGenerateWebGltf:          testVocabulary(vocabulary, 'Cook: generate-web-gltf'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookInspectMesh:              testVocabulary(vocabulary, 'Cook: inspect-mesh'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookSIArBackfillFix:          testVocabulary(vocabulary, 'Cook: si-ar-backfill-fix'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookSIGenerateDownloads:      testVocabulary(vocabulary, 'Cook: si-generate-downloads'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookSIOrientModelToSvx:       testVocabulary(vocabulary, 'Cook: si-orient-model-to-svx'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookSIPackratInspect:         testVocabulary(vocabulary, 'Cook: si-packrat-inspect'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerAsset:           testVocabulary(vocabulary, 'Cook: si-voyager-asset'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookSIVoyagerScene:           testVocabulary(vocabulary, 'Cook: si-voyager-scene'); break;
                    case COMMON.eVocabularyID.eJobJobTypeCookUnwrap:                   testVocabulary(vocabulary, 'Cook: unwrap'); break;

                    case COMMON.eVocabularyID.eWorkflowTypeCookJob:                    testVocabulary(vocabulary, 'Cook Job'); break;
                    case COMMON.eVocabularyID.eWorkflowTypeIngestion:                  testVocabulary(vocabulary, 'Ingestion'); break;
                    case COMMON.eVocabularyID.eWorkflowTypeUpload:                     testVocabulary(vocabulary, 'Upload'); break;

                    case COMMON.eVocabularyID.eWorkflowStepTypeStart:                  testVocabulary(vocabulary, 'Start'); break;

                    case COMMON.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion:   testVocabulary(vocabulary, 'Ingestion: Upload Asset Version'); break;
                    case COMMON.eVocabularyID.eWorkflowEventIngestionIngestObject:         testVocabulary(vocabulary, 'Ingestion: Ingest Object'); break;

                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmm:             testVocabulary(vocabulary, 'mm'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitscm:             testVocabulary(vocabulary, 'cm'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsm:              testVocabulary(vocabulary, 'm'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitskm:             testVocabulary(vocabulary, 'km'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsin:             testVocabulary(vocabulary, 'in'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsft:             testVocabulary(vocabulary, 'ft'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsyd:             testVocabulary(vocabulary, 'yd'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmi:             testVocabulary(vocabulary, 'mi'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeobj:    testVocabulary(vocabulary, 'obj'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeply:    testVocabulary(vocabulary, 'ply'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypestl:    testVocabulary(vocabulary, 'stl'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeglb:    testVocabulary(vocabulary, 'glb'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypex3d:    testVocabulary(vocabulary, 'x3d'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypegltf:   testVocabulary(vocabulary, 'gltf'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeusdz:   testVocabulary(vocabulary, 'usdz'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypezip:         testVocabulary(vocabulary, 'zip'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypeglb:         testVocabulary(vocabulary, 'glb'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypeusdz:        testVocabulary(vocabulary, 'usdz'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceType3dmesh:                   testVocabulary(vocabulary, '3d mesh'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceTypeCADmodel:                 testVocabulary(vocabulary, 'CAD model'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceCategoryFullresolution:       testVocabulary(vocabulary, 'Full resolution'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceCategoryMediumresolution:     testVocabulary(vocabulary, 'Medium resolution'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceCategoryLowresolution:        testVocabulary(vocabulary, 'Low resolution'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceCategoryWatertight:           testVocabulary(vocabulary, 'Watertight'); break;
                    case COMMON.eVocabularyID.eEdan3DResourceCategoryiOSARmodel:           testVocabulary(vocabulary, 'iOS AR model'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsLabel:                         testVocabulary(vocabulary, 'Label'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsTitle:                         testVocabulary(vocabulary, 'Title'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsRecordID:                      testVocabulary(vocabulary, 'Record ID'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsUnit:                          testVocabulary(vocabulary, 'Unit'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsLicense:                       testVocabulary(vocabulary, 'License'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsLicenseText:                   testVocabulary(vocabulary, 'License Text'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsObjectType:                    testVocabulary(vocabulary, 'Object Type'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsDate:                          testVocabulary(vocabulary, 'Date'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsPlace:                         testVocabulary(vocabulary, 'Place'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsTopic:                         testVocabulary(vocabulary, 'Topic'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsIdentifierFT:                  testVocabulary(vocabulary, 'Identifier (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsDataSourceFT:                  testVocabulary(vocabulary, 'Data Source (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsDateFT:                        testVocabulary(vocabulary, 'Date (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsNameFT:                        testVocabulary(vocabulary, 'Name (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsObjectRightsFT:                testVocabulary(vocabulary, 'Object Rights (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsPlaceFT:                       testVocabulary(vocabulary, 'Place (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsTaxonomicNameFT:               testVocabulary(vocabulary, 'Taxonomic Name (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsNotesFT:                       testVocabulary(vocabulary, 'Notes (FT)'); break;
                    case COMMON.eVocabularyID.eEdanMDMFieldsPhysicalDescriptionFT:         testVocabulary(vocabulary, 'Physical Description (FT)'); break;

                    case COMMON.eVocabularyID.eNone: expect(vocabulary).toBeFalsy(); break;
                    default: expect(`Untested COMMON.eVocabularyID enum ${COMMON.eVocabularyID[eVocabID]}`).toBeFalsy(); break;
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySet ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;
            for (const vocabularySet of vocabularySetAll) {
                const vocabularySetInCache: DBAPI.VocabularySet | undefined =
                    await VocabularyCache.vocabularySet(vocabularySet.idVocabularySet);
                expect(vocabularySetInCache).toBeTruthy();
                /* istanbul ignore else */
                if (vocabularySetInCache)
                    expect(vocabularySet).toMatchObject(vocabularySetInCache);
            }
        });

        test('Cache: VocabularyCache.vocabularySetByEnum ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;

            // iterate through all enums of COMMON.eVocabularySetID; for each:
            for (const sVocabSetID in COMMON.eVocabularySetID) {
                if (!isNaN(Number(sVocabSetID)))
                    continue;
                const eVocabSetID: COMMON.eVocabularySetID = (<any>COMMON.eVocabularySetID)[sVocabSetID];
                const vocabularySet: DBAPI.VocabularySet | undefined = await VocabularyCache.vocabularySetByEnum(eVocabSetID);

                switch (eVocabSetID) {
                    case COMMON.eVocabularySetID.eCaptureDataCaptureMethod:
                    case COMMON.eVocabularySetID.eCaptureDataDatasetType:
                    case COMMON.eVocabularySetID.eCaptureDataDatasetUse:
                    case COMMON.eVocabularySetID.eCaptureDataItemPositionType:
                    case COMMON.eVocabularySetID.eCaptureDataFocusType:
                    case COMMON.eVocabularySetID.eCaptureDataLightSourceType:
                    case COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod:
                    case COMMON.eVocabularySetID.eCaptureDataClusterType:
                    case COMMON.eVocabularySetID.eCaptureDataFileVariantType:
                    case COMMON.eVocabularySetID.eModelCreationMethod:
                    case COMMON.eVocabularySetID.eModelModality:
                    case COMMON.eVocabularySetID.eModelUnits:
                    case COMMON.eVocabularySetID.eModelPurpose:
                    case COMMON.eVocabularySetID.eModelFileType:
                    case COMMON.eVocabularySetID.eModelProcessingActionStepActionMethod:
                    case COMMON.eVocabularySetID.eModelMaterialChannelMaterialType:
                    case COMMON.eVocabularySetID.eIdentifierIdentifierType:
                    case COMMON.eVocabularySetID.eIdentifierIdentifierTypeActor:
                    case COMMON.eVocabularySetID.eMetadataMetadataSource:
                    case COMMON.eVocabularySetID.eWorkflowStepWorkflowStepType:
                    case COMMON.eVocabularySetID.eAssetAssetType:
                    case COMMON.eVocabularySetID.eJobJobType:
                    case COMMON.eVocabularySetID.eWorkflowType:
                    case COMMON.eVocabularySetID.eWorkflowEvent:
                    case COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits:
                    case COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType:
                    case COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType:
                    case COMMON.eVocabularySetID.eEdan3DResourceType:
                    case COMMON.eVocabularySetID.eEdan3DResourceCategory:
                    case COMMON.eVocabularySetID.eEdanMDMFields:
                        expect(vocabularySet).toBeTruthy();
                        /* istanbul ignore else */
                        if (vocabularySet)
                            expect('e' + vocabularySet.Name.replace('.', '')).toEqual(sVocabSetID);
                        break;

                    case COMMON.eVocabularySetID.eNone:
                        expect(vocabularySet).toBeFalsy();
                        break;

                    default:
                        expect(`Unexpected vocabulary set ${sVocabSetID}`).toBeFalsy();
                        break;
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySetEntries ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;
            for (const vocabularySet of vocabularySetAll) {
                const vocabularySetEntriesInCache: DBAPI.Vocabulary[] | undefined =
                    await VocabularyCache.vocabularySetEntries(vocabularySet.idVocabularySet);
                expect(vocabularySetEntriesInCache).toBeTruthy();
                /* istanbul ignore else */
                if (vocabularySetEntriesInCache) {
                    let lastSort: number = 0;
                    for (const vocabularyInCache of vocabularySetEntriesInCache) {
                        expect(vocabularyInCache.idVocabularySet).toEqual(vocabularySet.idVocabularySet);
                        if (vocabularySet.SystemMaintained) {
                            expect(vocabularyInCache.SortOrder).toBeGreaterThan(lastSort);
                            lastSort = vocabularyInCache.SortOrder;
                        }
                        expect(vocabularyMap.has(vocabularyInCache.idVocabulary)).toBeTruthy();
                        expect(vocabularyMap.get(vocabularyInCache.idVocabulary)).toMatchObject(vocabularyInCache);
                    }
                }
            }
        });

        test('Cache: VocabularyCache.vocabularySetEntriesByEnum ' + description, async () => {
            /* istanbul ignore if */
            if (!vocabularySetAll)
                return;

            const vocabNameMap: Map<string, number> = new Map<string, number>();    // Map normalized vocabulary set name -> idVocabularySet
            for (const vocabularySet of vocabularySetAll) {
                const sVocabSetNameNorm: string = vocabularySet.Name.replace('.', '').toUpperCase();
                vocabNameMap.set(sVocabSetNameNorm, vocabularySet.idVocabularySet);
            }

            // iterate through all enums of COMMON.eVocabularySetID; for each:
            for (const sVocabSetID in COMMON.eVocabularySetID) { // Object.keys(COMMON.eVocabularySetID).filter(k => typeof COMMON.eVocabularySetID[k as any] === 'number')) {
                if (!isNaN(Number(sVocabSetID)))
                    continue;
                const eVocabSetID: COMMON.eVocabularySetID = (<any>COMMON.eVocabularySetID)[sVocabSetID]; // <COMMON.eVocabularySetID><unknown>COMMON.eVocabularySetID[sVocabSetID]; // COMMON.eVocabularySetID = sVocabSetID as keyof typeof COMMON.eVocabularySetID; // (<any>COMMON.eVocabularySetID)[sVocabSetID];
                if (eVocabSetID == COMMON.eVocabularySetID.eNone)
                    continue;

                // compute the vocabulary set entries
                const vocabularySetEntriesInCacheByEnum: DBAPI.Vocabulary[] | undefined =
                    await VocabularyCache.vocabularySetEntriesByEnum(eVocabSetID);
                expect(vocabularySetEntriesInCacheByEnum).toBeTruthy();

                // compute the vocabulary set name and ID from the enum name
                const sVocabSetNameNorm: string = sVocabSetID.substring(1).toUpperCase();
                const nVocabSetID: number | undefined = vocabNameMap.get(sVocabSetNameNorm);
                expect(nVocabSetID).toBeTruthy();
                /* istanbul ignore if */
                if (!nVocabSetID)
                    continue;

                // compute the vocabulary set entries from the enum converted to an ID
                const vocabularySetEntriesInCache: DBAPI.Vocabulary[] | undefined =
                    await VocabularyCache.vocabularySetEntries(nVocabSetID);
                expect(vocabularySetEntriesInCache).toBeTruthy();

                // verify arrays match
                expect(H.Helpers.arraysEqual(vocabularySetEntriesInCacheByEnum, vocabularySetEntriesInCache)).toBeTruthy();
            }

            const vocabularySetEntriesInCacheByEnumNone: DBAPI.Vocabulary[] | undefined =
                await VocabularyCache.vocabularySetEntriesByEnum(COMMON.eVocabularySetID.eNone);
            expect(vocabularySetEntriesInCacheByEnumNone).toBeUndefined();
        });

        test('Cache: VocabularyCache.vocabularyBySetAndTerm ' + description, async () => {
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataCaptureMethod, 'Photogrammetry');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataCaptureMethod, 'CT');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataCaptureMethod, 'Structured Light');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataCaptureMethod, 'Laser Line');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataCaptureMethod, 'Spherical Laser');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataDatasetType, 'Photogrammetry Image Set');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataDatasetType, 'Grey Card Image Set');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataDatasetType, 'Color Card Image Set');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataDatasetType, 'Background Removal Image Set');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataDatasetType, 'Calibration Dataset');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataItemPositionType, 'Relative To Environment');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataItemPositionType, 'Relative To Turntable');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataFocusType, 'Fixed');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataFocusType, 'Variable');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataLightSourceType, 'Ambient');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataLightSourceType, 'Strobe Standard');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataLightSourceType, 'Strobe Cross');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataLightSourceType, 'Patterned/Structured');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'None');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'Clip Black');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'Clip White');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataBackgroundRemovalMethod, 'Background Subtraction');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataClusterType, 'None');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataClusterType, 'Array');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataClusterType, 'Spherical Image Station');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataClusterType, 'Focal Stack Position Based');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataClusterType, 'Focal Stack Focus Based');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataFileVariantType, 'Raw');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataFileVariantType, 'Processed');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataFileVariantType, 'From Camera');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eCaptureDataFileVariantType, 'Masks');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelCreationMethod, 'Scan To Mesh');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelCreationMethod, 'CAD');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelModality, 'Point Cloud');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelModality, 'Mesh');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Micrometer');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Millimeter');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Centimeter');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Meter');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Kilometer');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Inch');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Foot');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Yard');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Mile');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelUnits, 'Astronomical Unit');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelPurpose, 'Master');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelPurpose, 'Voyager Scene Model');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelPurpose, 'Download');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelPurpose, 'Intermediate Processing Step');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'obj - Alias Wavefront Object');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'ply - Stanford Polygon File Format');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'stl - StereoLithography');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'glb - GL Transmission Format Binary');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'gltf - GL Transmission Format');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'usd - Universal Scene Description');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'usdz - Universal Scene Description (zipped)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'x3d');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'wrl - VRML');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'dae - COLLADA');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'fbx - Filmbox');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'ma - Maya');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, '3ds - 3D Studio');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'ptx');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelFileType, 'pts');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Diffuse');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Specular');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Ambient');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Emissive');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Bump');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Normal');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Glossiness');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Opacity');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Displacement');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Occlusion');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Reflection');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Metalness');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Roughness');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'None');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eModelMaterialChannelMaterialType, 'Unknown');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'ARK');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'DOI');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Edan Record ID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Accession #');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Accession Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Archives Collection Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Bank Charter Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Barcode');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Call Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Catalog ID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Catalog Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Collector/Donor Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Control Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Design Patent Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Designer Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Field Identifier');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'GUID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'ID Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Identifier');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Image ID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Image Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Inventory Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'ISBN');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'ISSN');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Label Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'License Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Local Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Maker Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Model Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Nonaccession Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Object Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Original Object Identifier');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Other Numbers');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Patent Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Plate Letters');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Plate Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Publisher Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Record ID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Record Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Serial Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Series Standard Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'Standard Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierType, 'USNM Number');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierTypeActor, 'ORCID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eIdentifierIdentifierTypeActor, 'ISNI');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eMetadataMetadataSource, 'Bulk Ingestion');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eMetadataMetadataSource, 'Image');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Bulk Ingestion');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Photogrammetry');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Diconde');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Dicom');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Laser Line');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Spherical Laser');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Structured Light');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data Set: Other');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Capture Data File');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Model');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Model Geometry File');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Model UV Map File');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Scene');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Project Documentation');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Intermediary File');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'Other');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: bake');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: decimate-unwrap');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: decimate');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: generate-usdz');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: generate-web-gltf');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: inspect-mesh');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: si-ar-backfill-fix');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: si-generate-downloads');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: si-orient-model-to-svx');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: si-packrat-inspect');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: si-voyager-asset');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: si-voyager-scene');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eJobJobType, 'Cook: unwrap');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eWorkflowType, 'Cook Job');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eWorkflowStepWorkflowStepType, 'Start');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eWorkflowEvent, 'Ingestion: Upload Asset Version');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eWorkflowEvent, 'Ingestion: Ingest Object');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'mm');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'cm');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'm');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'km');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'in');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'ft');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'yd');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits, 'mi');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'obj');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'ply');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'stl');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'glb');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'x3d');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'gltf');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType, 'usdz');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType, 'zip');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType, 'glb');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType, 'usdz');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceType, '3d mesh');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceType, 'CAD model');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceCategory, 'Full resolution');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceCategory, 'Medium resolution');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceCategory, 'Low resolution');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceCategory, 'Watertight');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdan3DResourceCategory, 'iOS AR model');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Label');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Title');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Record ID');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Unit');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'License');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'License Text');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Object Type');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Date');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Place');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Topic');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Identifier (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Data Source (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Date (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Name (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Object Rights (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Place (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Taxonomic Name (FT)');
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eEdanMDMFields, 'Notes (FT)');

            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eAssetAssetType, 'OBVIOUSLY INVALID VALUE', false);
            await testVocabularyBySetAndTerm(COMMON.eVocabularySetID.eNone, 'Other', false);
        });

        test('Cache: VocabularyCache.mapPhotogrammetryVariantType ' + description, async () => {
            await testMapPhotogrammetryVariantType('raw', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('cr2', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('cr3', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('dng', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('arw', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('cam_dng', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('tif', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('tiff', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('bmp', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('png', COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw);
            await testMapPhotogrammetryVariantType('processed', COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed);
            await testMapPhotogrammetryVariantType('col_cor', COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed);
            await testMapPhotogrammetryVariantType('converted', COMMON.eVocabularyID.eCaptureDataFileVariantTypeProcessed);
            await testMapPhotogrammetryVariantType('from camera', COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('fromcamera', COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('jpg', COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('jpeg', COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('camerajpg', COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('camera', COMMON.eVocabularyID.eCaptureDataFileVariantTypeFromCamera);
            await testMapPhotogrammetryVariantType('masks', COMMON.eVocabularyID.eCaptureDataFileVariantTypeMasks);
            await testMapPhotogrammetryVariantType('mask', COMMON.eVocabularyID.eCaptureDataFileVariantTypeMasks);
            await testMapPhotogrammetryVariantType('FOOBARFAULTY', COMMON.eVocabularyID.eNone);
        });

        test('Cache: VocabularyCache.mapModelFileByExtension ' + description, async () => {
            await testMapModelFileByExtension('.obj',  COMMON.eVocabularyID.eModelFileTypeobj);
            await testMapModelFileByExtension('.ply',  COMMON.eVocabularyID.eModelFileTypeply);
            await testMapModelFileByExtension('.stl',  COMMON.eVocabularyID.eModelFileTypestl);
            await testMapModelFileByExtension('.glb' , COMMON.eVocabularyID.eModelFileTypeglb);
            await testMapModelFileByExtension('.gltf', COMMON.eVocabularyID.eModelFileTypegltf);
            await testMapModelFileByExtension('.usda', COMMON.eVocabularyID.eModelFileTypeusd);
            await testMapModelFileByExtension('.usdc', COMMON.eVocabularyID.eModelFileTypeusd);
            await testMapModelFileByExtension('.usdz', COMMON.eVocabularyID.eModelFileTypeusdz);
            await testMapModelFileByExtension('.x3d',  COMMON.eVocabularyID.eModelFileTypex3d);
            await testMapModelFileByExtension('.wrl',  COMMON.eVocabularyID.eModelFileTypewrl);
            await testMapModelFileByExtension('.dae',  COMMON.eVocabularyID.eModelFileTypedae);
            await testMapModelFileByExtension('.fbx',  COMMON.eVocabularyID.eModelFileTypefbx);
            await testMapModelFileByExtension('.ma',   COMMON.eVocabularyID.eModelFileTypema);
            await testMapModelFileByExtension('.3ds',  COMMON.eVocabularyID.eModelFileType3ds);
            await testMapModelFileByExtension('.ptx',  COMMON.eVocabularyID.eModelFileTypeptx);
            await testMapModelFileByExtension('.pts',  COMMON.eVocabularyID.eModelFileTypepts);
            await testMapModelFileByExtension('FOOBARFAULTY', COMMON.eVocabularyID.eNone);
        });

        test('Cache: VocabularyCache.mapModelChannelMaterialType ' + description, async () => {
            await testMapModelChannelMaterialType('diffuse',        COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse);
            await testMapModelChannelMaterialType('specular',       COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeSpecular);
            await testMapModelChannelMaterialType('ambient',        COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeAmbient);
            await testMapModelChannelMaterialType('emissive',       COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeEmissive);
            await testMapModelChannelMaterialType('bump',           COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeBump);
            await testMapModelChannelMaterialType('normal',         COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNormal);
            await testMapModelChannelMaterialType('glossiness',     COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeGlossiness);
            await testMapModelChannelMaterialType('opacity',        COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOpacity);
            await testMapModelChannelMaterialType('displacement',   COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDisplacement);
            await testMapModelChannelMaterialType('occlusion',      COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeOcclusion);
            await testMapModelChannelMaterialType('reflection',     COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeReflection);
            await testMapModelChannelMaterialType('metalness',      COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeMetalness);
            await testMapModelChannelMaterialType('roughness',      COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeRoughness);
            await testMapModelChannelMaterialType('none',           COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeNone);
            await testMapModelChannelMaterialType('unknown',        COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeUnknown);
            await testMapModelChannelMaterialType('FOOBARFAULTY',   COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeUnknown);
        });

        test('Cache: VocabularyCache.isPreferredAsset ' + description, async () => {
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetPhotogrammetry, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDiconde, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetDicom, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetLaserLine, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetSphericalLaser, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetStructuredLight, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataSetOther, COMMON.eSystemObjectType.eCaptureData);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeModel, COMMON.eSystemObjectType.eModel);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeModelGeometryFile, COMMON.eSystemObjectType.eModel);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeScene, COMMON.eSystemObjectType.eScene);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeProjectDocumentation, COMMON.eSystemObjectType.eProjectDocumentation);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeIntermediaryFile, COMMON.eSystemObjectType.eIntermediaryFile);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion, COMMON.eSystemObjectType.eUnknown);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeCaptureDataFile, COMMON.eSystemObjectType.eUnknown);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeModelUVMapFile, COMMON.eSystemObjectType.eUnknown);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeAttachment, COMMON.eSystemObjectType.eUnknown);
            await testIsPreferredAsset(COMMON.eVocabularyID.eAssetAssetTypeOther, COMMON.eSystemObjectType.eUnknown);
        });

        test('Cache: VocabularyCache.vocabularyEnumToId and vocabularyIdToEnum ' + description, async () => {
            // iterate through all enums of COMMON.eVocabularyID; for each:
            for (const sVocabID in COMMON.eVocabularyID) {
                if (!isNaN(Number(sVocabID)))
                    continue;
                const eVocabID: COMMON.eVocabularyID = (<any>COMMON.eVocabularyID)[sVocabID];
                const idVocabulary: number | undefined = await VocabularyCache.vocabularyEnumToId(eVocabID);
                if (eVocabID != COMMON.eVocabularyID.eNone)
                    expect(idVocabulary).toBeTruthy();
                else {
                    expect(idVocabulary).toBeFalsy();
                    continue;
                }

                const eVocabIDFetch: COMMON.eVocabularyID | undefined = await VocabularyCache.vocabularyIdToEnum(idVocabulary || 0);
                expect(eVocabIDFetch).toBeTruthy;
                expect(eVocabIDFetch).toEqual(eVocabID);
            }
            expect(await VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eNone)).toBeFalsy();
            expect(await VocabularyCache.vocabularyIdToEnum(0)).toBeFalsy();
        });

        test('Cache: VocabularyCache.vocabularySetEnumToId and vocabularySetIdToEnum' + description, async () => {
            // iterate through all enums of COMMON.eVocabularySetID; for each:
            for (const sVocabSetID in COMMON.eVocabularySetID) {
                if (!isNaN(Number(sVocabSetID)))
                    continue;
                // LOG.info(`VocabularyCache.vocabularySetEnumToId of ${sVocabSetID}`, LOG.LS.eTEST);
                const eVocabSetID: COMMON.eVocabularySetID = (<any>COMMON.eVocabularySetID)[sVocabSetID];
                const vocabularySet: DBAPI.VocabularySet | undefined = await VocabularyCache.vocabularySetByEnum(eVocabSetID);
                const vocabSetID: number | undefined = await VocabularyCache.vocabularySetEnumToId(eVocabSetID);

                if (eVocabSetID != COMMON.eVocabularySetID.eNone) {
                    expect(vocabularySet).toBeTruthy();
                    expect(vocabSetID).toBeTruthy();
                } else {
                    expect(vocabularySet).toBeFalsy();
                    expect(vocabSetID).toBeFalsy();
                    continue;
                }

                if (!vocabularySet)
                    continue;
                expect(vocabularySet.idVocabularySet).toEqual(vocabSetID);

                // LOG.info(`VocabularyCache.vocabularySetIdToEnum of ${vocabularySet.idVocabularySet}`, LOG.LS.eTEST);
                // fetches the VocabularySet.idVocabularySet for a given vocabulary set enum
                // static async vocabularySetIdToEnum(idVocabularySet: number): Promise<COMMON.eVocabularySetID | undefined> {
                const eVocabSetIDFetch: COMMON.eVocabularySetID | undefined = await VocabularyCache.vocabularySetIdToEnum(vocabularySet.idVocabularySet);
                expect(eVocabSetIDFetch).not.toBeUndefined();
                expect(eVocabSetIDFetch).toEqual(eVocabSetID);
            }
        });

        test('Cache: VocabularyCache.isVocabularyInSet ' + description, async () => {
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eCaptureDataFileVariantTypeRaw, COMMON.eVocabularySetID.eCaptureDataFileVariantType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eModelCreationMethodScanToMesh, COMMON.eVocabularySetID.eModelCreationMethod)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eModelModalityPointCloud, COMMON.eVocabularySetID.eModelModality)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eModelUnitsMicrometer, COMMON.eVocabularySetID.eModelUnits)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eModelPurposeMaster, COMMON.eVocabularySetID.eModelPurpose)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eModelFileTypeobj, COMMON.eVocabularySetID.eModelFileType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eModelMaterialChannelMaterialTypeDiffuse, COMMON.eVocabularySetID.eModelMaterialChannelMaterialType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK, COMMON.eVocabularySetID.eIdentifierIdentifierType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eMetadataMetadataSourceBulkIngestion, COMMON.eVocabularySetID.eMetadataMetadataSource)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eAssetAssetTypeBulkIngestion, COMMON.eVocabularySetID.eAssetAssetType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eJobJobTypeCookBake, COMMON.eVocabularySetID.eJobJobType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularySetID.eWorkflowType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowTypeIngestion, COMMON.eVocabularySetID.eWorkflowType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowTypeUpload, COMMON.eVocabularySetID.eWorkflowType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowStepTypeStart, COMMON.eVocabularySetID.eWorkflowStepWorkflowStepType)).toBeTruthy();

            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowEventIngestionUploadAssetVersion, COMMON.eVocabularySetID.eWorkflowEvent)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eEdan3DResourceAttributeUnitsmm, COMMON.eVocabularySetID.eEdan3DResourceAttributeUnits)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eEdan3DResourceAttributeModelFileTypeobj, COMMON.eVocabularySetID.eEdan3DResourceAttributeModelFileType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eEdan3DResourceAttributeFileTypezip, COMMON.eVocabularySetID.eEdan3DResourceAttributeFileType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eEdan3DResourceType3dmesh, COMMON.eVocabularySetID.eEdan3DResourceType)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eEdan3DResourceCategoryFullresolution, COMMON.eVocabularySetID.eEdan3DResourceCategory)).toBeTruthy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eEdanMDMFieldsNameFT, COMMON.eVocabularySetID.eEdanMDMFields)).toBeTruthy();

            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eNone, COMMON.eVocabularySetID.eMetadataMetadataSource)).toBeFalsy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularySetID.eNone)).toBeFalsy();
            expect(await VocabularyCache.isVocabularyInSet(COMMON.eVocabularyID.eWorkflowTypeCookJob, COMMON.eVocabularySetID.eMetadataMetadataSource)).toBeFalsy();
        });
    });
}

function vocabularyCacheTestClearFlush(): void {
    describe('Cache: VocabularyCache clear/flush', () => {
        test('Cache: VocabularyCache.clear and VocabularyCache.flush', async () => {
            await VocabularyCache.clear();
            await VocabularyCache.flush();
        });
    });
}

function testVocabulary(vocabulary: DBAPI.Vocabulary | undefined, termExpected: string): void {
    // LOG.info(`VocabularyCacheTest testVocabulary ${termExpected} ${JSON.stringify(vocabulary)}`, LOG.LS.eTEST);
    expect(vocabulary).toBeTruthy();
    /* istanbul ignore else */
    if (vocabulary)
        expect(vocabulary.Term).toEqual(termExpected);
}

async function testVocabularyBySetAndTerm(eVocabSetId: COMMON.eVocabularySetID, term: string, expectSuccess: boolean = true): Promise<void> {
    const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyBySetAndTerm(eVocabSetId, term);
    if (expectSuccess) {
        if (vocabulary === undefined)
            LOG.error(`testVocabularyBySetAndTerm count not find set ${COMMON.eVocabularySetID[eVocabSetId]}, term ${term}`, LOG.LS.eTEST);
        expect(vocabulary).toBeTruthy();
    }
    if (vocabulary)
        expect(vocabulary.Term).toEqual(term);
}

async function testMapPhotogrammetryVariantType(variantType: string, eVocabID: COMMON.eVocabularyID): Promise<void> {
    // LOG.info(`Testing ${variantType}; expecting ${COMMON.eVocabularyID[eVocabID]}`, LOG.LS.eTEST);
    const vocabObserved: DBAPI.Vocabulary | undefined = await VocabularyCache.mapPhotogrammetryVariantType(variantType);
    const vocabExpected: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    if (eVocabID != COMMON.eVocabularyID.eNone) {
        expect(vocabObserved).toBeTruthy();
        expect(vocabExpected).toBeTruthy();
    } else {
        expect(vocabObserved).toBeFalsy();
        expect(vocabExpected).toBeFalsy();
    }
    expect(vocabObserved).toEqual(vocabExpected);
}

async function testMapModelFileByExtension(modelExtension: string, eVocabID: COMMON.eVocabularyID): Promise<void> {
    // LOG.info(`Testing ${variantType}; expecting ${COMMON.eVocabularyID[eVocabID]}`, LOG.LS.eTEST);
    const vocabObserved: DBAPI.Vocabulary | undefined = await VocabularyCache.mapModelFileByExtension(modelExtension);
    const vocabExpected: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    if (eVocabID != COMMON.eVocabularyID.eNone) {
        expect(vocabObserved).toBeTruthy();
        expect(vocabExpected).toBeTruthy();
    } else {
        expect(vocabObserved).toBeFalsy();
        expect(vocabExpected).toBeFalsy();
    }
    expect(vocabObserved).toEqual(vocabExpected);
}

async function testMapModelChannelMaterialType(materialType: string, eVocabID: COMMON.eVocabularyID): Promise<void> {
    // LOG.info(`Testing ${variantType}; expecting ${COMMON.eVocabularyID[eVocabID]}`, LOG.LS.eTEST);
    const vocabObserved: DBAPI.Vocabulary | undefined = await VocabularyCache.mapModelChannelMaterialType(materialType);
    const vocabExpected: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    if (eVocabID != COMMON.eVocabularyID.eNone) {
        expect(vocabObserved).toBeTruthy();
        expect(vocabExpected).toBeTruthy();
    } else {
        expect(vocabObserved).toBeFalsy();
        expect(vocabExpected).toBeFalsy();
    }
    expect(vocabObserved).toEqual(vocabExpected);
}

async function testIsPreferredAsset(eVocabID: COMMON.eVocabularyID, eObjectType: COMMON.eSystemObjectType): Promise<void> {
    const vocabulary: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(eVocabID);
    expect(vocabulary).toBeTruthy();

    if (!vocabulary)
        return;

    let expectFailure: boolean = false;
    let SOMatch: DBAPI.SystemObject;
    const SONonMatch: DBAPI.SystemObject = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false });
    switch (eObjectType) {
        case COMMON.eSystemObjectType.eCaptureData:          SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 1, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eModel:                SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 1, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eScene:                SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 1, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eProjectDocumentation: SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 1, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eIntermediaryFile:     SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 1, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;

        case COMMON.eSystemObjectType.eActor:                SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 1, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eAsset:                SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 1, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eAssetVersion:         SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 1, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eItem:                 SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 1, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eProject:              SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 1, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eStakeholder:          SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 1, Retired: false }); break;
        case COMMON.eSystemObjectType.eSubject:              SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 0, idProject: 0, idSubject: 1, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eUnit:                 SOMatch = new DBAPI.SystemObject({ idSystemObject: 0, idUnit: 1, idProject: 0, idSubject: 0, idItem: 0, idCaptureData: 0, idModel: 0, idScene: 0, idIntermediaryFile: 0, idAsset: 0, idAssetVersion: 0, idProjectDocumentation: 0, idActor: 0, idStakeholder: 0, Retired: false }); break;
        case COMMON.eSystemObjectType.eUnknown:              SOMatch = SONonMatch; expectFailure = true; break;

        default:
            expect(false).toBeTruthy();
            return;
    }

    const match: boolean = await VocabularyCache.isPreferredAsset(vocabulary.idVocabulary, SOMatch);
    const nonMatch: boolean = await VocabularyCache.isPreferredAsset(vocabulary.idVocabulary, SONonMatch);
    if (!expectFailure) {
        if (!match)
            LOG.error(`testIsPreferredAsset(${COMMON.eVocabularyID[eVocabID]}, ${COMMON.eSystemObjectType[eObjectType]}): ${JSON.stringify(vocabulary)} FAILED`, LOG.LS.eTEST);
        // else
        //     LOG.info(`testIsPreferredAsset(${COMMON.eVocabularyID[eVocabID]}, ${COMMON.eSystemObjectType[eObjectType]}): ${JSON.stringify(vocabulary)} Success`, LOG.LS.eTEST);
        expect(match).toBeTruthy();
    } else
        expect(match).toBeFalsy();

    expect(nonMatch).toBeFalsy();
}

export default vocabularyCacheTest;
