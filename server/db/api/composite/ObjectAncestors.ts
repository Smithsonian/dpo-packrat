import * as DBAPI from '../..';
import * as CACHE from '../../../cache';
import * as LOG from '../../../utils/logger';
import * as H from '../../../utils/helpers';

import { ObjectGraph, eObjectGraphMode } from './ObjectGraph';
import { ObjectGraphDatabase } from './ObjectGraphDatabase';
import { RepositoryPath } from '../../../types/graphql';

type SystemObjectBased =
    | DBAPI.Unit
    | DBAPI.Project
    | DBAPI.Subject
    | DBAPI.Item
    | DBAPI.CaptureData
    | DBAPI.Model
    | DBAPI.Scene
    | DBAPI.IntermediaryFile
    | DBAPI.ProjectDocumentation
    | DBAPI.Asset
    | DBAPI.AssetVersion
    | DBAPI.Actor
    | DBAPI.Stakeholder;

export class ObjectAncestors {
    idSystemObject: number;

    OG: ObjectGraph;
    OGDB: ObjectGraphDatabase;

    unit: RepositoryPath | null = null;
    project: RepositoryPath | null = null;
    subject: RepositoryPath | null = null;
    item: RepositoryPath | null = null;
    ancestorStack: RepositoryPath[][] = [];

    private handledMap: Map<number, RepositoryPath> = new Map<number, RepositoryPath>();
    private assetOwnerMap: Map<number, RepositoryPath | null> = new Map<number, RepositoryPath | null>();
    private objectPath: RepositoryPath | null = null;
    private unknownName: string = '<UNKNOWN>';

    constructor(idSystemObject: number, unknownName: string) {
        this.idSystemObject = idSystemObject;
        this.unknownName = unknownName;
        this.OGDB = new ObjectGraphDatabase();
        this.OG = new ObjectGraph(idSystemObject, eObjectGraphMode.eAncestors, 32, this.OGDB);
    }

    async compute(): Promise<boolean> {
        if (!(await this.OG.fetch()))
            return false;

        // record asset owners
        if (this.OG.asset) {
            for (const asset of this.OG.asset) {
                if (asset.idSystemObject)
                    this.assetOwnerMap.set(asset.idSystemObject, null);
            }
        }

        await this.objectToRepositoryPath(this.OG.unit, DBAPI.eSystemObjectType.eUnit, true);
        await this.objectToRepositoryPath(this.OG.project, DBAPI.eSystemObjectType.eProject, true);
        await this.objectToRepositoryPath(this.OG.subject, DBAPI.eSystemObjectType.eSubject, true);
        await this.objectToRepositoryPath(this.OG.item, DBAPI.eSystemObjectType.eItem, true);

        // Provide special treatment of capture data, models, and scenes:  mix them together
        // await this.objectToRepositoryPath(this.OG.captureData, DBAPI.eSystemObjectType.eCaptureData, true);
        // await this.objectToRepositoryPath(this.OG.model, DBAPI.eSystemObjectType.eModel, true);
        // await this.objectToRepositoryPath(this.OG.scene, DBAPI.eSystemObjectType.eScene, true);
        let DPOAncestors: RepositoryPath[] = await this.objectToRepositoryPath(this.OG.captureData, DBAPI.eSystemObjectType.eCaptureData, false);
        DPOAncestors = DPOAncestors.concat(await this.objectToRepositoryPath(this.OG.model, DBAPI.eSystemObjectType.eModel, false));
        DPOAncestors = DPOAncestors.concat(await this.objectToRepositoryPath(this.OG.scene, DBAPI.eSystemObjectType.eScene, false));
        if (DPOAncestors.length > 0)
            this.ancestorStack.push(DPOAncestors);

        await this.objectToRepositoryPath(this.OG.intermediaryFile, DBAPI.eSystemObjectType.eIntermediaryFile, true);
        await this.objectToRepositoryPath(this.OG.projectDocumentation, DBAPI.eSystemObjectType.eProjectDocumentation, true);
        await this.objectToRepositoryPath(this.OG.actor, DBAPI.eSystemObjectType.eActor, true);
        await this.objectToRepositoryPath(this.OG.stakeholder, DBAPI.eSystemObjectType.eStakeholder, true);

        // push asset owners onto ancestor stack before assets
        if (this.assetOwnerMap.size > 0) {
            const ancestors: RepositoryPath[] = [];
            for (const path of this.assetOwnerMap.values()) {
                if (path)
                    ancestors.push(path);
            }
            if (ancestors.length > 0)
                this.ancestorStack.push(ancestors);
        }

        await this.objectToRepositoryPath(this.OG.asset, DBAPI.eSystemObjectType.eAsset, true);
        await this.objectToRepositoryPath(this.OG.assetVersion, DBAPI.eSystemObjectType.eAssetVersion, true);

        // if we found our object, push it onto our stack at the end
        if (this.objectPath)
            this.ancestorStack.push([this.objectPath]);

        LOG.info(`ObjectAncestors.compute this.ancestorStack=${JSON.stringify(this.ancestorStack, H.Helpers.saferStringify)}`, LOG.LS.eDB);
        return true;
    }

