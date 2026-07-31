/* eslint-disable camelcase */
import { SystemObjectXref as SystemObjectXrefBase } from '@prisma/client';
import { SystemObjectBased, SystemObject } from '..';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import * as COMMON from '@dpo-packrat/common';
import { SystemObjectTypeFromSystemObject } from './ObjectType';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class SystemObjectXref extends DBC.DBObject<SystemObjectXrefBase> implements SystemObjectXrefBase {
    idSystemObjectXref!: number;
    idSystemObjectMaster!: number;
    idSystemObjectDerived!: number;

    constructor(input: SystemObjectXrefBase) {
        super(input);
    }

    public fetchTableName(): string { return 'SystemObjectXref'; }
    public fetchID(): number { return this.idSystemObjectXref; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idSystemObjectMaster, idSystemObjectDerived } = this;
            ({ idSystemObjectXref: this.idSystemObjectXref, idSystemObjectMaster: this.idSystemObjectMaster,
                idSystemObjectDerived: this.idSystemObjectDerived } =
                await DBC.DBConnection.prisma.systemObjectXref.create({
                    data: {
                        SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
                        SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.SystemObject.Xref');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSystemObjectXref, idSystemObjectMaster, idSystemObjectDerived } = this;
            return await DBC.DBConnection.prisma.systemObjectXref.update({
                where: { idSystemObjectXref, },
                data: {
                    SystemObject_SystemObjectToSystemObjectXref_idSystemObjectMaster:  { connect: { idSystemObject: idSystemObjectMaster }, },
                    SystemObject_SystemObjectToSystemObjectXref_idSystemObjectDerived: { connect: { idSystemObject: idSystemObjectDerived }, },
                }
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.SystemObject.Xref');
            return  false;
        }
    }
    /** Don't call this directly; instead, let DBObject.delete() call this. Code needing to delete a record should call this.delete(); */
    protected async deleteWorker(): Promise<boolean> {
        try {
            // LOG.info(`SystemObjectXref.deleteWorker ${JSON.stringify(this)}`, LOG.LS.eDB);
            const { idSystemObjectXref } = this;
            return await DBC.DBConnection.prisma.systemObjectXref.delete({
                where: { idSystemObjectXref, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'delete failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.SystemObject.Xref');
            return false;
        }
    }

    async deleteIfAllowed(): Promise<H.IOResults> {
        try {
            // Xref records can be removed as long as this is not the final subject "master" for an item "derived"
            // The query below counts how many xref records match this criteria for the this.idSystemObjectDerived
            const subjectItemLinkCount: { RowCount: BigInt }[] =
                await DBC.DBConnection.prisma.$queryRaw<{ RowCount: BigInt }[]>`
                SELECT COUNT(*) AS 'RowCount'
                FROM SystemObjectXref AS SOX
                JOIN SystemObject AS SOMaster ON (SOX.idSystemObjectMaster = SOMaster.idSystemObject)
                JOIN SystemObject AS SODerived ON (SOX.idSystemObjectDerived = SODerived.idSystemObject)
                WHERE SOMaster.idSubject IS NOT NULL
                  AND SODerived.idItem IS NOT NULL
                  AND SODerived.idSystemObject = ${this.idSystemObjectDerived};`;
            // LOG.info(`SystemObjectXref.deleteIfAllowed ${JSON.stringify(this)}: ${JSON.stringify(subjectItemLinkCount)} relationships`, LOG.LS.eDB);

            /* istanbul ignore next */
            if (subjectItemLinkCount.length != 1) // array of wrong length returned, error ... should never happen
                return { success: false, error: `Unable to remove final subject from Item ${this.idSystemObjectDerived}` };

            if (Number(subjectItemLinkCount[0].RowCount) === 1) {
                // determine if this.idSystemObjectMaster points to a subject (if so, it's the only one linked!)
                const SO: SystemObject | null = await SystemObject.fetch(this.idSystemObjectMaster);
                if (SO && SO.idSubject)
                    return { success: false, error: `Unable to remove final subject from Item ${this.idSystemObjectDerived}` };
            }
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'delete if allowed failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.SystemObject.Xref');
            return { success: false, error: JSON.stringify(error) };
        }

        const result = await this.delete();
        if(!result) {
            RK.logError(RK.LogSection.eDB,'delete if allowed failed','error deleting xref',{ id: this.fetchID() },'DB.SystemObject.Xref');
            /* istanbul ignore next */
            return { success: false, error: `Database error deleting xref ${JSON.stringify(this)}` };
        } else {
            return { success: true };
        }
    }

    static async deleteIfAllowed(idSystemObjectXref: number): Promise<H.IOResults> {
        const sox: SystemObjectXref | null = await SystemObjectXref.fetch(idSystemObjectXref);

        if(sox)
            return sox.deleteIfAllowed();
        else {
            RK.logError(RK.LogSection.eDB,'delete if allowed id failed',`Unable to load SystemObjectXref with id ${idSystemObjectXref}`,{ idSystemObjectXref },'DB.SystemObject.Xref');
            return { success: false, error: `Unable to load SystemObjectXref with id ${idSystemObjectXref}` };
        }
    }

    static async fetch(idSystemObjectXref: number): Promise<SystemObjectXref | null> {
        if (!idSystemObjectXref)
            return null;
        try {
            return DBC.CopyObject<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findUnique({ where: { idSystemObjectXref, }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idSystemObjectXref },'DB.SystemObject.Xref');
            return null;
        }
    }

    static async fetchXref(idSystemObjectMaster: number, idSystemObjectDerived: number): Promise<SystemObjectXref[] | null> {
        if (!idSystemObjectMaster || !idSystemObjectDerived)
            return null;
        try {
            return DBC.CopyArray<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findMany({
                    where: { AND: [ { idSystemObjectMaster }, { idSystemObjectDerived }, ] }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch xref failed',H.Helpers.getErrorString(error),{ idSystemObjectMaster, idSystemObjectDerived },'DB.SystemObject.Xref');
            return null;
        }
    }

    static async fetchMasters(idSystemObjectDerived: number): Promise<SystemObjectXref[] | null> {
        if (!idSystemObjectDerived)
            return null;
        try {
            return DBC.CopyArray<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findMany({
                    where: { idSystemObjectDerived }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch masters failed',H.Helpers.getErrorString(error),{ idSystemObjectDerived },'DB.SystemObject.Xref');
            return null;
        }
    }

    static async fetchDerived(idSystemObjectMaster: number): Promise<SystemObjectXref[] | null> {
        if (!idSystemObjectMaster)
            return null;
        try {
            return DBC.CopyArray<SystemObjectXrefBase, SystemObjectXref>(
                await DBC.DBConnection.prisma.systemObjectXref.findMany({
                    where: { idSystemObjectMaster }, }), SystemObjectXref);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch derived failed',H.Helpers.getErrorString(error),{ idSystemObjectMaster },'DB.SystemObject.Xref');
            return null;
        }
    }

    /**
     * Returns the set of descendant idSystemObjects (including idSystemObject itself), matching the
     * node set produced by `new ObjectGraph(idSystemObject, eDescendents, depth).objectMap.keys()`,
     * without building the typed ObjectGraphDatabase or issuing the per-node 13-table SystemObjectPairs
     * join. Used by LicenseCache to invalidate every descendant's cached inherited license.
     *
     * A level-batched breadth-first walk: each level issues a fixed handful of `IN (...)` queries
     * regardless of node count, rather than ObjectGraph's per-node sequential round-trips. It follows
     * the same descendant edges ObjectGraph does — SystemObjectXref derived edges, owned assets and
     * their versions, per-type thumbnail assets, Unit→Subject/Actor and Project→ProjectDocumentation —
     * so the id set has parity. A visited set + depth cap guard cycles exactly like ObjectGraph.
     */
    static async fetchDescendentIDs(idSystemObject: number, depth: number = 32): Promise<Set<number>> {
        const visited: Set<number> = new Set<number>();
        if (!idSystemObject)
            return visited;
        visited.add(idSystemObject);

        let frontier: number[] = [idSystemObject];
        let level: number = 0;
        try {
            while (frontier.length > 0 && level < depth) {
                const children: number[] = await SystemObjectXref.fetchDescendentChildrenBatch(frontier);
                const nextFrontier: number[] = [];
                for (const idChild of children) {
                    if (!visited.has(idChild)) {
                        visited.add(idChild);
                        nextFrontier.push(idChild);
                    }
                }
                frontier = nextFrontier;
                level++;
            }
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch descendent ids failed',H.Helpers.getErrorString(error),{ idSystemObject },'DB.SystemObject.Xref');
        }
        return visited;
    }

    /** One breadth-first hop: given a frontier of idSystemObjects, returns every immediate descendant
     * idSystemObject, mirroring the child edges ObjectGraph gathers in eDescendents mode. Each edge
     * class is resolved with a single batched `IN (...)` query. */
    private static async fetchDescendentChildrenBatch(frontier: number[]): Promise<number[]> {
        const prisma = DBC.DBConnection.prisma;
        const children: Set<number> = new Set<number>();

        // Classify the frontier nodes by type (single-table read; no SystemObjectPairs join).
        const sos = await prisma.systemObject.findMany({
            where: { idSystemObject: { in: frontier } },
            select: { idSystemObject: true, idUnit: true, idProject: true, idSubject: true,
                idItem: true, idCaptureData: true, idModel: true, idScene: true, idAsset: true },
        });
        const unitIDs: number[] = [];
        const projectIDs: number[] = [];
        const subjectIDs: number[] = [];
        const itemIDs: number[] = [];
        const captureDataIDs: number[] = [];
        const modelIDs: number[] = [];
        const sceneIDs: number[] = [];
        const assetIDs: number[] = [];  // nodes that are themselves Assets
        for (const so of sos) {
            if (so.idUnit) unitIDs.push(so.idUnit);
            if (so.idProject) projectIDs.push(so.idProject);
            if (so.idSubject) subjectIDs.push(so.idSubject);
            if (so.idItem) itemIDs.push(so.idItem);
            if (so.idCaptureData) captureDataIDs.push(so.idCaptureData);
            if (so.idModel) modelIDs.push(so.idModel);
            if (so.idScene) sceneIDs.push(so.idScene);
            if (so.idAsset) assetIDs.push(so.idAsset);
        }

        // Edge: SystemObjectXref derived (the structural child edges — the common case).
        const xrefs = await prisma.systemObjectXref.findMany({
            where: { idSystemObjectMaster: { in: frontier } }, select: { idSystemObjectDerived: true } });
        for (const x of xrefs)
            children.add(x.idSystemObjectDerived);

        // Edge: assets owned by any frontier node (Asset.idSystemObject → owning node).
        const ownedAssets = await prisma.asset.findMany({
            where: { idSystemObject: { in: frontier } }, select: { idAsset: true } });
        await SystemObjectXref.addSystemObjectsForField(children, 'idAsset', ownedAssets.map(a => a.idAsset));

        // Edge: asset children — AssetVersions of nodes that are themselves Assets.
        if (assetIDs.length > 0) {
            const avs = await prisma.assetVersion.findMany({
                where: { idAsset: { in: assetIDs } }, select: { idAssetVersion: true } });
            await SystemObjectXref.addSystemObjectsForField(children, 'idAssetVersion', avs.map(a => a.idAssetVersion));
        }

        // Edge: Unit → Subjects and Unit → Actors (FK edges, not modeled in SystemObjectXref).
        if (unitIDs.length > 0) {
            const subs = await prisma.subject.findMany({ where: { idUnit: { in: unitIDs } }, select: { idSubject: true } });
            await SystemObjectXref.addSystemObjectsForField(children, 'idSubject', subs.map(s => s.idSubject));
            const actors = await prisma.actor.findMany({ where: { idUnit: { in: unitIDs } }, select: { idActor: true } });
            await SystemObjectXref.addSystemObjectsForField(children, 'idActor', actors.map(a => a.idActor));
        }

        // Edge: Project → ProjectDocumentation (FK edge).
        if (projectIDs.length > 0) {
            const pds = await prisma.projectDocumentation.findMany({
                where: { idProject: { in: projectIDs } }, select: { idProjectDocumentation: true } });
            await SystemObjectXref.addSystemObjectsForField(children, 'idProjectDocumentation', pds.map(p => p.idProjectDocumentation));
        }

        // Edge: per-type thumbnail assets (Subject/Item/CaptureData/Model/Scene → idAssetThumbnail).
        const thumbnailAssetIDs: number[] = [];
        const collectThumbnails = (rows: { idAssetThumbnail: number | null }[]): void => {
            for (const r of rows)
                if (r.idAssetThumbnail) thumbnailAssetIDs.push(r.idAssetThumbnail);
        };
        if (subjectIDs.length > 0)
            collectThumbnails(await prisma.subject.findMany({ where: { idSubject: { in: subjectIDs } }, select: { idAssetThumbnail: true } }));
        if (itemIDs.length > 0)
            collectThumbnails(await prisma.item.findMany({ where: { idItem: { in: itemIDs } }, select: { idAssetThumbnail: true } }));
        if (captureDataIDs.length > 0)
            collectThumbnails(await prisma.captureData.findMany({ where: { idCaptureData: { in: captureDataIDs } }, select: { idAssetThumbnail: true } }));
        if (modelIDs.length > 0)
            collectThumbnails(await prisma.model.findMany({ where: { idModel: { in: modelIDs } }, select: { idAssetThumbnail: true } }));
        if (sceneIDs.length > 0)
            collectThumbnails(await prisma.scene.findMany({ where: { idScene: { in: sceneIDs } }, select: { idAssetThumbnail: true } }));
        await SystemObjectXref.addSystemObjectsForField(children, 'idAsset', thumbnailAssetIDs);

        return Array.from(children);
    }

    /** Resolves a batch of entity ids (e.g. idAsset values) to their idSystemObjects and adds them to
     * the accumulating child set. `field` is the SystemObject FK column that references the entity. */
    private static async addSystemObjectsForField(children: Set<number>,
        field: 'idAsset' | 'idAssetVersion' | 'idSubject' | 'idActor' | 'idProjectDocumentation',
        entityIDs: number[]): Promise<void> {
        if (entityIDs.length === 0)
            return;
        const rows = await DBC.DBConnection.prisma.systemObject.findMany({
            where: { [field]: { in: entityIDs } }, select: { idSystemObject: true } });
        for (const r of rows)
            children.add(r.idSystemObject);
    }

    static async wireObjectsIfNeeded(master: SystemObjectBased, derived: SystemObjectBased): Promise<SystemObjectXref | null>;
    static async wireObjectsIfNeeded(master: SystemObjectBased, derivedID: number): Promise<SystemObjectXref | null>;
    static async wireObjectsIfNeeded(masterID: number, derived: SystemObjectBased): Promise<SystemObjectXref | null>;
    static async wireObjectsIfNeeded(masterID: number, derivedID: number): Promise<SystemObjectXref | null>;
    static async wireObjectsIfNeeded(master: SystemObjectBased | number, derived: SystemObjectBased | number): Promise<SystemObjectXref | null> {
        const masterID: number | null = (typeof(master) === 'number') ? master : null;
        const derivedID: number | null = (typeof(derived) === 'number') ? derived : null;
        const masterSOBased: SystemObjectBased | null = (typeof(master) !== 'number') ? master : null;
        const derivedSOBased: SystemObjectBased | null = (typeof(derived) !== 'number') ? derived : null;

        const SOMaster: SystemObject | null = masterSOBased ? await masterSOBased.fetchSystemObject() :
            await SystemObject.fetch(masterID!); /* istanbul ignore next */ // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (!SOMaster) {
            RK.logError(RK.LogSection.eDB,'wire objects if needed failed',`Unable to compute SystemObject master: ${masterID}`,{ master, masterSOBased },'DB.SystemObject.Xref');
            return null;
        }

        const SODerived: SystemObject | null = derivedSOBased ? await derivedSOBased.fetchSystemObject():
            await SystemObject.fetch(derivedID!) ; /* istanbul ignore next */ // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (!SODerived) {
            RK.logError(RK.LogSection.eDB,'wire objects if needed failed',`Unable to compute SystemObject derived: ${derivedID}`,{ derived },'DB.SystemObject.Xref');
            return null;
        }

        // Reject an inverted containment edge: wiring a structural container (Unit/Project/Subject/
        // Item) beneath a lower-tier object would let a retire cascade or graph traversal reach a
        // container from below. This never occurs for valid relationships (downward container edges
        // such as Unit->Project rank the derived below the master and are permitted); an inverted
        // edge indicates bad data or a caller bug, so it is refused and logged.
        const eMasterType: COMMON.eSystemObjectType = SystemObjectTypeFromSystemObject(SOMaster);
        const eDerivedType: COMMON.eSystemObjectType = SystemObjectTypeFromSystemObject(SODerived);
        if (COMMON.isInvertedContainmentEdge(eMasterType, eDerivedType)) {
            RK.logError(RK.LogSection.eDB,'wire objects if needed failed','refusing inverted containment edge',
                { master: { idSystemObject: SOMaster.idSystemObject, type: COMMON.eSystemObjectType[eMasterType] },
                    derived: { idSystemObject: SODerived.idSystemObject, type: COMMON.eSystemObjectType[eDerivedType] } },
                'DB.SystemObject.Xref');
            return null;
        }

        const idSystemObjectMaster: number = SOMaster.idSystemObject;
        const idSystemObjectDerived: number = SODerived.idSystemObject;
        const xrefs: SystemObjectXref[] | null = await this.fetchXref(idSystemObjectMaster, idSystemObjectDerived);
        if (xrefs && xrefs.length > 0)
            return xrefs[0];

        const xref: SystemObjectXref | null = new SystemObjectXref({ idSystemObjectMaster, idSystemObjectDerived, idSystemObjectXref: 0 });
        return (await xref.create()) ? xref : /* istanbul ignore next */ null;
    }
}
