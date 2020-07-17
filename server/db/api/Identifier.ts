/* eslint-disable camelcase */
import { Identifier as IdentifierBase } from '@prisma/client';
import { DBConnectionFactory } from '..';
import * as DBO from '../api/DBObject';
import * as LOG from '../../utils/logger';

export class Identifier extends DBO.DBObject<IdentifierBase> implements IdentifierBase {
    idIdentifier!: number;
    IdentifierValue!: string;
    idSystemObject!: number | null;
    idVIdentifierType!: number;

    private idSystemObjectOrig!: number | null;

    constructor(input: IdentifierBase) {
        super(input);
        this.updateCachedValues();
    }

    private updateCachedValues(): void {
        this.idSystemObjectOrig = this.idSystemObject;
    }

    async create(): Promise<boolean> {
        try {
            const { IdentifierValue, idVIdentifierType, idSystemObject } = this;
            ({ idIdentifier: this.idIdentifier, IdentifierValue: this.IdentifierValue,
                idVIdentifierType: this.idVIdentifierType, idSystemObject: this.idSystemObject } =
                await DBConnectionFactory.prisma.identifier.create({
                    data: {
                        IdentifierValue,
                        Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                        SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
                    },
                }));
            this.updateCachedValues();
            return true;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Identifier.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idIdentifier, IdentifierValue, idVIdentifierType, idSystemObject, idSystemObjectOrig } = this;
            const retValue: boolean = await DBConnectionFactory.prisma.identifier.update({
                where: { idIdentifier, },
                data: {
                    IdentifierValue,
                    Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                    SystemObject: idSystemObject ? { connect: { idSystemObject }, } : idSystemObjectOrig ? { disconnect: true, } : undefined,
                },
            }) ? true : /* istanbul ignore next */ false;
            this.updateCachedValues();
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Identifier.update', error);
            return false;
        }
    }

    static async fetch(idIdentifier: number): Promise<Identifier | null> {
        if (!idIdentifier)
            return null;
        try {
            return DBO.CopyObject<IdentifierBase, Identifier>(
                await DBConnectionFactory.prisma.identifier.findOne({ where: { idIdentifier, }, }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Identifier.fetch', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<Identifier[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBO.CopyArray<IdentifierBase, Identifier>(
                await DBConnectionFactory.prisma.identifier.findMany({ where: { idSystemObject } }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            LOG.logger.error('DBAPI.Identifier.fetchFromSystemObject', error);
            return null;
        }
    }
}
