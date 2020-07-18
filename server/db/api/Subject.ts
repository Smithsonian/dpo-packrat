/* eslint-disable camelcase */
import { Subject as SubjectBase, SystemObject as SystemObjectBase } from '@prisma/client';
import { SystemObject } from '..';
import * as DBC from '../connection';
import * as LOG from '../../utils/logger';

export class Subject extends DBC.DBObject<SubjectBase> implements SubjectBase {
    idSubject!: number;
    idAssetThumbnail!: number | null;
    idGeoLocation!: number | null;
    idUnit!: number;
    Name!: string;

    private idAssetThumbnailOrig!: number | null;
    private idGeoLocationOrig!: number | null;

    constructor(input: SubjectBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.idAssetThumbnailOrig = this.idAssetThumbnail;
        this.idGeoLocationOrig = this.idGeoLocation;
    }

    protected async createWorker(): Promise<boolean> {
        try {
            const { idUnit, idAssetThumbnail, idGeoLocation, Name } = this;
            ({ idSubject: this.idSubject, idUnit: this.idUnit, idAssetThumbnail: this.idAssetThumbnail,
                idGeoLocation: this.idGeoLocation, Name: this.Name } =
                await DBC.DBConnectionFactory.prisma.subject.create({
                    data: {
                        Unit:           { connect: { idUnit }, },
                        Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : undefined,
                        GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : undefined,
                        Name,
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
            const { idSubject, idUnit, idAssetThumbnail, idGeoLocation, Name, idAssetThumbnailOrig, idGeoLocationOrig } = this;
            const retValue: boolean = await DBC.DBConnectionFactory.prisma.subject.update({
                where: { idSubject, },
                data: {
                    Unit:           { connect: { idUnit }, },
                    Asset:          idAssetThumbnail ? { connect: { idAsset: idAssetThumbnail }, } : idAssetThumbnailOrig ? { disconnect: true, } : undefined,
                    GeoLocation:    idGeoLocation ? { connect: { idGeoLocation }, } : idGeoLocationOrig ? { disconnect: true, } : undefined,
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
                await DBC.DBConnectionFactory.prisma.systemObject.findOne({ where: { idSubject, }, }), SystemObject);
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
                await DBC.DBConnectionFactory.prisma.subject.findOne({ where: { idSubject, }, }), Subject);
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
                await DBC.DBConnectionFactory.prisma.subject.findMany({ where: { idUnit } }), Subject);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Subject.fetchFromUnit', error);
            return null;
        }
    }
}
