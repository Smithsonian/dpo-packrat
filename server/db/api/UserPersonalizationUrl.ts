/* eslint-disable camelcase */
import { UserPersonalizationUrl as UserPersonalizationUrlBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class UserPersonalizationUrl extends DBO.DBObject<UserPersonalizationUrlBase> implements UserPersonalizationUrlBase {
    idUserPersonalizationUrl!: number;
    idUser!: number;
    Personalization!: string;
    URL!: string;

    constructor(input: UserPersonalizationUrlBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idUser, URL, Personalization } = this;
            ({ idUserPersonalizationUrl: this.idUserPersonalizationUrl, idUser: this.idUser,
                URL: this.URL, Personalization: this.Personalization } =
                await DBConnectionFactory.prisma.userPersonalizationUrl.create({
                    data: {
                        User:   { connect: { idUser }, },
                        URL,
                        Personalization,
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idUserPersonalizationUrl, idUser, URL, Personalization } = this;
            return await DBConnectionFactory.prisma.userPersonalizationUrl.update({
                where: { idUserPersonalizationUrl, },
                data: {
                    User:   { connect: { idUser }, },
                    URL,
                    Personalization,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.update', error);
            return false;
        }
    }

    static async fetch(idUserPersonalizationUrl: number): Promise<UserPersonalizationUrl | null> {
        try {
            return DBO.CopyObject<UserPersonalizationUrlBase, UserPersonalizationUrl>(
                await DBConnectionFactory.prisma.userPersonalizationUrl.findOne({ where: { idUserPersonalizationUrl, }, }), UserPersonalizationUrl);
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.fetch', error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<UserPersonalizationUrl[] | null> {
        try {
            return DBO.CopyArray<UserPersonalizationUrlBase, UserPersonalizationUrl>(
                await DBConnectionFactory.prisma.userPersonalizationUrl.findMany({ where: { idUser } }), UserPersonalizationUrl);
        } catch (error) {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.fetchFromUser', error);
            return null;
        }
    }
}
