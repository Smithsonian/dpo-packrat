import { eSystemObjectType } from '../../../../../db';
import { UpdateObjectDetailsResult, MutationUpdateObjectDetailsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils';
import * as DBAPI from '../../../../../db';
import { maybe } from '../../../../../utils/types';
import { isNull, isUndefined } from 'lodash';

export default async function updateObjectDetails(_: Parent, args: MutationUpdateObjectDetailsArgs): Promise<UpdateObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject, idObject, objectType, data } = input;

    LOG.logger.info(JSON.stringify(data, null, 2));

    if (!data.Name || isUndefined(data.Retired) || isNull(data.Retired)) {
        return { success: false };
    }

    const SO = await DBAPI.SystemObject.fetch(idSystemObject);
    /**
     * TODO: KARAN: add an error property and handle errors
     */
    if (SO) {
        if (data.Retired) {
            await SO.retireObject();
        } else {
            await SO.reinstateObject();
        }
    }

    switch (objectType) {
        case eSystemObjectType.eUnit: {
            const Unit = await DBAPI.Unit.fetch(idObject);

            if (Unit) {
                Unit.Name = data.Name;
                if (data.Unit) {
                    const { Abbreviation, ARKPrefix } = data.Unit;
                    Unit.Abbreviation = maybe<string>(Abbreviation);
                    Unit.ARKPrefix = maybe<string>(ARKPrefix);
                }

                await Unit.update();
            }
            break;
        }
        case eSystemObjectType.eProject: {
            const Project = await DBAPI.Project.fetch(idObject);

            if (Project) {
                Project.Name = data.Name;
                if (data.Project) {
                    const { Description } = data.Project;
                    Project.Description = maybe<string>(Description);
                }

                await Project.update();
            }
            break;
        }
        case eSystemObjectType.eSubject: {
            if (data.Subject) {
                const { Altitude, Latitude, Longitude, R0, R1, R2, R3, TS0, TS1, TS2 } = data.Subject;
                const Subject = await DBAPI.Subject.fetch(idObject);

                if (Subject) {
                    Subject.Name = data.Name;

                    if (!Subject.idGeoLocation) {
                        const GeoLocationInput = {
                            idGeoLocation: 0,
                            Altitude: maybe<number>(Altitude),
                            Latitude: maybe<number>(Latitude),
                            Longitude: maybe<number>(Longitude),
                            R0: maybe<number>(R0),
                            R1: maybe<number>(R1),
                            R2: maybe<number>(R2),
                            R3: maybe<number>(R3),
                            TS0: maybe<number>(TS0),
                            TS1: maybe<number>(TS1),
                            TS2: maybe<number>(TS2)
                        };
                        const GeoLocation = new DBAPI.GeoLocation(GeoLocationInput);
                        await GeoLocation.create();
                        Subject.idGeoLocation = GeoLocation.idGeoLocation;

                        await Subject.update();
                        break;
                    }

                    await Subject.update();

                    const GeoLocation = await DBAPI.GeoLocation.fetch(Subject.idGeoLocation);

                    if (GeoLocation) {
                        GeoLocation.Altitude = maybe<number>(Altitude);
                        GeoLocation.Latitude = maybe<number>(Latitude);
                        GeoLocation.Longitude = maybe<number>(Longitude);
                        GeoLocation.R0 = maybe<number>(R0);
                        GeoLocation.R1 = maybe<number>(R1);
                        GeoLocation.R2 = maybe<number>(R2);
                        GeoLocation.R3 = maybe<number>(R3);
                        GeoLocation.TS0 = maybe<number>(TS0);
                        GeoLocation.TS1 = maybe<number>(TS1);
                        GeoLocation.TS2 = maybe<number>(TS2);
                        await GeoLocation.update();
                    }
                }
            }
            break;
        }
        case eSystemObjectType.eItem: {
            if (data.Item) {
                const { EntireSubject, Altitude, Latitude, Longitude, R0, R1, R2, R3, TS0, TS1, TS2 } = data.Item;
                const Item = await DBAPI.Item.fetch(idObject);

                if (Item) {
                    Item.Name = data.Name;
                    if (!isNull(EntireSubject) && !isUndefined(EntireSubject)) Item.EntireSubject = EntireSubject;

                    if (!Item.idGeoLocation) {
                        const GeoLocationInput = {
                            idGeoLocation: 0,
                            Altitude: maybe<number>(Altitude),
                            Latitude: maybe<number>(Latitude),
                            Longitude: maybe<number>(Longitude),
                            R0: maybe<number>(R0),
                            R1: maybe<number>(R1),
                            R2: maybe<number>(R2),
                            R3: maybe<number>(R3),
                            TS0: maybe<number>(TS0),
                            TS1: maybe<number>(TS1),
                            TS2: maybe<number>(TS2)
                        };
                        const GeoLocation = new DBAPI.GeoLocation(GeoLocationInput);
                        await GeoLocation.create();
                        Item.idGeoLocation = GeoLocation.idGeoLocation;
                        await Item.update();
                        break;
                    }

                    await Item.update();

                    if (Item.idGeoLocation) {
                        const GeoLocation = await DBAPI.GeoLocation.fetch(Item.idGeoLocation);
                        if (GeoLocation) {
                            GeoLocation.Altitude = maybe<number>(Altitude);
                            GeoLocation.Latitude = maybe<number>(Latitude);
                            GeoLocation.Longitude = maybe<number>(Longitude);
                            GeoLocation.R0 = maybe<number>(R0);
                            GeoLocation.R1 = maybe<number>(R1);
                            GeoLocation.R2 = maybe<number>(R2);
                            GeoLocation.R3 = maybe<number>(R3);
                            GeoLocation.TS0 = maybe<number>(TS0);
                            GeoLocation.TS1 = maybe<number>(TS1);
                            GeoLocation.TS2 = maybe<number>(TS2);
                            await GeoLocation.update();
                        }
                    }
                }
            }
            break;
        }
        case eSystemObjectType.eCaptureData: {
            // TODO: KARAN update/create folders, systemCreated
            if (data.CaptureData) {
                const CaptureData = await DBAPI.CaptureData.fetch(idObject);

                if (CaptureData) {
                    const {
                        description,
                        captureMethod,
                        dateCaptured,
                        cameraSettingUniform,
                        datasetType,
                        datasetFieldId,
                        itemPositionType,
                        itemPositionFieldId,
                        itemArrangementFieldId,
                        focusType,
                        lightsourceType,
                        backgroundRemovalMethod,
                        clusterType,
                        clusterGeometryFieldId,
                    } = data.CaptureData;

                    CaptureData.DateCaptured = new Date(dateCaptured);
                    if (description) CaptureData.Description = description;
                    if (captureMethod) CaptureData.idVCaptureMethod = captureMethod;

                    const CaptureDataPhoto = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(CaptureData.idCaptureData);

                    if (CaptureDataPhoto && CaptureDataPhoto[0]) {
                        const [CD] = CaptureDataPhoto;

                        CD.CameraSettingsUniform = maybe<boolean>(cameraSettingUniform);
                        if (datasetType) CD.idVCaptureDatasetType = datasetType;
                        CD.CaptureDatasetFieldID = maybe<number>(datasetFieldId);
                        CD.idVItemPositionType = maybe<number>(itemPositionType);
                        CD.idVItemPositionType = maybe<number>(itemPositionFieldId);
                        CD.ItemArrangementFieldID = maybe<number>(itemArrangementFieldId);
                        CD.idVFocusType = maybe<number>(focusType);
                        CD.idVLightSourceType = maybe<number>(lightsourceType);
                        CD.idVBackgroundRemovalMethod = maybe<number>(backgroundRemovalMethod);
                        CD.idVClusterType = maybe<number>(clusterType);
                        CD.ClusterGeometryFieldID = maybe<number>(clusterGeometryFieldId);
                        await CD.update();
                    }
                    await CaptureData.update();
                }
            }
            break;
        } case eSystemObjectType.eModel: {
            if (data.Model) {
                const Model = await DBAPI.Model.fetch(idObject);
                if (Model) {
                    const {
                        Name,
                        DateCaptured,
                        Master,
                        Authoritative,
                        CreationMethod,
                        Modality,
                        Units,
                        Purpose,
                        ModelFileType
                    } = data.Model;

                    if (Name) Model.Name = Name;
                    if (typeof Master === 'boolean') Model.Master = Master;
                    if (typeof Authoritative === 'boolean') Model.Authoritative = Authoritative;
                    if (CreationMethod) Model.idVCreationMethod = CreationMethod;
                    if (Modality) Model.idVModality = Modality;
                    if (Purpose) Model.idVPurpose = Purpose;
                    if (Units) Model.idVUnits = Units;
                    if (ModelFileType) Model.idVFileType = ModelFileType;
                    Model.DateCreated = new Date(DateCaptured);

                    // if (Model.idAssetThumbnail) {
                    //     const AssetVersion = await DBAPI.AssetVersion.fetchFromAsset(Model.idAssetThumbnail);
                    //     if (AssetVersion && AssetVersion[0]) {
                    //         const [AV] = AssetVersion;
                    //         if (size) AV.StorageSize = size;
                    //     }
                    // }

                    /*
                    // TODO: do we want to update the asset name?  I don't think so...
                    // Look up asset using SystemObjectXref, with idSystemObjectMaster = Model's system object ID
                    const Asset = await DBAPI.Asset.fetch(MGF.idAsset);
                    if (Asset) {
                        Asset.FileName = data.Name;
                        await Asset.update();
                    }
                    */
                    try {
                        if (await Model.update()) {
                            break;
                        } else {
                            throw new Error('error in updating');
                        }
                    } catch (error) {
                        throw new Error(error);
                    }
                }
            }
            break;
        } case eSystemObjectType.eScene: {
            const Scene = await DBAPI.Scene.fetch(idObject);
            if (Scene) {
                Scene.Name = data.Name;
                if (data.Scene) {
                    // Update values here
                }

                await Scene.update();
            }
            break;
        } case eSystemObjectType.eIntermediaryFile: {
            const IntermediaryFile = await DBAPI.IntermediaryFile.fetch(idObject);
            if (IntermediaryFile) {
                const Asset = await DBAPI.Asset.fetch(IntermediaryFile.idAsset);
                if (Asset) {
                    Asset.FileName = data.Name;
                    await Asset.update();
                }
            }
            break;
        } case eSystemObjectType.eProjectDocumentation: {
            const ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(idObject);

            if (ProjectDocumentation) {
                ProjectDocumentation.Name = data.Name;

                if (data.ProjectDocumentation) {
                    const { Description } = data.ProjectDocumentation;
                    if (Description) ProjectDocumentation.Description = Description;
                }

                await ProjectDocumentation.update();
            }
            break;
        }
        case eSystemObjectType.eAsset: {
            const Asset = await DBAPI.Asset.fetch(idObject);

            if (Asset) {
                Asset.FileName = data.Name;

                if (data.Asset) {
                    const { FilePath, AssetType } = data.Asset;
                    if (FilePath) Asset.FilePath = FilePath;
                    if (AssetType) Asset.idVAssetType = AssetType;
                }

                await Asset.update();
            }
            break;
        }
        case eSystemObjectType.eAssetVersion: {
            const AssetVersion = await DBAPI.AssetVersion.fetch(idObject);

            if (AssetVersion) {
                AssetVersion.FileName = data.Name;

                if (data.AssetVersion) {
                    const { Ingested } = data.AssetVersion;
                    if (!isNull(Ingested) && !isUndefined(Ingested)) AssetVersion.Ingested = Ingested;
                }

                await AssetVersion.update();
            }
            break;
        }
        case eSystemObjectType.eActor: {
            const Actor = await DBAPI.Actor.fetch(idObject);
            if (Actor) {
                Actor.IndividualName = data.Name;
                if (data.Actor) {
                    const { OrganizationName } = data.Actor;
                    Actor.OrganizationName = maybe<string>(OrganizationName);

                }
                await Actor.update();
            }
            break;
        }
        case eSystemObjectType.eStakeholder: {
            const Stakeholder = await DBAPI.Stakeholder.fetch(idObject);

            if (Stakeholder) {
                Stakeholder.IndividualName = data.Name;
                if (data.Stakeholder) {
                    const { OrganizationName, MailingAddress, EmailAddress, PhoneNumberMobile, PhoneNumberOffice } = data.Stakeholder;
                    if (OrganizationName) Stakeholder.OrganizationName = OrganizationName;
                    Stakeholder.MailingAddress = maybe<string>(MailingAddress);
                    Stakeholder.EmailAddress = maybe<string>(EmailAddress);
                    Stakeholder.PhoneNumberMobile = maybe<string>(PhoneNumberMobile);
                    Stakeholder.PhoneNumberOffice = maybe<string>(PhoneNumberOffice);
                }
                await Stakeholder.update();
            }
            break;
        }
        default:
            break;
    }

    return { success: true };
}
