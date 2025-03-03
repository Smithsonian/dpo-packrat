/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as LOG from '../../../utils/logger';
import * as DBAPI from '../../../db';
import * as H from '../../../utils/helpers';
import * as STORE from '../../../storage/interface';

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

type AssetDataSummary = {
    error: { process: string, message: string }[],
    asset: DBAPI.Asset,
    versions: DBAPI.AssetVersion[],
    unit: DBAPI.Unit | null,
    subject: DBAPI.Subject | null,
    mediaGroup: DBAPI.Item | null,
    parent: {
        type: 'scene' | 'model' | 'capture_data',
        idSystemObject: number,
    } | null,
};
type AssetVersionDataSummary = {
    dateCreated: Date,
    filePath: string,
    fileSize: number,
    version: number,
    idUserCreator: number,
    ingested: boolean,
    validation: {
        fileExists: H.OpResult | null,
        sizeMatches: H.OpResult | null,
    }
};

type AssetAnalysisResult = {
    status: H.ProcessStatus,
    error: string[],
    asset: {
        id: number,
        rootPath: string,
        fileName: string,
        storageKey: string,
        type: string,
        validation: {
            storageTest: H.OpResult | null,
        }
    },
    versions: AssetVersionDataSummary[],
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

const getAssetSummary = async (idAssets: number[] = []): Promise<AssetDataSummary[] | null> => {

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
    const result: AssetDataSummary[] | null = [];
    for(let i=0; i<assets.length; i++) {
        const summary: AssetDataSummary = {
            error: [],
            asset: assets[i],
            versions: [],
            unit: null,
            subject: null,
            mediaGroup: null,
            parent: null
        };

        // get our version(s)
        summary.versions = await DBAPI.AssetVersion.fetchFromAsset(summary.asset.idAsset) ?? [];
        if(!summary.versions || summary.versions.length===0) {
            LOG.error(`API.getAssetSummary: no asset versions found for: ${summary.asset.idAsset}`,LOG.LS.eHTTP);
            summary.error.push({ process: 'versions', message: 'no asset versions found' });
        }

        // get our context (unit, subject, media group)
        // ...

        // get our relationships (e.g. parent model, scene, or capture data)
        // ...

        // store in our results
        result.push(summary);
    }
    return result;
};

const analyzeAsset = async (asset: AssetDataSummary): Promise<AssetAnalysisResult | null> => {

    const analyzeAssetTypes = [
        133,    // capture data file
        135,    // geometry file
        136,    // texture file
        137,    // scene svx file
        141,    // other: material file
    ];

    const result: AssetAnalysisResult = {
        // general status
        status: (asset.error.length > 0) ? H.ProcessStatus.ERROR : H.ProcessStatus.GOOD,
        error: (asset.error.length > 0) ? asset.error.map(item => `${item.process}:${item.message}`) : [],
        // asset info
        asset: {
            id: asset.asset.idSystemObject ?? -1,
            fileName: asset.asset.FileName,
            rootPath: '',
            storageKey: asset.asset.StorageKey ?? '',
            type: '',
            validation: {
                storageTest: null,
            }
        },
        // versions
        versions: [],
        // context
    };

    // get our type and check
    const assetType: DBAPI.Vocabulary | null = await DBAPI.Vocabulary.fetch(asset.asset.idVAssetType);
    const needsFile: boolean = analyzeAssetTypes.includes(asset.asset.idVAssetType);
    result.asset.type = assetType?.Term ?? `Unsupported: ${asset.asset.idVAssetType}`;

    const storage: STORE.IStorage | null = await STORE.StorageFactory.getInstance();
    if(!storage) {
        console.log('ERROR: cannot get storage interface');
        return null;
    }

    // if we don't need a file then we're likely residual staging data
    // so don't check for file integrity. (e.g. zip package reference)
    if(needsFile===true && !!asset.asset.StorageKey?.length) {

        // get our actual path on the repository
        result.asset.rootPath = await storage.repositoryFileName(asset.asset.StorageKey);

        // Storage factory validation (compares files/paths)
        const storageValidationResult: STORE.ValidateAssetResult = await storage.validateAsset(asset.asset.StorageKey);
        result.asset.validation.storageTest = {
            success: storageValidationResult.success,
            message: storageValidationResult.success ? '' : storageValidationResult.error ?? 'undefined'
        };

        // cycle through versions getting each from disk, checking size, etc. (future: hash for comparison)
        for(let i=0; i<asset.versions.length; i++) {
            const version: DBAPI.AssetVersion = asset.versions[i];

            const versionResult: AssetVersionDataSummary = {
                dateCreated: version.DateCreated,
                filePath: '',
                fileSize: Number(version.StorageSize),
                ingested: version.Ingested ?? false,
                idUserCreator: version.idUserCreator,
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

            result.versions.push(versionResult);
        }
    }

    console.log('result: ',result);
    return result;
};

export async function reportAssetFiles(_req: Request, res: Response): Promise<void> {

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
    const assets: AssetDataSummary[] | null = await getAssetSummary();
    if(!assets || assets.length===0) {
        LOG.error('API.reportAssetFiles: cannot get assets from system',LOG.LS.eHTTP);
        res.status(200).send(JSON.stringify(generateResponse(false, 'cannot get assets from system', guid, H.ProcessState.FAILED)));
        return;
    }

    // cycle through validating assets/versions appending to report
    let hasError: boolean = false;
    const report: AssetAnalysisResult[] = [];
    for(let i=0; i<assets.length; i++) {
        const validationResult: AssetAnalysisResult | null = await analyzeAsset(assets[i]);
        if(!validationResult) {
            LOG.error(`API.reportAssetFiles: error validating asset: (${assets[i].asset.idAsset}:${assets[i].asset.FileName})`,LOG.LS.eHTTP);
            hasError = true;
            continue;
        }

        report.push(validationResult);
    }

    const result: ReportResponse = {
        guid,
        state: (hasError===true) ? H.ProcessState.FAILED : H.ProcessState.COMPLETED,
        user: { id: -1, name: 'N/A', email: 'N/A' },
        type: ReportType.ASSET_FILE,
        report
    };

    // create our combined response and return info to client
    res.status(200).send(JSON.stringify({ success: true, message: 'report generated successfully', data: result }));
}
