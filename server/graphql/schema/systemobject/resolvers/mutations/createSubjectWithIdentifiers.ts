import { CreateSubjectWithIdentifiersResult, MutationCreateSubjectWithIdentifiersArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as DBAPI from '../../../../../db';
import * as COL from '../../../../../collections/interface';
import { VocabularyCache, eVocabularySetID } from '../../../../../cache';

export default async function createSubjectWithIdentifiers(_: Parent, args: MutationCreateSubjectWithIdentifiersArgs): Promise<CreateSubjectWithIdentifiersResult> {
    const {
        input: { systemCreated, identifiers, subject }
    } = args;
    const { idUnit, Name, idGeoLocation } = subject;
    const ICOL: COL.ICollection = COL.CollectionFactory.getInstance();

    const identifiersList: DBAPI.Identifier[] = [];

    const ARKId: string = ICOL.generateArk(null, false);
    const identifierTypeARK = await VocabularyCache.vocabularyBySetAndTerm(eVocabularySetID.eIdentifierIdentifierType, 'ARK');
    const idIentifierType = identifierTypeARK?.idVocabulary || 79;

    let idIdentifierPreferred: null | number = null;

    if (systemCreated) {
        const Identifier = new DBAPI.Identifier({
            idIdentifier: 0,
            idVIdentifierType: idIentifierType,
            IdentifierValue: ARKId,
            idSystemObject: null
        });

        const successfulIdentifierCreation = await Identifier.create();
        if (successfulIdentifierCreation) {
            identifiersList.push(Identifier);
            const newIdentifier = await DBAPI.Identifier.fetchFromIdentifierValue(ARKId);
            if (newIdentifier && newIdentifier.length) idIdentifierPreferred = newIdentifier[0].idIdentifier;
        }
    }

    for await (const identifier of identifiers) {
        const Identifier = new DBAPI.Identifier({
            idIdentifier: 0,
            idVIdentifierType: identifier.identifierType,
            IdentifierValue: identifier.identifierValue,
            idSystemObject: null
        });

        const successfulIdentifierCreation = await Identifier.create();
        if (successfulIdentifierCreation) {
            identifiersList.push(Identifier);

            // TODO: Do we want system created to always be preferred?
            // If so, uncomment L52 and comment L53
            // if (identifier.preferred && !idIdentifierPreferred) {
            if (identifier.preferred) {
                const newIdentifier = await DBAPI.Identifier.fetchFromIdentifierValue(identifier.identifierValue);
                if (newIdentifier && newIdentifier.length) idIdentifierPreferred = newIdentifier[0].idIdentifier;
            }
        }
    }

    if (idIdentifierPreferred === null) {
        const preferredIdentifier = identifiersList.find(identifier => identifier.idVIdentifierType === idIentifierType);
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
        for await (const identifier of identifiersList) {
            if (SO?.idSystemObject) identifier.idSystemObject = SO.idSystemObject;
            await identifier.update();
        }
    } else {
        return { success: false, message: 'Error when creating subject' };
    }

    return { success: true, message: '' };
}
