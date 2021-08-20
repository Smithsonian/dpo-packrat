/* eslint-disable camelcase */
import { Subject as SubjectBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Subject extends DBC.DBObject<SubjectBase> implements SubjectBase, SystemObjectBased {
    idSubject!: number;
    idUnit!: number;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    Name!: string;
    idIdentifierPreferred!: number | null;

    constructor(input: SubjectBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Subject'; }
    public fetchID(): number { return this.idSubject; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUnit, idAssetThumbnail, idGeoLocation, Name, idIdentifierPreferred } = this;
            ({ idSubject: this.idSubject, idUnit: this.idUnit, idAssetThumbnail: this.idAssetThumbnail,
                idGeoLocation: this.idGeoLocation, Name: this.Name, idIdentifierPreferred: this.idIdentifierPreferred } =
                await DBC.DBConnection.prisma.subject.create({
                    data: {
                        Unit:           { connect: { idUnit }, },
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                        Name,
                        Identifier:     idIdentifierPreferred ? { connect: { idIdentifier: idIdentifierPreferred }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSubject, idUnit, idAssetThumbnail, idGeoLocation, Name, idIdentifierPreferred } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.subject.update({
                where: { idSubject, },
                data: {
                    Unit:           { connect: { idUnit }, },
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : { disconnect: true, },
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : { disconnect: true, },
                    Identifier:     idIdentifierPreferred ? { connect: { idIdentifier: idIdentifierPreferred }, } : { disconnect: true, },
                    Name,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idSubject } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idSubject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idSubject: number): Promise<Subject | null> {
        if (!idSubject)
            return null;
        try {
            return DBC.CopyObject<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.subject.findUnique({ where: { idSubject, }, }), Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Subject[] | null> {
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.subject.findMany(), Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromUnit(idUnit: number): Promise<Subject[] | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.subject.findMany({ where: { idUnit } }), Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.fetchFromUnit', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of subjects that are connected to any of the specified items.
     * Subjects are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified items.
     * @param idItems Array of Item.idItem
     */
    static async fetchMasterFromItems(idItems: number[]): Promise<Subject[] | null> {
        if (!idItems || idItems.length == 0)
            return null;
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.$queryRaw<Subject[]>`
                SELECT DISTINCT S.*
                FROM Subject AS S
                JOIN SystemObject AS SOS ON (S.idSubject = SOS.idSubject)
                JOIN SystemObjectXref AS SOX ON (SOS.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOI ON (SOX.idSystemObjectDerived = SOI.idSystemObject)
                WHERE SOI.idItem IN (${Prisma.join(idItems)})`, Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.fetchMasterFromItems', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of subjects that are connected to any of the specified projects.
     * Subjects are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified projects.
     * @param idProjects Array of Project.idProject
     */
    static async fetchDerivedFromProjects(idProjects: number[]): Promise<Subject[] | null> {
        if (!idProjects || idProjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.$queryRaw<Subject[]>`
                SELECT DISTINCT S.*
                FROM Subject AS S
                JOIN SystemObject AS SOS ON (S.idSubject = SOS.idSubject)
                JOIN SystemObjectXref AS SOX ON (SOS.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOP ON (SOX.idSystemObjectMaster = SOP.idSystemObject)
                WHERE SOP.idProject IN (${Prisma.join(idProjects)})`, Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.fetchDerivedFromProjects', LOG.LS.eDB, error);
            return null;
        }
    }

    static async clearPreferredIdentifier(idIdentifier: number): Promise<boolean> {
        // Updates all subjects that have Subject.idIdentifierPreferred === idIdentifier; sets this field to null
        if (!idIdentifier)
            return false;
        try {
            // Initially, I wrote this as an efficient UPDATE script, but this defeats
            // database auditing.  Instead, let's fetch matching records, and then update them
            // one by one.

            // const rows: number = await DBC.DBConnection.prisma.$executeRaw`
            //     UPDATE Subject SET idIdentifierPreferred = NULL
            //     WHERE idIdentifierPreferred = ${idIdentifier}`;
            // LOG.info(`Subject.clearPreferredIdentifier ${idIdentifier} from ${rows} Subjects`, LOG.LS.eTEST);
            // return (rows >= 0);

            let retValue: boolean = true;
            const subjects: Subject[] | null = DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.$queryRaw<Subject[]>`
                SELECT *
                FROM Subject
                WHERE idIdentifierPreferred = ${idIdentifier}`, Subject); /* istanbul ignore next */

            if (!subjects) {
                LOG.error('DBAPI.Subject.clearPreferredIdentifier failed', LOG.LS.eDB);
                return false;
            }
            for (const subject of subjects) {
                subject.idIdentifierPreferred = null;
                retValue = await subject.update() && retValue;
            }
            LOG.info(`Subject.clearPreferredIdentifier ${idIdentifier} from ${subjects.length} Subjects`, LOG.LS.eTEST);
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Subject.clearPreferredIdentifier', LOG.LS.eDB, error);
            return false;
        }
    }
}
