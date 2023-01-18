/* eslint-disable camelcase */
import { License as LicenseBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class License extends DBC.DBObject<LicenseBase> implements LicenseBase {
    idLicense!: number;
    Description!: string;
    Name!: string;
    RestrictLevel!: number;

    constructor(input: LicenseBase) {
        super(input);
    }

    public fetchTableName(): string { return 'License'; }
    public fetchID(): number { return this.idLicense; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { Description, Name, RestrictLevel } = this;
            ({ idLicense: this.idLicense, Description: this.Description, Name: this.Name, RestrictLevel: this.RestrictLevel } =
                await DBC.DBConnection.prisma.license.create({ data: { Name, Description, RestrictLevel }, }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('create', error);
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idLicense, Name, Description, RestrictLevel } = this;
            return await DBC.DBConnection.prisma.license.update({
                where: { idLicense, },
                data: { Name, Description, RestrictLevel, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            return this.logError('update', error);
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

    static async fetchAll(): Promise<License[] | null> {
        try {
            return DBC.CopyArray<LicenseBase, License>(
                await DBC.DBConnection.prisma.license.findMany({ orderBy: { Name: 'asc' } }), License);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.License.fetchAll', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchLicenseList(search: string): Promise<License[] | null> {
        if (!search)
            return this.fetchAll();
        try {
            return DBC.CopyArray<LicenseBase, License>(await DBC.DBConnection.prisma.license.findMany({
                orderBy: { Name: 'asc' },
                where: { Name: { contains: search }, },
            }), License);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.License.fetchLicenseList', LOG.LS.eDB, error);
            return null;
        }
    }
}