/* eslint-disable camelcase */
import { Contact as ContactBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class Contact extends DBC.DBObject<ContactBase> implements ContactBase {
    idContact!: number;
    idUser!: number | null;
    Name!: string;
    EmailAddress!: string;
    Title!: string | null;
    idUnit!: number | null;
    Department!: string | null;

    constructor(input: ContactBase) {
        super(input);
    }

    public fetchTableName(): string { return 'Contact'; }
    public fetchID(): number { return this.idContact; }

    protected async createWorker(): Promise<boolean> {
        try {
            let { idUser, Name, EmailAddress, Title, idUnit, Department } = this;
            ({ idUser, Name, EmailAddress, Title, idUnit, Department } =
                await DBC.DBConnection.prisma.contact.create({
                    data: {
                        idUser,
                        Name,
                        EmailAddress,
                        Title,
                        idUnit,
                        Department
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ ...this },'DB.Contact');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idContact, idUser, Name, EmailAddress, Title, idUnit, Department } = this;
            return await DBC.DBConnection.prisma.contact.update({
                where: { idContact, },
                data: {
                    idUser,
                    Name,
                    EmailAddress,
                    Title,
                    idUnit,
                    Department
                },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ ...this },'DB.Contact');
            return  false;
        }
    }

    static async fetch(idContact: number): Promise<Contact | null> {
        if (!idContact)
            return null;
        try {
            console.log('db: ',idContact);
            return DBC.CopyObject<ContactBase, Contact>(
                await DBC.DBConnection.prisma.contact.findUnique({ where: { idContact, }, }), Contact);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ ...this },'DB.Contact');
            return null;
        }
    }

    static async fetchAll(): Promise<Contact[] | null> {
        try {
            return DBC.CopyArray<ContactBase, Contact>(
                await DBC.DBConnection.prisma.contact.findMany(), Contact);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch all failed',H.Helpers.getErrorString(error),{ ...this },'DB.Contact');
            return null;
        }
    }
}
