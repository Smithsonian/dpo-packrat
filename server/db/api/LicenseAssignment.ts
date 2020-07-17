/* eslint-disable camelcase */
import { LicenseAssignment as LicenseAssignmentBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class LicenseAssignment extends DBO.DBObject<LicenseAssignmentBase> implements LicenseAssignmentBase {
    idLicenseAssignment!: number;
    DateEnd!: Date | null;
    DateStart!: Date | null;
    idLicense!: number;
    idSystemObject!: number | null;
    idUserCreator!: number | null;

    constructor(input: LicenseAssignmentBase) {
        super(input);
    }

    async create(): Promise<boolean> {
        try {
            const { idLicense, idUserCreator, DateStart, DateEnd, idSystemObject } = this;
            ({ idLicenseAssignment: this.idLicenseAssignment, idUserCreator: this.idUserCreator,
                DateStart: this.DateStart, DateEnd: this.DateEnd, idSystemObject: this.idSystemObject } =
                await DBConnectionFactory.prisma.licenseAssignment.create({
                    data: {
                        License:        { connect: { idLicense }, },
                        User:           idUserCreator ? { connect: { idUser: idUserCreator }, } : undefined,
                        DateStart,
                        DateEnd,
                        SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : undefined
                    },
                }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.LicenseAssignment.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idLicenseAssignment, idLicense, idUserCreator, DateStart, DateEnd, idSystemObject } = this;
            return await DBConnectionFactory.prisma.licenseAssignment.update({
                where: { idLicenseAssignment, },
                data: {
                    License:        { connect: { idLicense }, },
                    User:           idUserCreator ? { connect: { idUser: idUserCreator }, } : undefined,
                    DateStart,
                    DateEnd,
                    SystemObject:   idSystemObject ? { connect: { idSystemObject }, } : undefined
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.LicenseAssignment.update', error);
            return false;
        }
    }

    static async fetch(idLicenseAssignment: number): Promise<LicenseAssignment | null> {
        if (!idLicenseAssignment)
            return null;
        try {
            return DBO.CopyObject<LicenseAssignmentBase, LicenseAssignment>(
                await DBConnectionFactory.prisma.licenseAssignment.findOne({ where: { idLicenseAssignment, }, }), LicenseAssignment);
        } catch (error) {
            LOG.logger.error('DBAPI.LicenseAssignment.fetch', error);
            return null;
        }
    }

    static async fetchFromLicense(idLicense: number): Promise<LicenseAssignment[] | null> {
        if (!idLicense)
            return null;
        try {
            return DBO.CopyArray<LicenseAssignmentBase, LicenseAssignment>(
                await DBConnectionFactory.prisma.licenseAssignment.findMany({ where: { idLicense } }), LicenseAssignment);
        } catch (error) {
            LOG.logger.error('DBAPI.LicenseAssignment.fetchFromLicense', error);
            return null;
        }
    }

    static async fetchFromUser(idUserCreator: number): Promise<LicenseAssignment[] | null> {
        if (!idUserCreator)
            return null;
        try {
            return DBO.CopyArray<LicenseAssignmentBase, LicenseAssignment>(
                await DBConnectionFactory.prisma.licenseAssignment.findMany({ where: { idUserCreator } }), LicenseAssignment);
        } catch (error) {
            LOG.logger.error('DBAPI.LicenseAssignment.fetchFromUser', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<LicenseAssignment[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBO.CopyArray<LicenseAssignmentBase, LicenseAssignment>(
                await DBConnectionFactory.prisma.licenseAssignment.findMany({ where: { idSystemObject } }), LicenseAssignment);
        } catch (error) {
            LOG.logger.error('DBAPI.LicenseAssignment.fetchFromSystemObject', error);
            return null;
        }
    }
}
