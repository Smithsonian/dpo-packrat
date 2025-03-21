/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import * as path from 'path';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as STORE from '../../../storage/interface';
import { Config } from '../../../config';

// import * as COMMON from '@dpo-packrat/common';
// import * as COL from '../../../collections/interface';
// import { ASL, LocalStore } from '../../../utils/localStore';

// import { eEventKey } from '../../../event/interface/EventEnums';
// import { AuditFactory } from '../../../audit/interface/AuditFactory';
// import { isAuthenticated } from '../../auth';

import { Request, Response } from 'express';

enum ReportType {
    ASSET_FILE = 'asset_file',
    SCENE_STATUS = 'scene_status',
}

type ReportResponse = {
    guid: string,
    state: H.ProcessState,
    type: ReportType,
    user: { id: number, name: string, email: string },
    report: any,
};
type AssetParent = {
    type: 'undefined' | 'scene' | 'model' | 'capture_data' | 'unsupported',
    idSystemObject: number,
};
type AssetSummary = {
    error: { process: string, message: string }[],
    asset: DBAPI.Asset,
    versions: DBAPI.AssetVersion[],
    context: {
        unit: DBAPI.Unit[] | null,
        project: DBAPI.Project[] | null,
        subject: DBAPI.Subject[] | null,
        item: DBAPI.Item[] | null,
    },
    parent: AssetParent | null,
};

type AnalysisAssetSummary = {
    id: number,
    rootPath: string,
    fileName: string,
    storageKey: string,
    type: string,
    versions: AnalysisAssetVersionSummary[],
    context: AssetAnalysisContextSummary,
    parent: AssetParent,
    validation: {
        storageTest: H.OpResult | null,
    }
};
type AnalysisAssetVersionSummary = {
    dateCreated: Date,
    filePath: string,
    fileSize: number,
    version: number,
    creator: {
        id: number,
        name: string,
        email: string
    },
    ingested: boolean,
    validation: {
        fileExists: H.OpResult | null,
        sizeMatches: H.OpResult | null,
    }
};
type AssetAnalysisContextSummary = {
    unit: DBAPI.DBReference[] | null,
    project: DBAPI.DBReference[] | null,
    subject: DBAPI.DBReference[] | null,
    mediaGroup: DBAPI.DBReference[] | null,
};
type AnalysisAssetResult = {
    status: H.ProcessStatus,
    error: string[],
    asset: AnalysisAssetSummary,
};

