/* eslint-disable camelcase */
import { UserPersonalizationSystemObject as UserPersonalizationSystemObjectBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class UserPersonalizationSystemObject extends DBO.DBObject<UserPersonalizationSystemObjectBase> implements UserPersonalizationSystemObjectBase {
    idUserPersonalizationSystemObject!: number;
    idSystemObject!: number;
    idUser!: number;
    Personalization!: string | null;

    constructor(input: UserPersonalizationSystemObjectBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idUser, idSystemObject, Personalization } = this;
            ({ idUserPersonalizationSystemObject: this.idUserPersonalizationSystemObject, idUser: this.idUser,
                idSystemObject: this.idSystemObject, Personalization: this.Personalization } =
                await DBConnectionFactory.prisma.userPersonalizationSystemObject.create({
                    data: {
                        User:           { connect: { idUser }, },
                        SystemObject:   { connect: { idSystemObject }, },
                        Personalization,
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationSystemObject.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idUserPersonalizationSystemObject, idUser, idSystemObject, Personalization } = this;
            return await DBConnectionFactory.prisma.userPersonalizationSystemObject.update({
                where: { idUserPersonalizationSystemObject, },
                data: {
                    User:           { connect: { idUser }, },
                    SystemObject:   { connect: { idSystemObject }, },
                    Personalization,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationSystemObject.update', error);
            return false;
        }
    }

    static async fetch(idUserPersonalizationSystemObject: number): Promise<UserPersonalizationSystemObject | null> {
        try {
            return DBO.CopyObject<UserPersonalizationSystemObjectBase, UserPersonalizationSystemObject>(
                await DBConnectionFactory.prisma.userPersonalizationSystemObject.findOne({ where: { idUserPersonalizationSystemObject, }, }), UserPersonalizationSystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationSystemObject.fetch', error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<UserPersonalizationSystemObject[] | null> {
        try {
            return DBO.CopyArray<UserPersonalizationSystemObjectBase, UserPersonalizationSystemObject>(
                await DBConnectionFactory.prisma.userPersonalizationSystemObject.findMany({ where: { idUser } }), UserPersonalizationSystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationSystemObject.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<UserPersonalizationSystemObject[] | null> {
        try {
            return DBO.CopyArray<UserPersonalizationSystemObjectBase, UserPersonalizationSystemObject>(
                await DBConnectionFactory.prisma.userPersonalizationSystemObject.findMany({ where: { idSystemObject } }), UserPersonalizationSystemObject);
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationSystemObject.fetchFromSystemObject', error);
            return null;
        }
    }
}
