/* eslint-disable camelcase */
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

    async create(): Promise<boolean> {
        try {
            const { Description, Name } = this;
            ({ idLicense: this.idLicense, Description: this.Description, Name: this.Name } =
                await DBConnectionFactory.prisma.license.create({ data: { Name, Description }, }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.License.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idLicense, Name, Description } = this;
            return await DBConnectionFactory.prisma.license.update({
                where: { idLicense, },
                data: { Name, Description, },
            }) ? true : false;
        } catch (error) {
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
        } catch (error) {
            LOG.logger.error('DBAPI.License.fetch', error);
            return null;
        }
    }
}