/* eslint-disable camelcase */
import { LicenseAssignment as LicenseAssignmentBase } from '@prisma/client';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class LicenseAssignment extends DBC.DBObject<LicenseAssignmentBase> implements LicenseAssignmentBase {
    idLicenseAssignment!: number;
    idLicense!: number;
    idUserCreator!: number | null;
    DateStart!: Date | null;
    DateEnd!: Date | null;
    idSystemObject!: number | null;

    constructor(input: LicenseAssignmentBase) {
        super(input);
    }

    public fetchTableName(): string { return 'LicenseAssignment'; }
    public fetchID(): number { return this.idLicenseAssignment; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idLicense, idUserCreator, DateStart, DateEnd, idSystemObject } = this;
            ({ idLicenseAssignment: this.idLicenseAssignment, idUserCreator: this.idUserCreator,
                DateStart: this.DateStart, DateEnd: this.DateEnd, idSystemObject: this.idSystemObject } =
                await DBC.DBConnection.prisma.licenseAssignment.create({
                    data: {
                        License:        { connect: { idLicense }, },
                        User:           idUserCreator ? { connect: { idUser: idUserCreator }, } : undefined,
                        DateStart,
                        DateEnd,
                        SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : undefined
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.LicenseAssignment.create', LOG.LS.eDB, error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idLicenseAssignment, idLicense, idUserCreator, DateStart, DateEnd, idSystemObject } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.licenseAssignment.update({
                where: { idLicenseAssignment, },
                data: {
                    License:        { connect: { idLicense }, },
                    User:           idUserCreator ? { connect: { idUser: idUserCreator }, } : { disconnect: true, },
                    DateStart,
                    DateEnd,
                    SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.LicenseAssignment.update', LOG.LS.eDB, error);
            return false;
        }
    }

    public assignmentActive(): boolean {
        const now: Date = new Date();
        const started: boolean = (this.DateStart === null) || (this.DateStart <= now);
        const ended: boolean = (this.DateEnd !== null) && (this.DateEnd <= now);
        return started && !ended;
    }

    static async fetch(idLicenseAssignment: number): Promise<LicenseAssignment | null> {
        if (!idLicenseAssignment)
            return null;
        try {
            return DBC.CopyObject<LicenseAssignmentBase, LicenseAssignment>(
                await DBC.DBConnection.prisma.licenseAssignment.findUnique({ where: { idLicenseAssignment, }, }), LicenseAssignment);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.LicenseAssignment.fetch', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromLicense(idLicense: number): Promise<LicenseAssignment[] | null> {
        if (!idLicense)
            return null;
        try {
            return DBC.CopyArray<LicenseAssignmentBase, LicenseAssignment>(
                await DBC.DBConnection.prisma.licenseAssignment.findMany({ where: { idLicense } }), LicenseAssignment);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.LicenseAssignment.fetchFromLicense', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromUser(idUserCreator: number): Promise<LicenseAssignment[] | null> {
        if (!idUserCreator)
            return null;
        try {
            return DBC.CopyArray<LicenseAssignmentBase, LicenseAssignment>(
                await DBC.DBConnection.prisma.licenseAssignment.findMany({ where: { idUserCreator } }), LicenseAssignment);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.LicenseAssignment.fetchFromUser', LOG.LS.eDB, error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<LicenseAssignment[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<LicenseAssignmentBase, LicenseAssignment>(
                await DBC.DBConnection.prisma.licenseAssignment.findMany({ where: { idSystemObject } }), LicenseAssignment);
        } catch (error) /* istanbul ignore next */ {
            LOG.error('DBAPI.LicenseAssignment.fetchFromSystemObject', LOG.LS.eDB, error);
            return null;
        }
    }
}
