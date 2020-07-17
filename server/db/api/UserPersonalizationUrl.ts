/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
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

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
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
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idUserPersonalizationUrl, idUser, URL, Personalization } = this;
            return await DBConnectionFactory.prisma.userPersonalizationUrl.update({
                where: { idUserPersonalizationUrl, },
                data: {
                    User:   { connect: { idUser }, },
                    URL,
                    Personalization,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.update', error);
            return false;
        }
    }

    static async fetch(idUserPersonalizationUrl: number): Promise<UserPersonalizationUrl | null> {
        if (!idUserPersonalizationUrl)
            return null;
        try {
            return DBO.CopyObject<UserPersonalizationUrlBase, UserPersonalizationUrl>(
                await DBConnectionFactory.prisma.userPersonalizationUrl.findOne({ where: { idUserPersonalizationUrl, }, }), UserPersonalizationUrl);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.fetch', error);
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<UserPersonalizationUrl[] | null> {
        if (!idUser)
            return null;
        try {
            return DBO.CopyArray<UserPersonalizationUrlBase, UserPersonalizationUrl>(
                await DBConnectionFactory.prisma.userPersonalizationUrl.findMany({ where: { idUser } }), UserPersonalizationUrl);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.UserPersonalizationUrl.fetchFromUser', error);
            return null;
        }
    }
}
