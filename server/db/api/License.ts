/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-empty-function */
import { License as LicenseBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class License extends DBO.DBObject<LicenseBase> implements LicenseBase {
    idLicense!: number;
    Description!: string;
    Name!: string;

    constructor(input: LicenseBase) {
        super(input);
    }

    protected updateCachedValues(): void { }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Description, Name } = this;
            ({ idLicense: this.idLicense, Description: this.Description, Name: this.Name } =
                await DBConnectionFactory.prisma.license.create({ data: { Name, Description }, }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.License.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idLicense, Name, Description } = this;
            return await DBConnectionFactory.prisma.license.update({
                where: { idLicense, },
                data: { Name, Description, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.License.update', error);
            return false;
        }
    }

    static async fetch(idLicense: number): Promise<License | null> {
        if (!idLicense)
            return null;
        try {
            return DBO.CopyObject<LicenseBase, License>(
                await DBConnectionFactory.prisma.license.findOne({ where: { idLicense, }, }), License);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.License.fetch', error);
            return null;
        }
    }
}