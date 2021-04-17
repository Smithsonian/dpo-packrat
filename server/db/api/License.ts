/* eslint-disable camelcase */
import { License as LicenseBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class License extends DBC.DBObject<LicenseBase> implements LicenseBase {
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
                await DBC.DBConnection.prisma.license.create({ data: { Name, Description }, }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.License.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idLicense, Name, Description } = this;
            return await DBC.DBConnection.prisma.license.update({
                where: { idLicense, },
                data: { Name, Description, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.License.update', LOG.LS.eDB, error);
            return false;
        }
    }

    static async fetch(idLicense: number): Promise<License | null> {
        if (!idLicense)
            return null;
        try {
            return DBC.CopyObject<LicenseBase, License>(
                await DBC.DBConnection.prisma.license.findUnique({ where: { idLicense, }, }), License);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.License.fetch', LOG.LS.eDB, error);
            return null;
        }
    }
}