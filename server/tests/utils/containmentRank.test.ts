import { eSystemObjectType, containmentRank, isContainerType, isInvertedContainmentEdge } from '@dpo-packrat/common';

describe('common containment rank', () => {
    test('containmentRank ranks the hierarchy top-down, leaves ancillary types unranked', () => {
        expect(containmentRank(eSystemObjectType.eUnit)).toBe(0);
        expect(containmentRank(eSystemObjectType.eProject)).toBe(1);
        expect(containmentRank(eSystemObjectType.eSubject)).toBe(2);
        expect(containmentRank(eSystemObjectType.eItem)).toBe(3);
        expect(containmentRank(eSystemObjectType.eModel)).toBe(4);
        expect(containmentRank(eSystemObjectType.eScene)).toBe(4);
        expect(containmentRank(eSystemObjectType.eAsset)).toBe(5);
        expect(containmentRank(eSystemObjectType.eAssetVersion)).toBe(6);
        expect(containmentRank(eSystemObjectType.eActor)).toBeUndefined();
        expect(containmentRank(eSystemObjectType.eStakeholder)).toBeUndefined();
        expect(containmentRank(eSystemObjectType.eProjectDocumentation)).toBeUndefined();
    });

    test('isContainerType is true only for Unit/Project/Subject/Item', () => {
        expect(isContainerType(eSystemObjectType.eUnit)).toBe(true);
        expect(isContainerType(eSystemObjectType.eProject)).toBe(true);
        expect(isContainerType(eSystemObjectType.eSubject)).toBe(true);
        expect(isContainerType(eSystemObjectType.eItem)).toBe(true);
        expect(isContainerType(eSystemObjectType.eModel)).toBe(false);
        expect(isContainerType(eSystemObjectType.eScene)).toBe(false);
        expect(isContainerType(eSystemObjectType.eAsset)).toBe(false);
        expect(isContainerType(eSystemObjectType.eActor)).toBe(false);
    });

    test('isInvertedContainmentEdge permits valid downward container edges', () => {
        expect(isInvertedContainmentEdge(eSystemObjectType.eUnit, eSystemObjectType.eProject)).toBe(false);
        expect(isInvertedContainmentEdge(eSystemObjectType.eUnit, eSystemObjectType.eSubject)).toBe(false);
        expect(isInvertedContainmentEdge(eSystemObjectType.eProject, eSystemObjectType.eItem)).toBe(false);
        expect(isInvertedContainmentEdge(eSystemObjectType.eSubject, eSystemObjectType.eItem)).toBe(false);
    });

    test('isInvertedContainmentEdge flags a container placed beneath a lower tier', () => {
        expect(isInvertedContainmentEdge(eSystemObjectType.eModel, eSystemObjectType.eSubject)).toBe(true);
        expect(isInvertedContainmentEdge(eSystemObjectType.eModel, eSystemObjectType.eItem)).toBe(true);
        expect(isInvertedContainmentEdge(eSystemObjectType.eCaptureData, eSystemObjectType.eItem)).toBe(true);
        expect(isInvertedContainmentEdge(eSystemObjectType.eScene, eSystemObjectType.eUnit)).toBe(true);
    });

    test('isInvertedContainmentEdge never flags a non-container derived', () => {
        expect(isInvertedContainmentEdge(eSystemObjectType.eItem, eSystemObjectType.eScene)).toBe(false);
        expect(isInvertedContainmentEdge(eSystemObjectType.eScene, eSystemObjectType.eModel)).toBe(false);
        expect(isInvertedContainmentEdge(eSystemObjectType.eModel, eSystemObjectType.eModel)).toBe(false);
    });

    test('isInvertedContainmentEdge forms no opinion when a type is unranked', () => {
        expect(isInvertedContainmentEdge(eSystemObjectType.eActor, eSystemObjectType.eUnit)).toBe(false);
        expect(isInvertedContainmentEdge(eSystemObjectType.eProjectDocumentation, eSystemObjectType.eSubject)).toBe(false);
    });
});
