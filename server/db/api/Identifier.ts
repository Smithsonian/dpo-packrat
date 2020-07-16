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

    constructor(input: IdentifierBase) {
        super(input);
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
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.Identifier.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        try {
            const { idIdentifier, IdentifierValue, idVIdentifierType, idSystemObject } = this;
            return await DBConnectionFactory.prisma.identifier.update({
                where: { idIdentifier, },
                data: {
                    IdentifierValue,
                    Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                    SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
                },
            }) ? true : false;
        } catch (error) {
            LOG.logger.error('DBAPI.Identifier.update', error);
            return false;
        }
    }

    static async fetch(idIdentifier: number): Promise<Identifier | null> {
        try {
            return DBO.CopyObject<IdentifierBase, Identifier>(
                await DBConnectionFactory.prisma.identifier.findOne({ where: { idIdentifier, }, }), Identifier);
        } catch (error) {
            LOG.logger.error('DBAPI.Identifier.fetch', error);
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<Identifier[] | null> {
        try {
            return DBO.CopyArray<IdentifierBase, Identifier>(
                await DBConnectionFactory.prisma.identifier.findMany({ where: { idSystemObject } }), Identifier);
        } catch (error) {
            LOG.logger.error('DBAPI.Identifier.fetchFromSystemObject', error);
            return null;
        }
    }
}
