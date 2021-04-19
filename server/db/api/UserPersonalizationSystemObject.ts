/* eslint-disable camelcase */
import { UserPersonalizationSystemObject as UserPersonalizationSystemObjectBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class UserPersonalizationSystemObject extends DBC.DBObject<UserPersonalizationSystemObjectBase> implements UserPersonalizationSystemObjectBase {
    idUserPersonalizationSystemObject!: number;
    idSystemObject!: number;
    idUser!: number;
    Personalization!: string | null;

    constructor(input: UserPersonalizationSystemObjectBase) {
        super(input);
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUser, idSystemObject, Personalization } = this;
            ({ idUserPersonalizationSystemObject: this.idUserPersonalizationSystemObject, idUser: this.idUser,
                idSystemObject: this.idSystemObject, Personalization: this.Personalization } =
                await DBC.DBConnection.prisma.userPersonalizationSystemObject.create({
                    data: {
                        User:           { connect: { idUser }, },
                        SystemObject:   { connect: { idSystemObject }, },
                        Personalization,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UserPersonalizationSystemObject.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idUserPersonalizationSystemObject, idUser, idSystemObject, Personalization } = this;
            return await DBC.DBConnection.prisma.userPersonalizationSystemObject.update({
                where: { idUserPersonalizationSystemObject, },
                data: {
                    User:           { connect: { idUser }, },
                    SystemObject:   { connect: { idSystemObject }, },
                    Personalization,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UserPersonalizationSystemObject.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idUserPersonalizationSystemObject: number): Promise<UserPersonalizationSystemObject | null> {
        if (!idUserPersonalizationSystemObject)
            return null;
        try {
            return DBC.CopyObject<UserPersonalizationSystemObjectBase, UserPersonalizationSystemObject>(
                await DBC.DBConnection.prisma.userPersonalizationSystemObject.findUnique({ where: { idUserPersonalizationSystemObject, }, }), UserPersonalizationSystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UserPersonalizationSystemObject.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<UserPersonalizationSystemObject[] | null> {
        if (!idUser)
            return null;
        try {
            return DBC.CopyArray<UserPersonalizationSystemObjectBase, UserPersonalizationSystemObject>(
                await DBC.DBConnection.prisma.userPersonalizationSystemObject.findMany({ where: { idUser } }), UserPersonalizationSystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UserPersonalizationSystemObject.fetchFromUser', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<UserPersonalizationSystemObject[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<UserPersonalizationSystemObjectBase, UserPersonalizationSystemObject>(
                await DBC.DBConnection.prisma.userPersonalizationSystemObject.findMany({ where: { idSystemObject } }), UserPersonalizationSystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.UserPersonalizationSystemObject.fetchFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }
}
