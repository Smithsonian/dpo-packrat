/**
 * Minimal DICOM tag reader for volumetric inspection.
 *
 * Reads a small fixed set of tags from a single DICOM instance file on disk
 * via `dicom-parser`. Used to pre-fill the volumetric ingestion form.
 *
 * Current limitations:
 *   - First instance only; no DICOMDIR traversal beyond detecting existence.
 *   - No multi-series handling.
 *   - Compressed transfer syntaxes work only to the extent that dicom-parser
 *     supports them out of the box (implicit/explicit VR LE/BE are fine;
 *     JPEG-compressed pixel data is irrelevant since we don't read pixels).
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import dicomParser from 'dicom-parser';
import { RecordKeeper as RK } from '../../../../records/recordKeeper';

export interface DicomInspectResult {
    rows?: number;                    // (0028,0010)
    columns?: number;                 // (0028,0011)
    bitsAllocated?: number;           // (0028,0100)
    pixelSpacingRow?: number;         // (0028,0030)[0]
    pixelSpacingColumn?: number;      // (0028,0030)[1]
    sliceThicknessMM?: number;        // (0018,0050)
    voltageKV?: number;               // (0018,0060)
    tubeCurrentMA?: number;           // (0018,1151) — milliamps
    manufacturer?: string;            // (0008,0070)
    manufacturerModelName?: string;   // (0008,1090)
    warnings: string[];
}

export class DicomInspector {
    /** Parse a single DICOM file from disk and return the tags we care about. */
    static async inspectFile(filePath: string): Promise<DicomInspectResult> {
        const result: DicomInspectResult = { warnings: [] };
        let buffer: Buffer;
        try {
            buffer = await fs.readFile(filePath);
        } catch (err) {
            result.warnings.push(`Failed to read DICOM file: ${err instanceof Error ? err.message : String(err)}`);
            return result;
        }

        let dataSet;
        try {
            dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
        } catch (err) {
            result.warnings.push(`Failed to parse DICOM: ${err instanceof Error ? err.message : String(err)}`);
            return result;
        }

        result.rows = dataSet.uint16('x00280010');
        result.columns = dataSet.uint16('x00280011');
        result.bitsAllocated = dataSet.uint16('x00280100');

        // PixelSpacing is multi-valued DS — typically "row\column".
        const ps0: number | undefined = dataSet.floatString('x00280030', 0);
        const ps1: number | undefined = dataSet.floatString('x00280030', 1);
        if (ps0 !== undefined) result.pixelSpacingRow = ps0;
        if (ps1 !== undefined) result.pixelSpacingColumn = ps1;

        const sliceTh: number | undefined = dataSet.floatString('x00180050');
        if (sliceTh !== undefined) result.sliceThicknessMM = sliceTh;

        const kvp: number | undefined = dataSet.floatString('x00180060');
        if (kvp !== undefined) result.voltageKV = kvp;

        const tubeCurrent: number | undefined = dataSet.intString('x00181151');
        if (tubeCurrent !== undefined) result.tubeCurrentMA = tubeCurrent;

        const mfg: string | undefined = dataSet.string('x00080070');
        if (mfg) result.manufacturer = mfg.trim();
        const model: string | undefined = dataSet.string('x00081090');
        if (model) result.manufacturerModelName = model.trim();

        // Structured warning when expected tags are missing. Indexed fields (manufacturer,
        // model, transferSyntaxUID) let OpenObserve aggregate by scanner variant so we
        // can spot patterns like "all uploads from Make X version Y miss PixelSpacing."
        const missing: string[] = [];
        if (result.rows === undefined) missing.push('Rows');
        if (result.columns === undefined) missing.push('Columns');
        if (result.bitsAllocated === undefined) missing.push('BitsAllocated');
        if (result.pixelSpacingRow === undefined && result.pixelSpacingColumn === undefined) missing.push('PixelSpacing');
        if (result.sliceThicknessMM === undefined) missing.push('SliceThickness');
        if (result.voltageKV === undefined) missing.push('KVP');
        if (result.tubeCurrentMA === undefined) missing.push('XRayTubeCurrent');
        if (result.manufacturer === undefined) missing.push('Manufacturer');
        if (result.manufacturerModelName === undefined) missing.push('ManufacturerModelName');

        if (missing.length > 0) {
            const transferSyntaxUID: string | undefined = dataSet.string('x00020010');
            RK.logWarning(RK.LogSection.eJOB, 'dicom parse incomplete',
                `missing ${missing.length}/9 expected tags: ${missing.join(',')}`,
                {
                    fileName: path.basename(filePath),
                    manufacturer: result.manufacturer ?? null,
                    manufacturerModelName: result.manufacturerModelName ?? null,
                    transferSyntaxUID: transferSyntaxUID ?? null,
                    missing,
                },
                'Job.VolumeInspect.DICOM');
        }

        return result;
    }
}
