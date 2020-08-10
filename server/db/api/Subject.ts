/* eslint-disable camelcase */
import { Subject as SubjectBase, SystemObject as SystemObjectBase, join } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Subject extends DBC.DBObject<SubjectBase> implements SubjectBase {
    idSubject!: number;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    idUnit!: number;
    Name!: string;
    idIdentifierPreferred!: number | null;

    private idAssetThumbnailOrig!: number | null;
    private idGeoLocationOrig!: number | null;
    private idIdentifierPreferredOrig!: number | null;

    constructor(input: SubjectBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
        this.idGeoLocationOrig = this.idGeoLocation;
        this.idIdentifierPreferredOrig = this.idIdentifierPreferred;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUnit, idAssetThumbnail, idGeoLocation, Name, idIdentifierPreferred } = this;
            ({ idSubject: this.idSubject, idUnit: this.idUnit, idAssetThumbnail: this.idAssetThumbnail,
                idGeoLocation: this.idGeoLocation, Name: this.Name, idIdentifierPreferred: this.idIdentifierPreferred } =
                await DBC.DBConnection.prisma.subject.create({
                    data: {
                        Unit:           { connect: { idUnit }, },
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                        Name,
                        Identifier:     idIdentifierPreferred ? { connect: { idIdentifier: idIdentifierPreferred }, } : undefined,
                        SystemObject:   { create: { Retired: false }, },
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Subject.create', error);
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idSubject, idUnit, idAssetThumbnail, idGeoLocation, Name, idIdentifierPreferred,
                idAssetThumbnailOrig, idGeoLocationOrig, idIdentifierPreferredOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.subject.update({
                where: { idSubject, },
                data: {
                    Unit:           { connect: { idUnit }, },
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : idGeoLocationOrig ? { disconnect: true, } : undefined,
                    Identifier:     idIdentifierPreferred ? { connect: { idIdentifier: idIdentifierPreferred }, } : idIdentifierPreferredOrig ? { disconnect: true, } : undefined,
                    Name,
                },
            }) ? true : /* istanbul ignore next */ false;
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Subject.update', error);
            return false;
        }
    }

    async fetchSystemObject(): Promise<SystemObject | null> {
        try {
            const { idSubject } = this;
            return DBC.CopyObject<SystemObjectBase, SystemObject>(
                await DBC.DBConnection.prisma.systemObject.findOne({ where: { idSubject, }, }), SystemObject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.subject.fetchSystemObject', error);
            return null;
        }
    }

    static async fetch(idSubject: number): Promise<Subject | null> {
        if (!idSubject)
            return null;
        try {
            return DBC.CopyObject<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.subject.findOne({ where: { idSubject, }, }), Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Subject.fetch', error);
            return null;
        }
    }

    static async fetchFromUnit(idUnit: number): Promise<Subject[] | null> {
        if (!idUnit)
            return null;
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.subject.findMany({ where: { idUnit } }), Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Subject.fetchFromUnit', error);
            return null;
        }
    }

    /**
     * Computes the array of subjects that are connected to any of the specified items.
     * Subjects are connected to system objects; we examine those system objects which are in a *master* relationship
     * to system objects connected to any of the specified items.
     * @param idItems Array of Item.idItem
     */
    static async fetchMasterFromItems(idItems: number[]): Promise<Subject[] | null> {
        if (!idItems || idItems.length == 0)
            return null;
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.$queryRaw<Subject[]>`
                SELECT DISTINCT S.*
                FROM Subject AS S
                JOIN SystemObject AS SOS ON (S.idSubject = SOS.idSubject)
                JOIN SystemObjectXref AS SOX ON (SOS.idSystemObject = SOX.idSystemObjectMaster)
                JOIN SystemObject AS SOI ON (SOX.idSystemObjectDerived = SOI.idSystemObject)
                WHERE SOI.idItem IN (${join(idItems)})`, Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchMasterFromItems', error);
            return null;
        }
    }

    /**
     * Computes the array of subjects that are connected to any of the specified projects.
     * Subjects are connected to system objects; we examine those system objects which are in a *derived* relationship
     * to system objects connected to any of the specified projects.
     * @param idProjects Array of Project.idProject
     */
    static async fetchDerivedFromProjects(idProjects: number[]): Promise<Subject[] | null> {
        if (!idProjects || idProjects.length == 0)
            return null;
        try {
            return DBC.CopyArray<SubjectBase, Subject>(
                await DBC.DBConnection.prisma.$queryRaw<Subject[]>`
                SELECT DISTINCT S.*
                FROM Subject AS S
                JOIN SystemObject AS SOS ON (S.idSubject = SOS.idSubject)
                JOIN SystemObjectXref AS SOX ON (SOS.idSystemObject = SOX.idSystemObjectDerived)
                JOIN SystemObject AS SOP ON (SOX.idSystemObjectMaster = SOP.idSystemObject)
                WHERE SOP.idProject IN (${join(idProjects)})`, Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Item.fetchDerivedFromProjects', error);
            return null;
        }
    }
}
