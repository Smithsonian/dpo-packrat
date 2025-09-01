/* eslint-disable camelcase */
import { Contact as ContactBase } from '@prisma/client';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';

export class Contact extends DBC.DBObject<ContactBase> implements ContactBase {
    idContact!: number;
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
            // Sanitize helpers
            const fkOrNull = (n: number | null | undefined) =>
                (typeof n === 'number' && n > 0) ? n : null;

            const strOrNull = (s: string | null | undefined) => {
                if (s === null || s === undefined) return null;
                const t = String(s).trim();
                return t.length ? t : null;
            };

            // Build payload WITHOUT idContact
            const data = {
                Name: String(this.Name ?? '').trim(),                // assume required
                EmailAddress: String(this.EmailAddress ?? '').trim(),// assume required
                Title: strOrNull(this.Title),
                idUnit: fkOrNull(this.idUnit as number | null | undefined),
                Department: strOrNull(this.Department),
            };

            // Basic guardrails if Name/Email are required in your schema
            if (!data.Name) throw new Error('Name is required');
            if (!data.EmailAddress) throw new Error('EmailAddress is required');

            const created = await DBC.DBConnection.prisma.contact.create({ data });

            // Reflect DB-generated / canonical values back onto the instance
            this.idContact   = created.idContact;
            this.Name        = created.Name;
            this.EmailAddress= created.EmailAddress;
            this.Title       = created.Title;
            this.idUnit      = created.idUnit;
            this.Department  = created.Department;

            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(
                RK.LogSection.eDB,
                'create failed',
                H.Helpers.getErrorString(error),
                { ...this },
                'DB.Contact'
            );
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idContact, Name, EmailAddress, Title, idUnit, Department } = this;
            return await DBC.DBConnection.prisma.contact.update({
                where: { idContact, },
                data: {
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
