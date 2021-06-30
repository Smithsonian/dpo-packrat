import { CreateSubjectWithIdentifiersResult, MutationCreateSubjectWithIdentifiersArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as COL from '../../../../../collections/interface';
import { VocabularyCache, eVocabularySetID } from '../../../../../cache';

export default async function createSubjectWithIdentifiers(_: Parent, args: MutationCreateSubjectWithIdentifiersArgs): Promise<CreateSubjectWithIdentifiersResult> {
    const { input: { systemCreated, identifiers, subject } } = args;
    const { idUnit, Name, idGeoLocation } = subject;
    const ICOL: COL.ICollection = COL.CollectionFactory.getInstance();

    // Use identifiersList to keep track of all the created identifiers that need to update idSystemObject once subject is created
    const identifiersList: DBAPI.Identifier[] = [];

    const ARKId: string = ICOL.generateArk(null, false);
    const identifierTypeARK = await VocabularyCache.vocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'ARK');
    const idIentifierType = identifierTypeARK?.idVocabulary || 79;

    if (systemCreated) {
        const Identifier = new DBAPI.Identifier({
            idIdentifier: 0,
            idVIdentifierType: idIentifierType,
            IdentifierValue: ARKId,
            idSystemObject: null,
        });

        const successfulIdentifierCreation = await Identifier.create();
        if (successfulIdentifierCreation) identifiersList.push(Identifier);
    }

    let selectedIdentifierCount = 0;
    for await (const identifier of identifiers) {
        if (identifier.selected) selectedIdentifierCount++;

        const Identifier = new DBAPI.Identifier({
            idIdentifier: 0,
            idVIdentifierType: identifier.identifierType,
            IdentifierValue: identifier.identifierValue,
            idSystemObject: null
        });

        const successfulIdentifierCreation = await Identifier.create();
        if (successfulIdentifierCreation) identifiersList.push(Identifier);
    }

    let idIdentifierPreferred: number | null = null;

    // idIdentifierPreferred is set by a systemCreated ARKID > a selected identifier > an ARKID
    if (systemCreated) {
        const systemCreatedIdentifier = identifiersList.find((identifier) => identifier.IdentifierValue === ARKId);
        if (systemCreatedIdentifier?.idIdentifier) {
            idIdentifierPreferred = systemCreatedIdentifier?.idIdentifier;
        }
    } else if (selectedIdentifierCount === 1) {
        const selectedIdentifier = identifiers.find((identifier) => identifier.selected === true);
        const preferredIdentifier = identifiersList.find((identifier) => identifier.IdentifierValue === selectedIdentifier?.identifierValue);
        if (preferredIdentifier?.idIdentifier) idIdentifierPreferred = preferredIdentifier.idIdentifier;
    } else {
        const preferredIdentifier = identifiersList.find((identifier) => identifier.idVIdentifierType === idIentifierType);
        if (preferredIdentifier?.idIdentifier) idIdentifierPreferred = preferredIdentifier.idIdentifier;
    }

    if (idIdentifierPreferred === null) {
        return { success: false, message: 'Error when setting preferred identifier for subject' };
    }

    const Subject = new DBAPI.Subject({
        idSubject: 0,
        idUnit,
        idGeoLocation: idGeoLocation || null,
        Name,
        idAssetThumbnail: null,
        idIdentifierPreferred
    });
    const successfulSubjectCreation = await Subject.create();

    if (successfulSubjectCreation) {
        const SO = await Subject.fetchSystemObject();
        identifiersList.forEach(async (identifier) => {
            if (SO?.idSystemObject) identifier.idSystemObject = SO.idSystemObject;
            await identifier.update();
        });
    } else {
        return { success: false, message: 'Error when creating subject' };
    }

    return { success: true, message: '' };
}
