/* eslint-disable camelcase */
import { Identifier as IdentifierBase } from '@prisma/client';
import { Subject } from './Subject';
import * as DBC from '../connection';
import * as H from '../../utils/helpers';
import { RecordKeeper as RK } from '../../records/recordKeeper';
import * as COMMON from '@dpo-packrat/common';
import * as CACHE from '../../cache';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { eAuditType, eNonSystemObjectType } from './ObjectType';

export class Identifier extends DBC.DBObject<IdentifierBase> implements IdentifierBase {
    idIdentifier!: number;
    IdentifierValue!: string;
    idVIdentifierType!: number;
    idSystemObject!: number | null;

    IdentifierValueOrig!: string;
    idVIdentifierTypeOrig!: number;

    constructor(input: IdentifierBase) {
        super(input);
    }

    protected updateCachedValues(): void {
        this.IdentifierValueOrig = this.IdentifierValue;
        this.idVIdentifierTypeOrig = this.idVIdentifierType;
    }

    public fetchTableName(): string { return 'Identifier'; }
    public fetchID(): number { return this.idIdentifier; }

    protected async createWorker(): Promise<boolean> {
        try {
            const { IdentifierValue, idVIdentifierType, idSystemObject } = this;
            ({ idIdentifier: this.idIdentifier, IdentifierValue: this.IdentifierValue,
                idVIdentifierType: this.idVIdentifierType, idSystemObject: this.idSystemObject } =
                await DBC.DBConnection.prisma.identifier.create({
                    data: {
                        IdentifierValue,
                        Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                        SystemObject: idSystemObject ? { connect: { idSystemObject }, } : undefined,
                    },
                }));
            return true;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'create failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.Identifier');
            return false;
        }
    }

    protected async updateWorker(): Promise<boolean> {
        try {
            const { idIdentifier, IdentifierValue, idVIdentifierType, idSystemObject, IdentifierValueOrig, idVIdentifierTypeOrig } = this;
            const retValue: boolean = await DBC.DBConnection.prisma.identifier.update({
                where: { idIdentifier, },
                data: {
                    IdentifierValue,
                    Vocabulary: { connect: { idVocabulary: idVIdentifierType }, },
                    SystemObject: idSystemObject ? { connect: { idSystemObject }, } : { disconnect: true, },
                },
            }) ? true : /* istanbul ignore next */ false;

            if (retValue && (IdentifierValue !== IdentifierValueOrig || idVIdentifierType !== idVIdentifierTypeOrig)) {
                const vocabEdan = await CACHE.VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeEdanRecordID);
                const isEdanBefore: boolean = vocabEdan ? idVIdentifierTypeOrig === vocabEdan.idVocabulary : false;
                const isEdanAfter:  boolean = vocabEdan ? idVIdentifierType     === vocabEdan.idVocabulary : false;
                if (isEdanBefore || isEdanAfter) {
                    await AuditFactory.emitSemantic({
                        action: eAuditType.eActionEDANIDChange,
                        target: { idObject: idIdentifier, eObjectType: eNonSystemObjectType.eIdentifier },
                        idSystemObject: idSystemObject ?? null,
                        payload: {
                            before: { IdentifierValue: IdentifierValueOrig, idVIdentifierType: idVIdentifierTypeOrig, isEDAN: isEdanBefore },
                            after:  { IdentifierValue, idVIdentifierType, isEDAN: isEdanAfter },
                        },
                    });
                }
            }
            return retValue;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'update failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.Identifier');
            return false;
        }
    }

    /** Don't call this directly; instead, let DBObject.delete() call this.
     * Code needing to delete a record should call this.delete(); */
    protected async deleteWorker(): Promise<boolean> {
        try {
            // LOG.info(`Identifier.deleteWorker ${JSON.stringify(this)}`, LOG.LS.eDB);
            // First, remove this identifier from subject.idIdentifierPreferred, for any such subjects that reference it
            const { idIdentifier } = this; /* istanbul ignore next */
            if (!await Subject.clearPreferredIdentifier(idIdentifier))
                return false;

            return await DBC.DBConnection.prisma.identifier.delete({
                where: { idIdentifier, },
            }) ? true : /* istanbul ignore next */ false;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'delete failed',H.Helpers.getErrorString(error),{ id: this.fetchID() },'DB.Identifier');
            return false;
        }
    }

    static async fetch(idIdentifier: number): Promise<Identifier | null> {
        if (!idIdentifier)
            return null;
        try {
            return DBC.CopyObject<IdentifierBase, Identifier>(
                await DBC.DBConnection.prisma.identifier.findUnique({ where: { idIdentifier, }, }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch failed',H.Helpers.getErrorString(error),{ idIdentifier },'DB.Identifier');
            return null;
        }
    }

    static async fetchFromIdentifierValue(IdentifierValue: string): Promise<Identifier[] | null> {
        if (!IdentifierValue) return null;
        try {
            return DBC.CopyArray<IdentifierBase, Identifier>(
                await DBC.DBConnection.prisma.identifier.findMany({ where: { IdentifierValue, }, }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from Identifier failed',H.Helpers.getErrorString(error),{ IdentifierValue },'DB.Identifier');
            return null;
        }
    }

    /** Returns Identifier specified by Subject.idIdentifierPreferred */
    static async fetchFromSubjectPreferred(idSubject: number): Promise<Identifier | null> {
        if (!idSubject)
            return null;
        try {
            const IDArray: Identifier[] | null =
                DBC.CopyArray<IdentifierBase, Identifier>(
                    await DBC.DBConnection.prisma.$queryRaw<Identifier[]>`
                    SELECT I.*
                    FROM Identifier AS I
                    JOIN Subject AS S ON (I.idIdentifier = S.idIdentifierPreferred)
                    WHERE S.idSubject = ${idSubject}`, Identifier);
            return (IDArray && IDArray.length > 0) ? IDArray[0] : /* istanbul ignore next */ null;
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from Subject preferred failed',H.Helpers.getErrorString(error),{ idSubject },'DB.Identifier');
            return null;
        }
    }

    static async fetchFromSystemObject(idSystemObject: number): Promise<Identifier[] | null> {
        if (!idSystemObject)
            return null;
        try {
            return DBC.CopyArray<IdentifierBase, Identifier>(
                await DBC.DBConnection.prisma.identifier.findMany({ where: { idSystemObject } }), Identifier);
        } catch (error) /* istanbul ignore next */ {
            RK.logError(RK.LogSection.eDB,'fetch from SystemObject failed',H.Helpers.getErrorString(error),{ idSystemObject },'DB.Identifier');
            return null;
        }
    }
}
