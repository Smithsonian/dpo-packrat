/* eslint-disable camelcase */
import { UnitEdan as UnitEdanBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class UnitEdan extends DBC.DBObject<UnitEdanBase> implements UnitEdanBase {
    idUnitEdan!: number;
    idUnit!: number | null;
    Abbreviation!: string;

    private idUnitOrig!: number | null;

    constructor(input: UnitEdanBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idUnitOrig = this.idUnit;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUnit, Abbreviation } = this;
            ({ idUnitEdan: this.idUnitEdan, idUnit: this.idUnit, Abbreviation: this.Abbreviation } =
                await DBC.DBConnection.prisma.unitEdan.create({
                    data: {
                        Unit:          idUnit ? { connect: { idUnit }, } : undefined,
                        Abbreviation,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UnitEdan.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idUnitEdan, idUnit, Abbreviation, idUnitOrig } = this;
            return await DBC.DBConnection.prisma.unitEdan.update({
                where: { idUnitEdan, },
                data: {
                    Unit:          idUnit ? { connect: { idUnit }, } : idUnitOrig ? { disconnect: true, } : undefined,
                    Abbreviation,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UnitEdan.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idUnitEdan: number): Promise<UnitEdan | null> {
        if (!idUnitEdan)
            return null;
        try {
            return DBC.CopyObject<UnitEdanBase, UnitEdan>(
                await DBC.DBConnection.prisma.unitEdan.findUnique({ where: { idUnitEdan, }, }), UnitEdan);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UnitEdan.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    /** Computes the array of unitEdans that are connected to the specified unit */
    static async fetchFromUnit(idUnit: number): Promise<UnitEdan[] | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyArray<UnitEdanBase, UnitEdan>(
                await DBC.DBConnection.prisma.unitEdan.findMany({ where: { idUnit } }), UnitEdan);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UnitEdan.fetchFromUnit', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromAbbreviation(Abbreviation: string): Promise<UnitEdan | null> {
        if (!Abbreviation)
            return null;
        try {
            return DBC.CopyObject<UnitEdanBase, UnitEdan>(
                await DBC.DBConnection.prisma.unitEdan.findUnique({ where: { Abbreviation }, }), UnitEdan);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Unit.fetchFromAbbreviation', LOG.LS.eDB, error);
            return null;
        }
    }

}
