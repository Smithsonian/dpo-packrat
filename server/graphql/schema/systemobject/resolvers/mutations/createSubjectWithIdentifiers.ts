/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateSubjectWithIdentifiersResult, MutationCreateSubjectWithIdentifiersArgs } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import { handleMetadata } from './updateObjectDetails';
import * as DBAPI from '../../../../../db';
import * as COL from '../../../../../collections/interface';
import * as H from '../../../../../utils/helpers';
import { VocabularyCache } from '../../../../../cache';
import * as COMMON from '@dpo-packrat/common';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function createSubjectWithIdentifiers(_: Parent, args: MutationCreateSubjectWithIdentifiersArgs, context: Context): Promise<CreateSubjectWithIdentifiersResult> {
    const {
        input: { systemCreated, identifiers, subject, metadata }
    } = args;
    const { user } = context;
    const { idUnit, Name, idGeoLocation } = subject;

    const identifierTypeARK: DBAPI.Vocabulary | undefined = await VocabularyCache.vocabularyByEnum(COMMON.eVocabularyID.eIdentifierIdentifierTypeARK);
    if (!identifierTypeARK)
        return { success: false, message: 'Unable to lookup ARK Vocabulary' };
    const idIentifierType = identifierTypeARK.idVocabulary;

    const identifiersList: DBAPI.Identifier[] = [];
    let idIdentifierPreferred: null | number = null;

    if (systemCreated) {
        const ICOL: COL.ICollection = COL.CollectionFactory.getInstance();
        const ARKId: string = ICOL.generateArk(null, false, true);
        const Identifier = new DBAPI.Identifier({
            idIdentifier: 0,
            idVIdentifierType: idIentifierType,
            IdentifierValue: ARKId,
            idSystemObject: null
        });

        const successfulIdentifierCreation = await Identifier.create();
        if (successfulIdentifierCreation)
            idIdentifierPreferred = Identifier.idIdentifier;
    }

    for (const identifier of identifiers) {
        const Identifier = new DBAPI.Identifier({
            idIdentifier: 0,
            idVIdentifierType: identifier.identifierType,
            IdentifierValue: identifier.identifierValue,
            idSystemObject: null
        });

        const successfulIdentifierCreation = await Identifier.create();
        if (successfulIdentifierCreation) {
            identifiersList.push(Identifier);
            if (identifier.preferred)
                idIdentifierPreferred = Identifier.idIdentifier;
        }
    }

    if (idIdentifierPreferred === null) {
        const preferredIdentifier = identifiersList.find(identifier => identifier.idVIdentifierType === idIentifierType);
        if (preferredIdentifier?.idIdentifier)
            idIdentifierPreferred = preferredIdentifier.idIdentifier;
    }

    if (idIdentifierPreferred === null)
        return sendResult(false,'create subject failed','Error setting preferred identifier for subject');

    const Subject = new DBAPI.Subject({
        idSubject: 0,
        idUnit,
        idGeoLocation: idGeoLocation || null,
        Name,
        idAssetThumbnail: null,
        idIdentifierPreferred
    });
    if (!await Subject.create())
        return sendResult(false,'create subject failed','Error creating subject');

    const SO = await Subject.fetchSystemObject();
    if (!SO)
        return sendResult(false,'create subject failed','Unable to compute system object; subject only partially created');

    for (const identifier of identifiersList) {
        if (SO.idSystemObject)
            identifier.idSystemObject = SO.idSystemObject;
        await identifier.update();
    }

    let res: H.IOResults = await handleMetadata(SO.idSystemObject, metadata, user);
    if (!res.success)
        return sendResult(false,'create subject failed',res.error);

    res = await publishSubject(SO.idSystemObject);
    if (!res.success)
        return sendResult(false,'create subject failed',res.error);

    return sendResult(true,'create subject failed',undefined,{ Subject });
}

function sendResult(success: boolean, message: string, reason?: string, data?: any): CreateSubjectWithIdentifiersResult {
    if (!success)
        RK.logError(RK.LogSection.eGQL,message,reason,data,'GraphQL.SystemObject.Subject');
    return { success, message: message ?? '' };
}

async function publishSubject(idSystemObject: number): Promise<H.IOResults> {
    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    const success: boolean = await ICol.publish(idSystemObject, COMMON.ePublishedState.ePublished);
    return { success, error: success ? '' : 'Error encountered during publishing' };
}
