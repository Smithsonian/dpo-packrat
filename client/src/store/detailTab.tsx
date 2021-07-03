import create, { GetState, SetState } from 'zustand';
import { eVocabularySetID, eSystemObjectType } from '../types/server';
// import vocabularyStore to retrieve appropriate entries

//Create an interface that takes on all of the detail types
//Create an interface that takes on all of the query types

interface AssetVersionDetailsType {
    Version: number;
    Creator: string;
    DateCreated: string | Date;
    StorageSize: number;
    Ingested: boolean;
}

interface AssetDetailsType {
    AssetType: eVocabularySetID | number;
    FilePath: string;
}

interface ActorDetailsType {
    OrganizationName: string;
}

interface SceneDetailsType {
    Name: string;
    HasBeenQCd: boolean;
    IsOriented: boolean;
    CountScene: number;
    CountNode: 0;
    CountCamera: 0;
    CountLight: 0;
    CountModel: 0;
    CountMeta: 0;
    CountSetup: 0;
    CountTour: 0;
    ModelSceneXref: any[];
}

type DetailTabStore = {
    SceneDetails: SceneDetailsType;
    AssetVersionDetails: AssetVersionDetailsType;
    AssetDetails: AssetDetailsType;
    ActorDetails: ActorDetailsType;
    updateDetailField: (metadataType: eSystemObjectType, fieldName: string, value: number | string | boolean | Date | null) => void;
    getDetail: (type: eSystemObjectType) => SceneDetailsType | AssetVersionDetailsType | AssetDetailsType | ActorDetailsType | void;
    // create another method for handling proper parsing of the object and setting it to state;
    initializeDetailFields: (data: any, type: eSystemObjectType) => void;
};

export const useDetailTabStore = create<DetailTabStore>((set: SetState<DetailTabStore>, get: GetState<DetailTabStore>) => ({
    SceneDetails: {
        Name: '',
        HasBeenQCd: false,
        IsOriented: false,
        CountScene: 0,
        CountNode: 0,
        CountCamera: 0,
        CountLight: 0,
        CountModel: 0,
        CountMeta: 0,
        CountSetup: 0,
        CountTour: 0,
        ModelSceneXref: [
            {
                BoundingBoxP1X: 0,
                BoundingBoxP1Y: 0,
                BoundingBoxP1Z: 0,
                BoundingBoxP2X: 0,
                BoundingBoxP2Y: 0,
                BoundingBoxP2Z: 0,
                FileSize: 0,
                Model: null,
                Name: '',
                Quality: '',
                UVResolution: 0,
                Usage: '',
                idModel: -1,
                idModelSceneXref: 0,
                idScene: 0
            }
        ]
    },
    AssetVersionDetails: {
        Version: 0,
        Creator: '',
        DateCreated: '',
        StorageSize: 0,
        Ingested: false
    },
    AssetDetails: {
        AssetType: 0,
        FilePath: 'poo'
    },
    ActorDetails: {
        OrganizationName: ''
    },
    updateDetailField(assetType, fieldName, value) {
        const { getDetail } = get();
        console.log('assetType', assetType, 'fieldName', fieldName, 'value', value);
        if (assetType === eSystemObjectType.eScene) {
            const SceneDetails = getDetail(eSystemObjectType.eScene) as SceneDetailsType;
            const updatedDetails = { ...SceneDetails, [fieldName]: value };
            set({
                SceneDetails: updatedDetails
            });
        }
        if (assetType === eSystemObjectType.eAsset) {
            const AssetDetails = getDetail(eSystemObjectType.eAsset) as AssetDetailsType;
            const updatedDetails = { ...AssetDetails, [fieldName]: value };
            set({
                AssetDetails: updatedDetails
            });
        }
        if (assetType === eSystemObjectType.eAssetVersion) {
            const AssetVersionDetails = getDetail(eSystemObjectType.eAssetVersion) as AssetVersionDetailsType;
            const updatedDetails = { ...AssetVersionDetails, [fieldName]: value };
            set({
                AssetVersionDetails: updatedDetails
            });
        }
        if (assetType === eSystemObjectType.eActor) {
            const ActorDetails = getDetail(eSystemObjectType.eActor) as ActorDetailsType;
            const updatedDetails = { ...ActorDetails, [fieldName]: value };
            set({
                ActorDetails: updatedDetails
            });
        }
    },
    getDetail(assetType) {
        if (assetType === eSystemObjectType.eScene) {
            const { SceneDetails } = get();
            return SceneDetails;
        }
        if (assetType === eSystemObjectType.eAsset) {
            const { AssetDetails } = get();
            return AssetDetails;
        }
        if (assetType === eSystemObjectType.eAssetVersion) {
            const { AssetVersionDetails } = get();
            return AssetVersionDetails;
        }
        if (assetType === eSystemObjectType.eActor) {
            const { ActorDetails } = get();
            return ActorDetails;
        }
        return;
    },
    initializeDetailFields(fetchedQuery, objectType) {
        const { updateDetailField } = get();
        const {
            data: { getDetailsTabDataForObject }
        } = fetchedQuery;
        console.log('initializeDetailsFields', getDetailsTabDataForObject);
        if (!getDetailsTabDataForObject) return;

        if (objectType === eSystemObjectType.eScene) {
            const {
                Scene: { HasBeenQCd, IsOriented }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eScene, 'HasBeenQCd', HasBeenQCd);
            updateDetailField(eSystemObjectType.eScene, 'IsOriented', IsOriented);
        }

        if (objectType === eSystemObjectType.eAsset) {
            const {
                Asset: { FilePath, AssetType }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eAsset, 'AssetType', AssetType);
            updateDetailField(eSystemObjectType.eAsset, 'FilePath', FilePath);
        }

        if (objectType === eSystemObjectType.eAssetVersion) {
            const {
                AssetVersion: { Version, Creator, DateCreated, StorageSize, Ingested }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eAssetVersion, 'Version', Version);
            updateDetailField(eSystemObjectType.eAssetVersion, 'Creator', Creator);
            updateDetailField(eSystemObjectType.eAssetVersion, 'DateCreated', DateCreated);
            updateDetailField(eSystemObjectType.eAssetVersion, 'StorageSize', StorageSize);
            updateDetailField(eSystemObjectType.eAssetVersion, 'Ingested', Ingested);
        }

        if (objectType === eSystemObjectType.eActor) {
            const {
                Actor: { OrganizationName }
            } = getDetailsTabDataForObject;
            updateDetailField(eSystemObjectType.eActor, 'OrganizationName', OrganizationName);
        }
    }
}));
