/* eslint-disable camelcase */
import { Unit as UnitBase, SystemObject as SystemObjectBase, Prisma } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Unit extends DBC.DBObject<UnitBase> implements UnitBase, SystemObjectBased {
    idUnit!: number;
    Name!: string;
    Abbreviation!: string | null;
    ARKPrefix!: string | null;

    constructor(input: UnitBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Unit'; }
    public fetchID(): number { return this.idUnit; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, Abbreviation, ARKPrefix } = this;
            ({ idUnit: this.idUnit, Name: this.Name, Abbreviation: this.Abbreviation, ARKPrefix: this.ARKPrefix } =
                await DBC.DBConnection.prisma.unit.create({
                    data: {
                        Name,
                        Abbreviation,
                        ARKPrefix,
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
            const { idUnit, Name, Abbreviation, ARKPrefix } = this;
            return await DBC.DBConnection.prisma.unit.update({
                where: { idUnit, },
                data: {
                    Name,
                    Abbreviation,
                    ARKPrefix,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idUnit } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idUnit, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idUnit: number): Promise<Unit | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyObject<UnitBase, Unit>(
                await DBC.DBConnection.prisma.unit.findUnique({ where: { idUnit, }, }), Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Unit[] | null> {
        try {
            return DBC.CopyArray<UnitBase, Unit>(
                await DBC.DBConnection.prisma.unit.findMany({ orderBy: { Name: 'asc' } }), Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAllWithSubjects(): Promise<Unit[] | null> {
        try {
            return DBC.CopyArray<UnitBase, Unit>(
                await DBC.DBConnection.prisma.$queryRaw<Unit[]>`
                SELECT DISTINCT U.*
                FROM Unit AS U
                JOIN Subject AS S ON (U.idUnit = S.idUnit)`, Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchAllWithSubjects', LOG.LS.eDB, error);
            return null;
        }
    }

    /**
     * Computes the array of units that are connected to any of the specified projects.
     * Units  are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified projects.
     * @param idProjects Array of Project.idProject
     */
    static async fetchMasterFromProjects(idProjects: number[]): Promise<Unit[] | null> {
        if (!idProjects || idProjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<UnitBase, Unit>(
                await DBC.DBConnection.prisma.$queryRaw<Unit[]>`
                SELECT DISTINCT U.*
                FROM Unit AS U
                JOIN SystemObject AS SOU ON (U.idUnit = SOU.idUnit)
                JOIN SystemObjectXref AS SOX ON (SOU.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOP ON (SOX.idSystemObjectDerived = SOP.idSystemObject)
                WHERE SOP.idProject IN (${Prisma.join(idProjects)})`, Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchMasterFromProjects', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromUnitEdanAbbreviation(Abbreviation: string): Promise<Unit[] | null> {
        if (!Abbreviation)
            return null;
        try {
            return DBC.CopyArray<UnitBase, Unit>(
                await DBC.DBConnection.prisma.unit.findMany({ where: { UnitEdan: { some: { Abbreviation }, }, }, }), Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchFromUnitEdanAbbreviation', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromNameSearch(search: string): Promise<Unit[] | null> {
        if (!search)
            return this.fetchAll();
        try {
            return DBC.CopyArray<UnitBase, Unit>(
                await DBC.DBConnection.prisma.unit.findMany({
                    orderBy: { Name: 'asc' },
                    where: { OR: [
                        { UnitEdan: { some: { Abbreviation: { contains: search }, }, }, },
                        { Abbreviation: { contains: search }, },
                        { Name: { contains: search }, },
                    ] }, }), Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchFromNameSearch', LOG.LS.eDB, error);
            return null;
        }
    }
}