import * as EVENT from '../../interface';
import { EventConsumer } from './EventConsumer';
import { EventConsumerDB } from './EventConsumerDB';
import { EventEngine } from './EventEngine';
import { Config } from '../../../config';
import * as DBAPI from '../../../db';
import * as CACHE from '../../../cache';
import * as COL from '../../../collections/interface/';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';
import * as ZIP from '../../../utils/zipStream';
import * as STORE from '../../../storage/interface';

import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class EventConsumerPublish extends EventConsumer {
    constructor(engine: EventEngine) {
        super(engine);
    }

    protected async eventWorker<Key, Value>(data: EVENT.IEventData<Key, Value>[]): Promise<void> {
        // inform audit interface of authentication event
        for (const dataItem of data) {
            if (typeof(dataItem.key) !== 'number') {
                LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                continue;
            }

            switch (dataItem.key) {
                case EVENT.eEventKey.eSceneQCd:
                    if (!await this.publishScene(dataItem.value))
                        LOG.error('EventConsumerPublish.eventWorker failed publishing scene', LOG.LS.eEVENT);
                    break;

                default:
                    LOG.error(`EventConsumerPublish.eventWorker sent event with unknown key ${JSON.stringify(dataItem)}`, LOG.LS.eEVENT);
                    break;
            }
        }
    }

    protected async publishScene<Value>(dataItemValue: Value): Promise<boolean> {
        const audit: DBAPI.Audit = EventConsumerDB.convertDataToAudit(dataItemValue);
        let idSystemObject: number | null = audit.idSystemObject;
        if (idSystemObject === null && audit.idDBObject && audit.DBObjectType) {
            const oID: DBAPI.ObjectIDAndType = { idObject: audit.idDBObject , eObjectType: audit.DBObjectType };
            const SOInfo: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOInfo) {
                idSystemObject = SOInfo.idSystemObject;
                audit.idSystemObject = idSystemObject;
            }
        }

        LOG.info(`EventConsumerPublish.eventWorker Scene QCd ${audit.idDBObject}`, LOG.LS.eEVENT);
        if (audit.idAudit === 0)
            audit.create(); // don't use await so this happens asynchronously

        if (!idSystemObject) {
            LOG.error(`EventConsumerPublish.eventWorker received eSceneQCd event for scene without idSystemObject ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        if (audit.getDBObjectType() !== DBAPI.eSystemObjectType.eScene) {
            LOG.error(`EventConsumerPublish.eventWorker received eSceneQCd event for non scene object ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        // fetch scene
        const scene: DBAPI.Scene | null = audit.idDBObject ? await DBAPI.Scene.fetch(audit.idDBObject) : null;
        if (!scene) {
            LOG.error(`EventConsumerPublish.eventWorker received eSceneQCd event for non scene object ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        // create UUID if not done already
        if (!scene.EdanUUID) {
            scene.EdanUUID = uuidv4();
            if (!await scene.update()) {
                LOG.error(`EventConsumerPublish.eventWorker unable to persist UUID for scene object ${JSON.stringify(audit, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
                return false;
            }
        }
        LOG.info(`EventConsumerPublish.eventWorker Publishing Scene with UUID ${scene.EdanUUID}`, LOG.LS.eEVENT);

        // stage scene zip
        const assetVersions: DBAPI.AssetVersion[] | null = await DBAPI.AssetVersion.fetchLatestFromSystemObject(idSystemObject);
        if (!assetVersions || assetVersions.length === 0) {
            LOG.error(`EventConsumerPublish.eventWorker unable to load asset versions for scene ${JSON.stringify(scene, H.Helpers.saferStringify)}`, LOG.LS.eEVENT);
            return false;
        }

        // first pass: detect and record the scene file (first file to match *.svx.json);
        // prepare to extract and discard the path to this file, so that the scene zip is "rooted" at the svx.json
        let sceneFile: string | undefined = undefined;
        let extractedPath: string | undefined = undefined;
        for (const assetVersion of assetVersions) {
            if (assetVersion.FileName.toLowerCase().endsWith('.svx.json')) {
                const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
                if (!asset) {
                    LOG.error(`EventConsumerPublish.eventWorker unable to load asset by id ${assetVersion.idAsset}`, LOG.LS.eEVENT);
                    return false;
                }

                sceneFile = assetVersion.FileName;
                extractedPath = asset.FilePath;
                break;
            }
        }

        const zip: ZIP.ZipStream = new ZIP.ZipStream();
        for (const assetVersion of assetVersions) {
            const asset: DBAPI.Asset | null = await DBAPI.Asset.fetch(assetVersion.idAsset);
            if (!asset) {
                LOG.error(`EventConsumerPublish.eventWorker unable to load asset by id ${assetVersion.idAsset}`, LOG.LS.eEVENT);
                return false;
            }

            const RSR: STORE.ReadStreamResult = await STORE.AssetStorageAdapter.readAsset(asset, assetVersion);
            if (!RSR.success || !RSR.readStream) {
                LOG.error(`EventConsumerPublish.eventWorker failed to extract stream for asset version ${assetVersion.idAssetVersion}`, LOG.LS.eEVENT);
                return false;
            }

            let rebasedPath: string = extractedPath ? asset.FilePath.replace(extractedPath, '') : asset.FilePath;
            if (extractedPath && rebasedPath.startsWith('/'))
                rebasedPath = rebasedPath.substring(1);

            const fileNameAndPath: string = path.posix.join(rebasedPath, assetVersion.FileName);
            LOG.info(`EventConsumerPublish.eventWorker adding ${fileNameAndPath} to zip`, LOG.LS.eEVENT);
            const res: H.IOResults = await zip.add(fileNameAndPath, RSR.readStream);
            if (!res.success) {
                LOG.error(`EventConsumerPublish.eventWorker failed to add asset version ${assetVersion.idAssetVersion} to zip: ${res.error}`, LOG.LS.eEVENT);
                return false;
            }
        }

        const zipStream: NodeJS.ReadableStream | null = await zip.streamContent(null);
        if (!zipStream) {
            LOG.error('EventConsumerPublish.eventWorker failed to extract stream from zip', LOG.LS.eEVENT);
            return false;
        }

        let stageRes: H.IOResults = await H.Helpers.fileOrDirExists(Config.collection.edan.stagingRoot);
        if (!stageRes.success)
            stageRes = await H.Helpers.createDirectory(Config.collection.edan.stagingRoot);
        if (!stageRes.success) {
            LOG.error(`EventConsumerPublish.eventWorker unable to ensure existence of staging directory ${Config.collection.edan.stagingRoot}: ${stageRes.error}`, LOG.LS.eEVENT);
            return false;
        }

        const noFinalSlash: boolean = !Config.collection.edan.upsertContentRoot.endsWith('/');
        const sharedName: string = Config.collection.edan.upsertContentRoot + (noFinalSlash ? '/' : '') + scene.EdanUUID! + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        const stagedName: string = path.join(Config.collection.edan.stagingRoot, scene.EdanUUID!) + '.zip'; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        // LOG.info(`EventConsumerPublish.eventWorker staging file ${stagedName}, referenced in publish as ${sharedName}`, LOG.LS.eEVENT);

        stageRes = await H.Helpers.writeStreamToFile(zipStream, stagedName);
        if (!stageRes.success) {
            LOG.error(`EventConsumerPublish.eventWorker unable to stage file ${stagedName}: ${stageRes.error}`, LOG.LS.eEVENT);
            return false;
        }

        const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
        if (!await ICol.createEdan3DPackage(sharedName, sceneFile)) {
            LOG.error('EventConsumerPublish.eventWorker publish to EDAN failed', LOG.LS.eEVENT);
            return false;
        }

        return true;
    }
}
