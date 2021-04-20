/* eslint-disable camelcase */
import { Actor as ActorBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject, SystemObjectBased } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Actor extends DBC.DBObject<ActorBase> implements ActorBase, SystemObjectBased {
    idActor!: number;
    IndividualName!: string | null;
    OrganizationName!: string | null;
    idUnit!: number | null;

    constructor(input: ActorBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Actor'; }
    public fetchID(): number { return this.idActor; }

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
            LOG.error('DBAPI.Actor.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idActor, idUnit, IndividualName, OrganizationName } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.actor.update({
                where: { idActor, },
                data: {
                    IndividualName,
                    OrganizationName,
                    Unit:               idUnit ? { connect: { idUnit }, } : { disconnect: true, },
                }
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Actor.update', LOG.LS.eDB, error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idActor } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findUnique({ where: { idActor, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Actor.fetchSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetch(idActor: number): Promise<Actor | null> {
        if (!idActor)
            return null;
        try {
            return DBC.CopyObject<ActorBase, Actor>(
                await DBC.DBConnection.prisma.actor.findUnique({ where: { idActor, }, }), Actor);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Actor.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchAll(): Promise<Actor[] | null> {
        try {
            return DBC.CopyArray<ActorBase, Actor>(
                await DBC.DBConnection.prisma.actor.findMany(), Actor);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.Actor.fetchAll', LOG.LS.eDB, error);
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
            LOG.error('DBAPI.Actor.fetchFromUnit', LOG.LS.eDB, error);
            return null;
        }
    }
}