const generateResponse = (success: boolean, message: string, guid: string, state: H.ProcessState, report?: any): H.OpResult => {

    const result: ReportResponse = {
        guid,
        state,
        user: { id: -1, name: 'N/A', email: 'N/A' },
        type: ReportType.ASSET_FILE,
        report
    };

    return {
        success,
        message,
        data: result,
    };
};
const formatAnalysisForCSV = (report: AnalysisAssetResult[]): string => {
    // Helper function to format date to a string or default 'N/A'
    const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : 'N/A';

    // Helper function to handle null or undefined values and return 'N/A' as default
    const handleNull = (value) => value != null ? value : 'N/A';

    // Helper function for cleaning strings for CSV export
    const sanitizeForCSV = (value: string): string => {
        if (typeof value !== 'string') return '';

        // Escape double quotes by doubling them
        const escapedValue = value.replace(/"/g, '""');

        // If the value contains a comma, double quote, newline, or carriage return, wrap it in quotes
        if (/[",\n\r]/.test(escapedValue)) {
            return `"${escapedValue}"`;
        }

        return escapedValue;
    };

    // Create CSV headers (clean names)
    const headers = [
        'ID',
        'File Name',
        'File Size',
        'Type',
        'Versions',
        'Date Created',
        'Creator',
        'Ingested',
        'Storage Test',
        'File Exists',
        'Size Match',
        'Storage Key',
        'Unit',
        'Project',
        'Subject',
        'MediaGroup',
        'Parent Type',
        'Parent ID',
    ];

    // Build CSV rows
    const rows: string[] = [];
    for (const summary of report) {

        // build up our lists of units, subjects, projects, etc.
        const units: string = !summary.asset.context.unit ? 'NA' : summary.asset.context.unit?.map(s=>s.name).join(', ');
        const projects: string = !summary.asset.context.project ? 'NA' : summary.asset.context.project?.map(s=>s.name).join(', ');
        const subjects: string = !summary.asset.context.subject ? 'NA' : summary.asset.context.subject?.map(s=>s.name).join(', ');
        const mediaGroups: string = !summary.asset.context.mediaGroup ? 'NA' : summary.asset.context.mediaGroup?.map(s=>s.name).join(', ');

        for (const version of summary.asset.versions) {
            // Initialize a new row inside the loop to ensure each version is separate
            const row: string[] = [
                handleNull(summary.asset.id),
                sanitizeForCSV(summary.asset.fileName),
                handleNull(version.fileSize),
                sanitizeForCSV(summary.asset.type),
                handleNull(summary.asset.versions.length),
                handleNull(formatDate(version.dateCreated)),
                sanitizeForCSV(version.creator.name),
                handleNull(version.ingested),
                handleNull(summary.asset.validation.storageTest?.success),
                handleNull(version.validation.fileExists?.success),
                handleNull(version.validation.sizeMatches?.success),
                sanitizeForCSV(summary.asset.storageKey),
                sanitizeForCSV(units),
                sanitizeForCSV(projects),
                sanitizeForCSV(subjects),
                sanitizeForCSV(mediaGroups),
                sanitizeForCSV(summary.asset.parent.type),
                handleNull(summary.asset.parent.idSystemObject),
            ];

            rows.push(row.join(','));
        }
    }

    // Combine headers and rows into CSV format
    const csvContent = [headers.join(','), ...rows].join('\r\n');
    return csvContent;
};

const getAssetContext = async (summary: AssetSummary): Promise<{
    units: DBAPI.Unit[] | null,
    projects: DBAPI.Project[] | null,
    subjects: DBAPI.Subject[] | null,
    items: DBAPI.Item[] | null,
    parent: AssetParent | null
}> => {

    // set our defaults
    let units: DBAPI.Unit[] | null = null;
    let projects: DBAPI.Project[] | null = null;
    let subjects: DBAPI.Subject[] | null = null;
    let items: DBAPI.Item[] | null = null;
    const parent: AssetParent = { type: 'undefined', idSystemObject: -1 };

    // get asset's source system object (i.e. what the asset belongs to)
    const sourceSO: DBAPI.SystemObject | null = await summary.asset.fetchSourceSystemObject();
    if(!sourceSO) {
        LOG.info(`API.report.getAssetContext: cannot get context. no source SystemObject. likely floating asset. (${summary.asset.idAsset}:${summary.asset.FileName})`,LOG.LS.eHTTP);
        return { units, projects, subjects, items, parent };
    }
    parent.idSystemObject = sourceSO.idSystemObject;

    // get all SystemObjects that have the asset's source as a child
    // this will allow us to confirm the type of asset we are working with
    // since Model's currently use multiple AssetTypes including generic 'Other'
    // NOTE: still press on even if asset type mismatch, but throw error
    // TODO: use vocabulary enums. currently they map to different values (e.g. Scene = 53 and not 137)
    if(sourceSO.idScene) {
        if(summary.asset.idVAssetType!==137)
            LOG.error(`API.report.getAssetContext: asset type mismatch (scene | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'scene';
    } else if(sourceSO.idModel) {
        if(summary.asset.idVAssetType!==135 && summary.asset.idVAssetType!==136 && summary.asset.idVAssetType!==141)
            LOG.error(`API.report.getAssetContext: asset type mismatch (model | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'model';
    } else if(sourceSO.idCaptureData) {
        if(summary.asset.idVAssetType!==133)
            LOG.error(`API.report.getAssetContext: asset type mismatch (capture data | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'capture_data';
    } else {
        LOG.error(`API.report.getAssetContext: unsupported asset type (${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'unsupported';
        return { units, projects, subjects, items, parent };
    }

    // get any master Items
    items = await DBAPI.Item.fetchMasterFromSystemObject(sourceSO.idSystemObject);
    if(!items || items.length===0) {
        // all other context is null since we have no way to get to it
        LOG.error(`API.report.getAssetContext: no MediaGroup found for asset (${summary.asset.idAsset}:${summary.asset.FileName} | source: ${summary.asset.idSystemObject})`,LOG.LS.eHTTP);
        return { units, projects, subjects, items, parent };
    }

    // get subject
    const itemIDs: number[] = items.map(mg=>mg.idItem);
    subjects = await DBAPI.Subject.fetchMasterFromItems(itemIDs);
    if(!subjects || subjects.length===0)
        LOG.error(`API.report.getAssetContext: no Subject found for asset (idAsset: ${summary.asset.idAsset} | idItem: ${itemIDs.join(', ')})`,LOG.LS.eHTTP);

    // projects
    projects = await DBAPI.Project.fetchMasterFromItems(itemIDs);
    if(!projects || projects.length===0)
        LOG.error(`API.report.getAssetContext: no Projects found for asset (idAsset: ${summary.asset.idAsset} | idItem: ${itemIDs.join(', ')})`,LOG.LS.eHTTP);
    else
        summary.context.project = projects;

    // get unit
    if(subjects) {
        units = [];
        for (const sub of subjects) {
            const unit = await DBAPI.Unit.fetch(sub.idUnit);
            if(unit) units.push(unit);
        }
    }

    return { units, projects, subjects, items, parent };
};
const getAssetSummary = async (idAssets: number[] = []): Promise<AssetSummary[] | null> => {

    // collect all needed data for analysis and output

    // get all of our assets in the database
    let assets: DBAPI.Asset[] | null = null;
    if(idAssets.length===0) {
        assets = await DBAPI.Asset.fetchAll();
        if(!assets || assets.length===0) {
            LOG.error('API.getAssetSummary: no assets found', LOG.LS.eHTTP);
            return null;
        }
    } else {
        LOG.info(`API.getAssetSummary: not supporting specific idAsset queries yet (${idAssets.join(', ')})`,LOG.LS.eDEBUG);
        return null;
    }

    // cycle through assets getting our versions, context, and relationships
    // goal is to collect as much as possible logging what aspects failed
    const result: AssetSummary[] | null = [];
    for(let i=0; i<assets.length; i++) {
        const summary: AssetSummary = {
            error: [],
            asset: assets[i],
            versions: [],
            context: {
                unit: null,
                project: null,
                subject: null,
                item: null,
            },
            parent: null
        };

        // get our version(s)
        summary.versions = await DBAPI.AssetVersion.fetchFromAsset(summary.asset.idAsset) ?? [];
        if(!summary.versions || summary.versions.length===0) {
            LOG.error(`API.getAssetSummary: no asset versions found for: ${summary.asset.idAsset}`,LOG.LS.eHTTP);
            summary.error.push({ process: 'versions', message: 'no asset versions found' });
        }

        // get our context (unit, subject, media group)
        const { units, projects, subjects, items, parent } = await getAssetContext(summary);
        summary.context.unit = units;
        summary.context.project = projects;
        summary.context.subject = subjects;
        summary.context.item = items;
        summary.parent = parent;

        // store in our results
        result.push(summary);
    }
    return result;
};

const getAssetAnalysis = async (summary: AssetSummary): Promise<AnalysisAssetResult | null> => {

    const analyzeAssetTypes = [
        133,    // capture data file
        135,    // geometry file
        136,    // texture file
        137,    // scene svx file
        141,    // other: material file
    ];

    // get our system object for the asset
    const assetSO: DBAPI.SystemObject | null = await summary.asset.fetchSystemObject();
    if(!assetSO) {
        LOG.error(`API.report.getAssetAnalysis: cannot analyze asset. no SystemObject (${summary.asset.idAsset})`,LOG.LS.eHTTP);
        return null;
    }

    const result: AnalysisAssetResult = {
        // general status
        status: (summary.error.length > 0) ? H.ProcessStatus.ERROR : H.ProcessStatus.GOOD,
        error: (summary.error.length > 0) ? summary.error.map(item => `${item.process}:${item.message}`) : [],
        // asset info
        asset: {
            id: assetSO.idSystemObject,
            fileName: summary.asset.FileName,
            rootPath: '',
            storageKey: summary.asset.StorageKey ?? '',
            type: '',
            versions: [],
            parent: { type: 'undefined', idSystemObject: -1 },
            context: { unit: null, subject: null, project: null, mediaGroup: null },
            validation: {
                storageTest: null,
            }
        },
    };

    // get our type and check
    const assetType: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(summary.asset.idVAssetType);
    const needsFile: boolean = analyzeAssetTypes.includes(summary.asset.idVAssetType);
    result.asset.type = assetType?.Term ?? `Unsupported: ${summary.asset.idVAssetType}`;

    // grab an instance of our storage factory for OCFL tests/checks
    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance();
    if(!storage) {
        LOG.error('API.report.getAssetAnalysis cannot get storage interface',LOG.LS.eHTTP);
        return null;
    }

    // if we don't need a file then we're likely residual staging data
    // so don't check for file integrity. (e.g. zip package reference)
    if(needsFile===true && !!summary.asset.StorageKey?.length) {

        // get our actual path on the repository
        result.asset.rootPath = await storage.repositoryFileName(summary.asset.StorageKey);

        // Storage factory validation (compares files/paths)
        const storageValidationResult: STORE.ValidateAssetResult = await storage.validateAsset(summary.asset.StorageKey);
        result.asset.validation.storageTest = {
            success: storageValidationResult.success,
            message: storageValidationResult.success ? '' : storageValidationResult.error ?? 'undefined'
        };

        // build our contexts
        result.asset.context.unit = (!summary.context.unit) ? null : summary.context.unit.map(u => {
            // TODO: get system object ids
            return { id: u.idUnit, name: u.Name };
        });
        result.asset.context.project = (!summary.context.project) ? null : summary.context.project.map(p => {
            // TODO: get system object ids
            return { id: p.idProject, name: p.Name };
        });
        result.asset.context.subject = (!summary.context.subject) ? null : summary.context.subject.map(s => {
            // TODO: get system object ids
            return { id: s.idSubject, name: s.Name };
        });
        result.asset.context.mediaGroup = (!summary.context.item) ? null : summary.context.item.map(i => {
            // TODO: get system object ids
            return { id: i.idItem, name: i.Name };
        });

        if(summary.parent)
            result.asset.parent = summary.parent;

        // cycle through versions getting each from disk, checking size, etc.
        // TODO: hash for comparison
        for(let i=0; i<summary.versions.length; i++) {
            const version: DBAPI.AssetVersion = summary.versions[i];

            // get user/creator info
            const user: DBAPI.User | null = await DBAPI.User.fetch(version.idUserCreator);

            const versionResult: AnalysisAssetVersionSummary = {
                dateCreated: version.DateCreated,
                filePath: '',
                fileSize: Number(version.StorageSize),
                ingested: version.Ingested ?? false,
                creator: {
                    id: user?.idUser ?? -1,
                    name: user?.Name ?? '',
                    email: user?.EmailAddress ?? ''
                },
                version: version.Version,
                validation: {
                    fileExists: null,
                    sizeMatches: null,
                }
            };

            // build path
            versionResult.filePath = await storage.repositoryFileName(result.asset.storageKey,version.Version);
            const filePath: string = path.join(versionResult.filePath,version.FileName);

            // does it exist on disk
            const existsResult: H.IOResults = await H.Helpers.fileOrDirExists(filePath);
            versionResult.validation.fileExists = {
                success: existsResult.success,
                message: existsResult.success ? '' : existsResult.error ?? 'undefined'
            };

            // get our stats on the file
            if(existsResult.success===true) {

                const fileStats: H.StatResults = await H.Helpers.stat(filePath);
                if(fileStats.success===false || !fileStats.stat) {
                    LOG.error(`cannot get stats for file: ${filePath}`,LOG.LS.eHTTP);
                    versionResult.validation.sizeMatches = {
                        success: false,
                        message: fileStats.success ? '' : fileStats.error ?? 'undefined'
                    };
                } else {
                    const sizeDiff: number = fileStats.stat.size-versionResult.fileSize;
                    versionResult.validation.sizeMatches = {
                        success: sizeDiff===0,
                        message: existsResult.success ? '' : `file_size:size mismatch (disk: ${fileStats.stat.size}, db: ${versionResult.fileSize})`
                    };
                }

                // TODO: store additional properties about file
                // - mode: File mode (permissions)
                // - uid/gid: user/group owner
                // - atime: last time accessed
                // - mtime: last time modified
            }

            // TODO: hash comparison
            // versionResult.validation.hashMatches = false;

            result.asset.versions.push(versionResult);
        }
    }

    // console.log('result: ',result);
    return result;
};
const processAssetsWithLimit = async (assets: AssetSummary[]): Promise<{ report: AnalysisAssetResult[], hasError: boolean }> => {
    const BATCH_SIZE = 5;
    let hasError = false;
    const report: AnalysisAssetResult[] = [];
    let currentIndex = 0;

    // Generator to yield batches of assets
    async function* batchGenerator() {
        for (let i = 0; i < assets.length; i += BATCH_SIZE) {
            yield assets.slice(i, i + BATCH_SIZE);
        }
    }

    for await (const batch of batchGenerator()) {
        LOG.info(`API.report.processAssetWithLimit: Processing batch (${batch.length} items)`,LOG.LS.eDEBUG);

        const results = await Promise.all(
            batch.map(async (asset) => {
                LOG.info(`[${currentIndex}/${assets.length}] API.report.processAssetWithLimit: analyzing asset (${asset.asset.FileName})`,LOG.LS.eDEBUG);
                currentIndex++;
                try {
                    const validationResult = await getAssetAnalysis(asset);
                    if (!validationResult) {
                        LOG.error(`Error validating asset: (${asset.asset.idAsset}:${asset.asset.FileName})`, LOG.LS.eHTTP);
                        hasError = true;
                        return null;
                    }
                    return validationResult;
                } catch (error) {
                    LOG.error(`Unexpected error validating asset: (${asset.asset.idAsset}:${asset.asset.FileName}) - ${error}`, LOG.LS.eHTTP);
                    hasError = true;
                    return null;
                }
            })
        );

        report.push(...results.filter((result): result is AnalysisAssetResult => result !== null));
    }

    return { report, hasError };
};

export async function reportAssetFiles(_req: Request, res: Response): Promise<void> {

    const startTime = Date.now();

    // make sure we're authenticated (i.e. see if request has a 'user' object)
    // if (!isAuthenticated(req)) {
    //     AuditFactory.audit({ url: req.path, auth: false }, { eObjectType: 0, idObject: 0 }, eEventKey.eGenDownloads);
    //     LOG.error('API.generateDownloads failed. not authenticated.', LOG.LS.eHTTP);
    //     res.status(403).send('no authenticated');
    //     return;
    // }

    // get our LocalStore. If we don't have one then bail. it is needed for the user id, auditing, and workflows
    // const LS: LocalStore | undefined = ASL.getStore();
    // if(!LS || !LS.idUser){
    //     LOG.error('API.generateDownloads failed. cannot get LocalStore or idUser',LOG.LS.eHTTP);
    //     res.status(200).send(JSON.stringify(generateResponse(false,'missing store/user')));
    //     return;
    // }

    const guid: string = H.Helpers.generateGUID();

    // get data about each of our assets in the system
    const assets: AssetSummary[] | null = await getAssetSummary();
    if(!assets || assets.length===0) {
        LOG.error('API.reportAssetFiles: cannot get assets from system',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false, 'cannot get assets from system', guid, H.ProcessState.FAILED)));
        return;
    }
    const { report, hasError } = await processAssetsWithLimit(assets);

    // format for CSV
    const csvContent: string = formatAnalysisForCSV(report);

    // final output
    const result: ReportResponse = {
        guid,
        state: (hasError===true) ? H.ProcessState.FAILED : H.ProcessState.COMPLETED,
        user: { id: -1, name: 'N/A', email: 'N/A' },
        type: ReportType.ASSET_FILE,
        report: '', //csvContent
    };

    // store result to temp location
    const tempReportFilePath = path.join(Config.storage.rootStaging,'reports');
    const reportFileName = `report_asset_files_${(new Date).toISOString().split('T')[0]}`;
    H.Helpers.createDirectory(tempReportFilePath);
    const fullPath = path.join(tempReportFilePath,reportFileName+'.csv');
    fs.writeFileSync(fullPath, csvContent, 'utf-8');
    fs.writeFileSync(tempReportFilePath+'/'+reportFileName+'.json',JSON.stringify(report), 'utf-8');

    LOG.info(`API.reportAssetFiles: validated ${assets.length} assets in ${(Date.now()-startTime)/1000}s`,LOG.LS.eDEBUG);
    LOG.info(`API.reportAssetFiles: CSV file written successfully (${fullPath})`,LOG.LS.eDEBUG);

    // create our combined response and return info to client
    result.report = `validated ${assets.length} assets in ${(Date.now()-startTime)/1000}s (${tempReportFilePath})`;
    res.status(200).send(JSON.stringify({ success: true, message: 'report generated successfully', data: result }));
}