    private async objectToRepositoryPath(objects: SystemObjectBased[] | null, eObjectType: DBAPI.eSystemObjectType, pushAncestors: boolean): Promise<RepositoryPath[]> {
        if (objects === null)
            return [];

        const ancestors: RepositoryPath[] = [];
        for (const object of objects) {
            let idObject: number | null = null;

            if (object instanceof DBAPI.Unit)
                idObject = object.idUnit;
            else if (object instanceof DBAPI.Project)
                idObject = object.idProject;
            else if (object instanceof DBAPI.Subject)
                idObject = object.idSubject;
            else if (object instanceof DBAPI.Item)
                idObject = object.idItem;
            else if (object instanceof DBAPI.CaptureData)
                idObject = object.idCaptureData;
            else if (object instanceof DBAPI.Model)
                idObject = object.idModel;
            else if (object instanceof DBAPI.Scene)
                idObject = object.idScene;
            else if (object instanceof DBAPI.IntermediaryFile)
                idObject = object.idIntermediaryFile;
            else if (object instanceof DBAPI.ProjectDocumentation)
                idObject = object.idProjectDocumentation;
            else if (object instanceof DBAPI.Asset)
                idObject = object.idAsset;
            else if (object instanceof DBAPI.AssetVersion)
                idObject = object.idAssetVersion;
            else if (object instanceof DBAPI.Actor)
                idObject = object.idActor;
            else if (object instanceof DBAPI.Stakeholder)
                idObject = object.idStakeholder;
            else {
                LOG.error(`ObjectAncestors.compute unable to determine type and id from ${JSON.stringify(object, H.Helpers.saferStringify)}`, LOG.LS.eDB);
                continue;
            }

            const oID: DBAPI.ObjectIDAndType | undefined = { idObject, eObjectType };
            const SOI: DBAPI.SystemObjectInfo | undefined = await CACHE.SystemObjectCache.getSystemFromObjectID(oID);
            if (SOI) {
                // only handle this object if we haven't done so already
                if (!this.handledMap.has(SOI.idSystemObject)) {
                    const path: RepositoryPath = {
                        idSystemObject: SOI.idSystemObject,
                        name: await this.resolveNameForObject(SOI.idSystemObject),
                        objectType: eObjectType
                    };
                    this.handledMap.set(SOI.idSystemObject, path);          // don't re-handle this object

                    if (SOI.idSystemObject === this.idSystemObject)         // if this path is for our source object,
                        this.objectPath = path;                             //      record the path for use at the end of the stack of paths
                    else if (this.assetOwnerMap.has(SOI.idSystemObject))    // if this path is an asset owner,
                        this.assetOwnerMap.set(SOI.idSystemObject, path);   //      record it explicitly for use before rendering assets
                    else                                                    // otherwise
                        ancestors.push(path);                               //      push onto the current ancestor list
                }
            } else
                LOG.error(`ObjectAncestors.compute could not compute system object info from ${JSON.stringify(oID)}`, LOG.LS.eDB);
        }

        if (ancestors.length <= 0)
            return ancestors;

        switch (eObjectType) {
            case DBAPI.eSystemObjectType.eUnit:     this.unit       = ancestors[0]; break;
            case DBAPI.eSystemObjectType.eProject:  this.project    = ancestors[0]; break;
            case DBAPI.eSystemObjectType.eSubject:  this.subject    = ancestors[0]; break;
            case DBAPI.eSystemObjectType.eItem:     this.item       = ancestors[0]; break;
        }

        if (pushAncestors)
            this.ancestorStack.push(ancestors);

        // LOG.info(`ObjectAncestors.compute 1b-${DBAPI.eSystemObjectType[eObjectType]} ${ancestors.length}`, LOG.LS.eDB);
        return ancestors;
    }

    private async resolveNameForObject(idSystemObject: number): Promise<string> {
        const name: string | undefined = await CACHE.SystemObjectCache.getObjectNameByID(idSystemObject);
        return name ?? this.unknownName;
    }
}