/* eslint-disable camelcase */
import * as P from '@prisma/client';
import { DBConnectionFactory } from '..';
import { DBObject } from '../api/DBObject';
import * as LOG from '../../utils/logger';

/*
export function impregnate(PObject: P.AccessRole): AccessRole {
    Object.assign({}, PObject, {
        create: AccessRole.create,
        update: "",
    }
    return PObject;
}*/

// interface P.AccessRole { };

export class AccessRole extends DBObject<P.AccessRole> implements P.AccessRole {
    idAccessRole: number = 0;
    Name: string = '';

    constructor(input: P.AccessRole) {
        super(input);
        // this.data = input;
    }

    async create(): Promise<boolean> {
        try {
            const { Name } = this;
            ({ idAccessRole: this.idAccessRole, Name: this.Name } = await DBConnectionFactory.prisma.accessRole.create({
                data: { Name, }
            }));
            return true;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.create', error);
            return false;
        }
    }

    async update(): Promise<boolean> {
        return true;
    }

    static async fetch(idAccessRole: number): Promise<AccessRole | null> {
        try {
            const pObj: P.AccessRole | null = await DBConnectionFactory.prisma.accessRole.findOne({ where: { idAccessRole, }, });
            return pObj ? new AccessRole(pObj) : null;
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.fetch', error);
            return null;
        }
    }

    static async fetchFromXref(idAccessAction: number): Promise<P.AccessRole[] | null> {
        try {
            return await DBConnectionFactory.prisma.accessRole.findMany({
                where: {
                    AccessRoleAccessActionXref: {
                        some: { idAccessAction },
                    },
                },
            });
        } catch (error) {
            LOG.logger.error('DBAPI.AccessRole.fetchFromXref', error);
            return null;
        }
    }
}