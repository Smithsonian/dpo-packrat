/* eslint-disable camelcase */
import { Item as ItemBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';
import { Merge } from '../../utils/types';

export type ItemAndProject = Merge<Item, { idProject: number, ProjectName: string }>;

export class Item extends DBC.DBObject<ItemBase> implements ItemBase, SystemObjectBased {
    idItem!: number;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    Name!: string;
    EntireSubject!: boolean;
    Title!: string | null;

    constructor(input: ItemBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Item'; }
    public fetchID(): number { return this.idItem; }

    static constructFromPrisma(item: ItemBase): Item {
        return new Item({
            idItem: item.idItem,
            idAssetThumbnail: item.idAssetThumbnail,
            idGeoLocation: item.idGeoLocation,
            Name: item.Name,
            EntireSubject: (item.EntireSubject ? true : false), // we're expecting Prisma to send values like 0 and 1
            Title: item.Title,
        });
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idAssetThumbnail, idGeoLocation, Name, EntireSubject, Title } = this;
            ({ idItem: this.idItem, EntireSubject: this.EntireSubject, Title: this.Title, idAssetThumbnail: this.idAssetThumbnail,
                idGeoLocation: this.idGeoLocation, Name: this.Name } =
                await DBC.DBConnection.prisma.item.create({
                    data: {
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                        Name,
                        EntireSubject,
                        Title,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idItem, idAssetThumbnail, idGeoLocation, Name, EntireSubject, Title } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.item.update({
                where: { idItem, },
                data: {
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : { disconnect: true, },
                    Name,
                    EntireSubject,
                    Title,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idItem } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idItem, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.item.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idItem: number): Promise<Item | null> {
        if (!idItem)
            return null;
        try {
            return DBC.CopyObject<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findUnique({ where: { idItem, }, }), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Item[] | null> {
        try {
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findMany(), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchDerivedFromSubject(idSubject: number): Promise<Item[] | null> {
        if (!idSubject)
            return null;
        try {
            const SOSubject: SystemObject | null = await SystemObject.fetchFromSubjectID(idSubject);
            if (!SOSubject)
                return null;
            return DBC.CopyArray<ItemBase, Item>(
                await DBC.DBConnection.prisma.item.findMany({
                    where: {
                        SystemObject: {
                            AND: [ {
                                idItem: {
                                    not: null,
                                },
                            }, {
                                SystemObjectXref_SystemObjectToSystemObjectXref_idSystemObjectDerived: {
                                    some: {
                                        idSystemObjectMaster: SOSubject.idSystemObject,
                                    },
                                },
                            } ],
                        },
                    },
                }), Item);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchDerivedFromSubject', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to exactly *all* of the specified subjects.
     * Items are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified subjects.
     * @param idSubjects Array of Subject.idSubject
     */
    static async fetchDerivedFromSubjects(idSubjects: number[]): Promise<Item[] | null> {
        if (!idSubjects || idSubjects.length == 0)
            return null;
        try {
            // first, find set of item IDs that are related to all of our target subjects
            const subjectCount: number = idSubjects.length;
            const idItems1: { idItem: number }[] | null =
                await DBC.DBConnection.prisma.$queryRaw<{ idItem: number }[]>`
                SELECT I.idItem
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectMaster = SOS.idSystemObject)
                WHERE SOS.idSubject IN (${Prisma.join(idSubjects)})
                GROUP BY I.idItem
                HAVING COUNT(*) = ${subjectCount}`;
            // LOG.info(`Item.fetchDerivedFromSubjects(${JSON.stringify(idSubjects)}), idItems1 = ${JSON.stringify(idItems1)}`, LOG.LS.eDB);
            /* istanbul ignore if */
            if (!idItems1)
                return null;
            /* istanbul ignore if */
            if (idItems1.length === 0)
                return [];

            // next, for those item IDs, find those with total relationships to subjects that equal our subject count
            // (i.e. all of their subject relationships are with our desired subjects and none other)
            let idItems: number[] = idItems1.map(item => item.idItem);
            // LOG.info(`Item.fetchDerivedFromSubjects(${JSON.stringify(idSubjects)}), idItems = ${JSON.stringify(idItems)}`, LOG.LS.eDB);

            const idItems2: { idItem: number }[] | null =
                await DBC.DBConnection.prisma.$queryRaw<{ idItem: number }[]>`
                SELECT I.idItem
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectMaster = SOS.idSystemObject)
                WHERE SOS.idSubject IS NOT NULL
                  AND I.idItem IN (${Prisma.join(idItems)})
                GROUP BY I.idItem
                HAVING COUNT(*) = ${subjectCount}`;
            /* istanbul ignore if */
            // LOG.info(`Item.fetchDerivedFromSubjects(${JSON.stringify(idSubjects)}), idItems2 = ${JSON.stringify(idItems2)}`, LOG.LS.eDB);
            if (!idItems2)
                return null;
            /* istanbul ignore if */
            if (idItems2.length === 0)
                return [];

            idItems = idItems2.map(item => item.idItem);
            // LOG.info(`Item.fetchDerivedFromSubjects(${JSON.stringify(idSubjects)}), idItems = ${JSON.stringify(idItems)}`, LOG.LS.eDB);

            // finally, lookup items for those item IDs
            const items: ItemBase[] | null =
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT I.*
                FROM Item AS I
                WHERE I.idItem IN (${Prisma.join(idItems)})`;
            // LOG.info(`Item.fetchDerivedFromSubjects(${JSON.stringify(idSubjects)}), items = ${JSON.stringify(items)}`, LOG.LS.eDB);

            /* istanbul ignore if */
            if (!items)
                return null;
            const res: Item[] = [];
            for (const item of items)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(Item.constructFromPrisma(item));
            return res;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchDerivedFromSubjects', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified capture data
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified capture data.
     * @param idCaptureDatas Array of CaptureData.idCaptureData
     */
    static async fetchMasterFromCaptureDatas(idCaptureDatas: number[]): Promise<Item[] | null> {
        if (!idCaptureDatas || idCaptureDatas.length == 0)
            return null;
        try {
            const items: ItemBase[] | null =
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOC ON (SOX.idSystemObjectDerived = SOC.idSystemObject)
                WHERE SOC.idCaptureData IN (${Prisma.join(idCaptureDatas)})`;

            /* istanbul ignore if */
            if (!items)
                return null;
            const res: Item[] = [];
            for (const item of items)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(Item.constructFromPrisma(item));
            return res;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromCaptureData', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified models
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified models.
     * @param idModels Array of Model.idModel
     */
    static async fetchMasterFromModels(idModels: number[]): Promise<Item[] | null> {
        if (!idModels || idModels.length == 0)
            return null;
        try {
            const items: ItemBase[] | null =
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOM ON (SOX.idSystemObjectDerived = SOM.idSystemObject)
                WHERE SOM.idModel IN (${Prisma.join(idModels)})`;

            /* istanbul ignore if */
            if (!items)
                return null;
            const res: Item[] = [];
            for (const item of items)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(Item.constructFromPrisma(item));
            return res;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromModel', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified scenes
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified scenes.
     * @param idScenes Array of Scene.idScene
     */
    static async fetchMasterFromScenes(idScenes: number[]): Promise<Item[] | null> {
        if (!idScenes || idScenes.length == 0)
            return null;
        try {
            const items: ItemBase[] | null =
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOS ON (SOX.idSystemObjectDerived = SOS.idSystemObject)
                WHERE SOS.idScene IN (${Prisma.join(idScenes)})`;

            /* istanbul ignore if */
            if (!items)
                return null;
            const res: Item[] = [];
            for (const item of items)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(Item.constructFromPrisma(item));
            return res;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromScene', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of items that are connected to any of the specified IntermediaryFile
     * Items are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified IntermediaryFiles.
     * @param idIntermediaryFiles Array of IntermediaryFile.idIntermediaryFile
     */
    static async fetchMasterFromIntermediaryFiles(idIntermediaryFiles: number[]): Promise<Item[] | null> {
        if (!idIntermediaryFiles || idIntermediaryFiles.length == 0)
            return null;
        try {
            const items: ItemBase[] | null =
                await DBC.DBConnection.prisma.$queryRaw<Item[]>`
                SELECT DISTINCT I.*
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOIF ON (SOX.idSystemObjectDerived = SOIF.idSystemObject)
                WHERE SOIF.idIntermediaryFile IN (${Prisma.join(idIntermediaryFiles)})`;

            /* istanbul ignore if */
            if (!items)
                return null;
            const res: Item[] = [];
            for (const item of items)   // Manually construct AssetVersion in order to convert queryRaw output of date strings and 1/0's for bits to Date() and boolean
                res.push(Item.constructFromPrisma(item));
            return res;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchMasterFromIntermediaryFiles', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes an array of { Item.*, Project.idProject, Project.Name as ProjectName } of items that are connected to any of the specified projects:
     * @param idItems Array of Item.idItem
     */
    static async fetchRelatedItemsAndProjects(idItems: number[]): Promise<ItemAndProject[] | null> {
        if (!idItems || idItems.length == 0)
            return null;
        try {
            return await DBC.DBConnection.prisma.$queryRaw<ItemAndProject[]>`
                SELECT DISTINCT I.*, P.idProject, P.Name AS 'ProjectName'
                FROM Item AS I
                JOIN SystemObject AS SOI ON (I.idItem = SOI.idItem)
                JOIN SystemObjectXref AS SOX ON (SOI.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOP ON (SOX.idSystemObjectMaster = SOP.idSystemObject)
                JOIN Project AS P ON (SOP.idProject = P.idProject)
                WHERE I.idItem IN (${Prisma.join(idItems)})`;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Item.fetchRelatedItemsAndProjects', LOG.LS.eDB, error);
            return null;
        }
    }
}