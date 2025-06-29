/* eslint-disable camelcase */
import { UserPersonalizationUrl as UserPersonalizationUrlBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class UserPersonalizationUrl extends DBC.DBObject<UserPersonalizationUrlBase> implements UserPersonalizationUrlBase {
    idUserPersonalizationUrl!: number;
    idUser!: number;
    URL!: string;
    Personalization!: string;

    constructor(input: UserPersonalizationUrlBase) {
        super(input);
    }

    public fetchTableName(): string { return 'UserPersonalizationUrl'; }
    public fetchID(): number { return this.idUserPersonalizationUrl; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUser, URL, Personalization } = this;
            ({ idUserPersonalizationUrl: this.idUserPersonalizationUrl, idUser: this.idUser,
                URL: this.URL, Personalization: this.Personalization } =
                await DBC.DBConnection.prisma.userPersonalizationUrl.create({
                    data: {
                        User:   { connect: { idUser }, },
                        URL,
                        Personalization,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.User.Personalize.URL');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idUserPersonalizationUrl, idUser, URL, Personalization } = this;
            return await DBC.DBConnection.prisma.userPersonalizationUrl.update({
                where: { idUserPersonalizationUrl, },
                data: {
                    User:   { connect: { idUser }, },
                    URL,
                    Personalization,
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.User.Personalize.URL');
            return  false;
        }
    }

    static async fetch(idUserPersonalizationUrl: number): Promise<UserPersonalizationUrl | null> {
        if (!idUserPersonalizationUrl)
            return null;
        try {
            return DBC.CopyObject<UserPersonalizationUrlBase, UserPersonalizationUrl>(
                await DBC.DBConnection.prisma.userPersonalizationUrl.findUnique({ where: { idUserPersonalizationUrl, }, }), UserPersonalizationUrl);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.User.Personalize.URL');
            return null;
        }
    }

    static async fetchFromUser(idUser: number): Promise<UserPersonalizationUrl[] | null> {
        if (!idUser)
            return null;
        try {
            return DBC.CopyArray<UserPersonalizationUrlBase, UserPersonalizationUrl>(
                await DBC.DBConnection.prisma.userPersonalizationUrl.findMany({ where: { idUser } }), UserPersonalizationUrl);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from User failed',H.Helpers.getErrorString(error),{ ...this },'DB.User.Personalize.URL');
            return null;
        }
    }
}
