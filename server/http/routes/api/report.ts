/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import readline from 'readline';
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

//#region TYPES & ENUM
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
        hashMatch: H.OpResult | null,
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
// #endregion

//#region UTILS
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
//#endregion

//#region ASSET ANALYSIS
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
            LOG.error(`API.report.getAssetContext: asset type mismatch (scene: ${sourceSO.idSystemObject} | ${summary.asset.idSystemObject} | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'scene';
    } else if(sourceSO.idModel) {
        if(summary.asset.idVAssetType!==135 && summary.asset.idVAssetType!==136 && summary.asset.idVAssetType!==141)
            LOG.error(`API.report.getAssetContext: asset type mismatch (model: ${sourceSO.idSystemObject} | ${summary.asset.idSystemObject} | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'model';
    } else if(sourceSO.idCaptureData) {
        if(summary.asset.idVAssetType!==133)
            LOG.error(`API.report.getAssetContext: asset type mismatch (capture data: ${sourceSO.idSystemObject} | ${summary.asset.idSystemObject} | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
        parent.type = 'capture_data';
    } else {
        LOG.error(`API.report.getAssetContext: unsupported asset type (${sourceSO.idSystemObject} | ${summary.asset.idSystemObject} | ${summary.asset.idVAssetType})`,LOG.LS.eHTTP);
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
const getAssetSummary = async (idAssets: number[] = [], basePath: string): Promise<number> => {

    // collect all needed data for analysis and output

    // get all of our assets in the database
    let assets: DBAPI.Asset[] | null = null;
    if(idAssets.length===0) {
        assets = await DBAPI.Asset.fetchAll();
        if(!assets || assets.length===0) {
            LOG.error('API.getAssetSummary: no assets found', LOG.LS.eHTTP);
            return -1;
        }
    } else {
        LOG.info(`API.getAssetSummary: not supporting specific idAsset queries yet (${idAssets.join(', ')})`,LOG.LS.eDEBUG);
        return -1;
    }

    // our full path for storing the results and open stream
    const writeStream = fs.createWriteStream(basePath + '.assets', { flags: 'a' });

    // cycle through assets getting our versions, context, and relationships
    // goal is to collect as much as possible logging what aspects failed
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
        writeStream.write(JSON.stringify(summary) + '\n');
    }

    // cleanup and return number of assets
    writeStream.end();
    return assets.length;
};
const getAssetAnalysis = async (summary: any): Promise<AnalysisAssetResult | null> => {

    const analyzeAssetTypes = [
        133,    // capture data file
        135,    // geometry file
        136,    // texture file
        137,    // scene svx file
        141,    // other: material file
    ];

    // get our system object for the asset
    const assetSO: DBAPI.SystemObject | null = await DBAPI.SystemObject.fetchFromAssetID(summary.asset.idAsset);
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
                hashMatch: null,
            }
        },
    };

    // get our type and check
    const assetType: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(summary.asset.idVAssetType);
    const needsFile: boolean = analyzeAssetTypes.includes(summary.asset.idVAssetType);
    result.asset.type = assetType?.Term ?? `Unsupported: ${summary.asset.idVAssetType}`;

    // // grab an instance of our storage factory for OCFL tests/checks
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
        result.asset.validation.hashMatch = {
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

    return result;
};
const processAssetAnalysis = async (basePath: string, totalAssets: number): Promise<boolean> => {

    LOG.info(`API.report: processing ${totalAssets} assets`,LOG.LS.eHTTP);

    // make sure we have our assets file
    let fileCheck = await H.Helpers.fileOrDirExists(basePath+'.assets');
    if(fileCheck.success===false) {
        LOG.error(`processAssetAnalysis: assets file does not exist. (${basePath+'.assets'})`,LOG.LS.eHTTP);
        return false;
    }

    // see if we already have json/csv files and delete them
    fileCheck = await H.Helpers.fileOrDirExists(basePath+'.json');
    if(fileCheck.success===true)
        fs.unlinkSync(basePath+'.json');
    fileCheck = await H.Helpers.fileOrDirExists(basePath+'.csv');
    if(fileCheck.success===true)
        fs.unlinkSync(basePath+'.csv');

    // open a stream and set it up to read the assets data line by line
    const sourceStream = fs.createReadStream(basePath+'.assets', { encoding: 'utf-8' });
    const rl = readline.createInterface({
        input: sourceStream,
        crlfDelay: Infinity, // handles \r\n and \n
    });

    // set up write stream for JSON output of asset's analysis
    const jsonStream = fs.createWriteStream(basePath + '.json', { flags: 'a' });
    jsonStream.write('{ "assets": [\n');

    // setup write stream for CSV output of asset's analysis
    // and write out headers
    const csvStream = fs.createWriteStream(basePath + '.csv', { flags: 'a' });
    csvStream.write([
        'ID',
        'File Name',
        'File Size',
        'Type',
        'Versions',
        'Date Created',
        'Creator',
        'Ingested',
        'Hash Match',
        'File Exists',
        'Size Match',
        'Storage Key',
        'Unit',
        'Project',
        'Subject',
        'MediaGroup',
        'Parent Type',
        'Parent ID',
    ].join(',')+'\r\n');

    // cycle through line parsing each and then processing them
    let index: number = 0;
    let startTime: number = Date.now();
    for await (const line of rl) {
        if (!line.trim()) continue; // skip empty lines
        try {
            startTime = Date.now();
            const obj = JSON.parse(line);
            const result: AnalysisAssetResult | null = await getAssetAnalysis(obj);
            if(!result) {
                LOG.error(`[${index++}/${totalAssets}] API.report: Failed to analyze asset: ${obj.asset.idAsset}`,LOG.LS.eHTTP);
                continue;
            }

            // write to json report file
            jsonStream.write(JSON.stringify(result)+',\n');

            // format for CSV output and write out
            const csvRow: string  | null = formatAssetAnalysisForCSV(result);
            if(csvRow)
                csvStream.write(csvRow);

            // status output
            LOG.info(`[${index}/${totalAssets}] API.report: processed asset analysis (${(Date.now()-startTime)/1000}s)`,LOG.LS.eDEBUG);
            index++;
        } catch (err) {
            LOG.error('API.report: Error parsing asset line',LOG.LS.eHTTP,err);
        }
    }

    // cleanup streams and temp files
    sourceStream.close();
    fs.unlinkSync(basePath+'.assets');
    jsonStream.write(']}');
    jsonStream.end();
    csvStream.end();

    return true;
};
const formatAssetAnalysisForCSV = (summary: AnalysisAssetResult): string | null => {
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
        if (/[",\n\r]/.test(escapedValue))
            return `"${escapedValue}"`;

        return escapedValue;
    };

    // Reference: CSV headers
    // const headers = [
    //     'ID',
    //     'File Name',
    //     'File Size',
    //     'Type',
    //     'Versions',
    //     'Date Created',
    //     'Creator',
    //     'Ingested',
    //     'Hash Match',
    //     'File Exists',
    //     'Size Match',
    //     'Storage Key',
    //     'Unit',
    //     'Project',
    //     'Subject',
    //     'MediaGroup',
    //     'Parent Type',
    //     'Parent ID',
    // ];

    // Build CSV rows
    // build up our lists of units, subjects, projects, etc.
    const units: string = !summary.asset.context.unit ? 'NA' : summary.asset.context.unit?.map(s=>s.name).join(', ');
    const projects: string = !summary.asset.context.project ? 'NA' : summary.asset.context.project?.map(s=>s.name).join(', ');
    const subjects: string = !summary.asset.context.subject ? 'NA' : summary.asset.context.subject?.map(s=>s.name).join(', ');
    const mediaGroups: string = !summary.asset.context.mediaGroup ? 'NA' : summary.asset.context.mediaGroup?.map(s=>s.name).join(', ');

    const rows: string[] = [];
    for (const version of summary.asset.versions) {
        // Initialize a new row inside the loop to ensure each version is separate
        const row: string[] = [
            handleNull(summary.asset.id),
            sanitizeForCSV(summary.asset.fileName),
            handleNull(version.fileSize),
            sanitizeForCSV(summary.asset.type),
            handleNull(version.version),
            handleNull(formatDate(version.dateCreated)),
            sanitizeForCSV(version.creator.name),
            handleNull(version.ingested),
            handleNull(summary.asset.validation.hashMatch?.success),
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

        rows.push(row.join(',')+'\r\n');
    }

    // Combine rows into CSV format
    return (rows.length>0) ? rows.join('\r\n') : null;
};

async function reportAssetFiles(_req: Request, res: Response, basePath: string): Promise<void> {

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

    // get data about each of our assets in the system. empty arguments will
    // process all assets. results stored with 'assets' extension
    const assetsResult: number = await getAssetSummary([],basePath);
    if(assetsResult<=0) {
        LOG.error('API.reportAssetFiles: cannot get assets from system',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false, 'cannot get assets from system', guid, H.ProcessState.FAILED)));
        return;
    }

    // cycle through all assets and anlyze them writing to the final report
    const processResult: boolean = await processAssetAnalysis(basePath,assetsResult);

    // final output
    const result: ReportResponse = {
        guid,
        state: (processResult===true) ? H.ProcessState.FAILED : H.ProcessState.COMPLETED,
        user: { id: -1, name: 'N/A', email: 'N/A' },
        type: ReportType.ASSET_FILE,
        report: '', //csvContent
    };

    // log output messages
    LOG.info(`API.reportAssetFiles: validated ${assetsResult} assets in ${(Date.now()-startTime)/1000}s (${basePath})`,LOG.LS.eDEBUG);

    // create our combined response and return info to client
    result.report = `validated ${assetsResult} assets in ${(Date.now()-startTime)/1000}s (${basePath})`;
    res.status(200).send(JSON.stringify({ success: true, message: 'report generated successfully', data: result }));
}
//#endregion

//#region REPORTS
export async function createReport(req: Request, res: Response): Promise<void> {

    const reportType = req.params.type.toLocaleLowerCase();

    // figure out our paths
    const reportPath = path.join(Config.storage.rootStaging,'reports');
    const reportFileName = `report_asset-files_${(new Date).toISOString().split('T')[0]}`;
    const basePath = path.join(reportPath,reportFileName);
    H.Helpers.createDirectory(basePath);

    // handle the report type
    switch(reportType) {
        case 'asset-files': {
            return await reportAssetFiles(req,res,basePath);
        }

        default: {
            const error = `API.report.createReport: unsupported report type (${req.params.type})`;
            LOG.error(`API.report.createReport: ${error}`,LOG.LS.eHTTP);
            res.status(200).send(JSON.stringify({ success: false, message: error }));
            return;
        }
    }
}
export async function getReportList(req: Request, res: Response): Promise<void> {

    try {
        const reportType = req.params.type;
        const reportsDir = path.join(Config.storage.rootStaging, 'reports');

        // Use the promise-based version of fs.readdir to await the file list.
        const files = await fs.promises.readdir(reportsDir);

        // Build a regex to match filenames in the format:
        // report_<type>_<YYYY-MM-DD>.<extension>
        // where extension is csv or json.
        const regex = new RegExp(`^report_${reportType}_(\\d{4}-\\d{2}-\\d{2})\\.(csv|json)$`);

        const reports = files.reduce((acc: any[], file: string) => {
            const match = file.match(regex);
            if (match) {
                const date = match[1];
                const format = match[2];

                // Create a filename without the extension.
                const filenameWithoutExtension = `report_${reportType}_${date}`;
                acc.push({ fileName: filenameWithoutExtension, format, date });
            }
            return acc;
        }, []);

        res.status(200).json({
            success: true,
            message: 'report list generated',
            data: { type: reportType, reports }
        });
    } catch (err) {
        LOG.error('API.report.getReportList: error reading reports directory.', LOG.LS.eHTTP, err);
        res.status(500).json({ success: false, message: 'Error reading reports directory' });
    }
}
export async function getReportFile(req: Request, res: Response): Promise<void> {

    // return a specific report of given type. returns 404 if not available.
    // intended to be used with getReportList() to see what is available.
    //
    // api/report/<type>/<date>/<format>
    //
    // type = 'asset-files'
    // date = YYYY-MM-DD (ex. 2025-03-20)
    // format = csv | json

    try {
        // Extract parameters from URL: type, date, and format.
        const reportType = req.params.type; // No conversion; e.g., 'asset-files'
        const date = req.params.date;
        const format = req.params.format.toLowerCase();

        // Construct the filename using the format: report_<type>_<date>.<extension>
        const filename = `report_${reportType}_${date}.${format}`;

        // Build the full path to the report file.
        const filePath = path.join(Config.storage.rootStaging, 'reports', filename);

        // Verify that the file exists.
        await fs.promises.access(filePath, fs.constants.F_OK);

        // Check for an optional query parameter "inline".
        // Default behavior (if flag is not set) is to trigger a file download.
        const inline = req.query.inline;
        if (inline && inline === 'true') {
            // Send the file inline as part of the response body.
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
            } else if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
            }
            return res.sendFile(filePath, (err) => {
                if (err) {
                    LOG.error('API.report.getReport: error sending file inline.', LOG.LS.eHTTP, err);
                    res.status(200).json({ success: false, message: 'Error sending report inline' });
                }
            });
        } else {
            // Default behavior: trigger a file download.
            return res.download(filePath, filename, (err) => {
                if (err) {
                    LOG.error('API.report.getReport: error triggering download.', LOG.LS.eHTTP, err);
                    res.status(200).json({ success: false, message: 'Error downloading report' });
                }
            });
        }
    } catch (err) {
        // If the file doesn't exist or another error occurs, return a "report not available" message.
        res.status(404).send(JSON.stringify({ success: false, message: 'Report not available' }));
    }

    res.status(200).send(JSON.stringify({ success: true, message: 'report generated successfully', data: '' }));
}
//#endregion
