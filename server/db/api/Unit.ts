/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Unit as UnitBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Unit extends DBO.DBObject<UnitBase> implements UnitBase {
    idUnit!: number;
    Abbreviation!: string | null;
    ARKPrefix!: string | null;
    Name!: string;

    constructor(input: UnitBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Name, Abbreviation, ARKPrefix } = this;
            ({ idUnit: this.idUnit, Name: this.Name, Abbreviation: this.Abbreviation, ARKPrefix: this.ARKPrefix } =
                await DBConnectionFactory.prisma.unit.create({
                    data: {
                        Name,
                        Abbreviation,
                        ARKPrefix,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Unit.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idUnit, Name, Abbreviation, ARKPrefix } = this;
            return await DBConnectionFactory.prisma.unit.update({
                where: { idUnit, },
                data: {
                    Name,
                    Abbreviation,
                    ARKPrefix,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Unit.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idUnit } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idUnit, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.unit.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idUnit: number): Promise<Unit | null> {
        if (!idUnit)
            return null;
        try {
            return DBO.CopyObject<UnitBase, Unit>(
                await DBConnectionFactory.prisma.unit.findOne({ where: { idUnit, }, }), Unit);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Unit.fetch', error);
            return null;
        }
    }
}
