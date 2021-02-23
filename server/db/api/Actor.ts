/* eslint-disable camelcase */
import { Actor as ActorBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Actor extends DBC.DBObject<ActorBase> implements ActorBase, SystemObjectBased {
    idActor!: number;
    idUnit!: number | null;
    IndividualName!: string | null;
    OrganizationName!: string | null;

    private idUnitOrig!: number | null;

    constructor(input: ActorBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idUnitOrig = this.idUnit;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUnit, IndividualName, OrganizationName } = this;
            ({ idActor: this.idActor, idUnit: this.idUnit, IndividualName: this.IndividualName, OrganizationName: this.OrganizationName } =
                await DBC.DBConnection.prisma.actor.create({
                    data: {
                        IndividualName,
                        OrganizationName,
                        Unit:               idUnit ? { connect: { idUnit }, } : undefined,
                        SystemObject:       { create: { Retired: false }, },
                    }
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Actor.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idActor, idUnit, IndividualName, OrganizationName, idUnitOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.actor.update({
                where: { idActor, },
                data: {
                    IndividualName,
                    OrganizationName,
                    Unit:               idUnit ? { connect: { idUnit }, } : idUnitOrig ? { disconnect: true, } : undefined,
                }
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Actor.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idActor } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idActor, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Actor.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idActor: number): Promise<Actor | null> {
        if (!idActor)
            return null;
        try {
            return DBC.CopyObject<ActorBase, Actor>(
                await DBC.DBConnection.prisma.actor.findOne({ where: { idActor, }, }), Actor);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Actor.fetch', error);
            return null;
        }
    }

    static async fetchAll(): Promise<Actor[] | null> {
        try {
            return DBC.CopyArray<ActorBase, Actor>(
                await DBC.DBConnection.prisma.actor.findMany(), Actor);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Actor.fetchAll', error);
            return null;
        }
    }

    static async fetchFromUnit(idUnit: number): Promise<Actor[] | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyArray<ActorBase, Actor>(
                await DBC.DBConnection.prisma.actor.findMany({ where: { idUnit } }), Actor);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Actor.fetchFromUnit', error);
            return null;
        }
    }
}
