/* eslint-disable camelcase */
import { Actor as ActorBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { DBConnectionFactory, SystemObject } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Actor extends DBO.DBObject<ActorBase> implements ActorBase {
    idActor!: number;
    idUnit!: number | null;
    IndividualName!: string | null;
    OrganizationName!: string | null;

    constructor(input: ActorBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idUnit, IndividualName, OrganizationName } = this;
            ({ idActor: this.idActor, idUnit: this.idUnit, IndividualName: this.IndividualName, OrganizationName: this.OrganizationName } =
                await DBConnectionFactory.prisma.actor.create({
                    data: {
                        IndividualName,
                        OrganizationName,
                        Unit:               idUnit ? { connect: { idUnit }, } : undefined,
                        SystemObject:       { create: { Retired: false }, },
                    }
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Actor.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idActor, idUnit, IndividualName, OrganizationName } = this;
            return await DBConnectionFactory.prisma.actor.update({
                where: { idActor, },
                data: {
                    IndividualName,
                    OrganizationName,
                    Unit:               idUnit ? { connect: { idUnit }, } : undefined,
                }
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Actor.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idActor } = this;
            return DBO.CopyObject<SystemObjectBase, SystemObject>(
                await DBConnectionFactory.prisma.systemObject.findOne({ where: { idActor, }, }), SystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.Actor.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idActor: number): Promise<Actor | null> {
        try {
            return DBO.CopyObject<ActorBase, Actor>(
                await DBConnectionFactory.prisma.actor.findOne({ where: { idActor, }, }), Actor);
        } catch (error) {
            LOG.logger.error('DBAPI.Actor.fetch', error);
            return null;
        }
    }

    static async fetchSystemObjectAndActor(idActor: number): Promise<SystemObjectBase & { Actor: ActorBase | null} | null> {
        try {
            return await DBConnectionFactory.prisma.systemObject.findOne({ where: { idActor, }, include: { Actor: true, }, });
        } catch (error) {
            LOG.logger.error('DBAPI.fetchSystemObjectAndActor', error);
            return null;
        }
    }

    static async fetchFromUnit(idUnit: number): Promise<Actor[] | null> {
        try {
            return DBO.CopyArray<ActorBase, Actor>(
                await DBConnectionFactory.prisma.actor.findMany({ where: { idUnit } }), Actor);
        } catch (error) {
            LOG.logger.error('DBAPI.Actor.fetchFromUnit', error);
            return null;
        }
    }
}
