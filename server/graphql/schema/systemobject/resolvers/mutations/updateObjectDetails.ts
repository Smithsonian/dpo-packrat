import { eSystemObjectType } from '../../../../../db';
import { UpdateObjectDetailsResult, MutationUpdateObjectDetailsArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as LOG from '../../../../../utils';
import * as DBAPI from '../../../../../db';
import { maybe } from '../../../../../utils/types';
import { isNull, isUndefined } from 'lodash';
import { SystemObjectTypeToName } from '../../../../../db/api/ObjectType';
import * as H from '../../../../../utils/helpers';

export default async function updateObjectDetails(_: Parent, args: MutationUpdateObjectDetailsArgs): Promise<UpdateObjectDetailsResult> {
    const { input } = args;
    const { idSystemObject, idObject, objectType, data } = input;

    // LOG.info(JSON.stringify(data, null, 2), LOG.LS.eGQL);

    if (!data.Name || isUndefined(data.Retired) || isNull(data.Retired)) {
        return { success: false, message: 'Error with Name and/or Retired field(s)' };
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

    let identifierPreferred: null | number = null;
    if (data?.Identifiers && data?.Identifiers.length) {
        for await (const Identifier of data.Identifiers) {
            const { idIdentifier, identifier, identifierType, preferred } = Identifier;
            if (idIdentifier && identifier && identifierType) {
                const existingIdentifier = await DBAPI.Identifier.fetch(idIdentifier);
                if (existingIdentifier) {
                    if (preferred) {
                        identifierPreferred = idIdentifier;
                    }
                    existingIdentifier.IdentifierValue = identifier;
                    existingIdentifier.idVIdentifierType = Number(identifierType);
                    const updateSuccess = await existingIdentifier.update();
                    if (updateSuccess) {
                        LOG.info(`updated identifier ${idIdentifier}`, LOG.LS.eDB);
                    } else {
                        LOG.error(`failed to updated identifier ${idIdentifier}`, LOG.LS.eDB);
                    }
                } else {
                    LOG.error(`failed to find identifier ${idIdentifier}`, LOG.LS.eDB);
                }
            }

            // create new identifier
            if (idIdentifier === 0 && identifier && identifierType) {
                const newIdentifier = new DBAPI.Identifier({ idIdentifier: 0, IdentifierValue: identifier, idVIdentifierType: identifierType, idSystemObject });
                const createNewIdentifier = await newIdentifier.create();

                if (!createNewIdentifier) {
                    LOG.error(`updateObjectDetails failed to create newIdentifier ${JSON.stringify(newIdentifier)}`, LOG.LS.eDB);
                }
                if (preferred === true) {
                    const newIdentifier = await DBAPI.Identifier.fetchFromIdentifierValue(identifier);
                    if (newIdentifier && newIdentifier.length) {
                        identifierPreferred = newIdentifier[0].idIdentifier;
                    } else {
                        LOG.error('failed to fetch new preferred identifier', LOG.LS.eDB);
                    }
                }
            }
        }
    }

    if (data.License) {
        const reassignedLicense = await DBAPI.License.fetch(data.License);
        if (reassignedLicense) {
            const reassignmentSuccess = await DBAPI.LicenseManager.setAssignment(idSystemObject, reassignedLicense);
            if (!reassignmentSuccess) {
                return {
                    success: false,
                    message: 'There was an error assigning the license. Please try again.'
                };
            }
        } else {
            return {
                success: false,
                message: 'There was an error fetching the license for assignment. Please try again.'
            };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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

                    Subject.idIdentifierPreferred = identifierPreferred;

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
                } else {
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
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
                } else {
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
                }
            }
            break;
        }
        case eSystemObjectType.eCaptureData: {
            // TODO: KARAN update/create folders, systemCreated
            if (data.CaptureData) {
                const CaptureData = await DBAPI.CaptureData.fetch(idObject);

                if (CaptureData) {
                    CaptureData.Name = data.Name;
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
                        folders
                    } = data.CaptureData;


                    if (datasetFieldId && !H.Helpers.validFieldId(datasetFieldId)) return { success: false, message: 'Dataset Field ID is invalid; update failed' };
                    if (itemPositionFieldId && !H.Helpers.validFieldId(itemPositionFieldId)) return { success: false, message: 'Item Position Field ID is invalid; update failed' };
                    if (itemArrangementFieldId && !H.Helpers.validFieldId(itemArrangementFieldId)) return { success: false, message: 'Item Arrangement Field ID is invalid; update failed' };
                    if (clusterGeometryFieldId && !H.Helpers.validFieldId(clusterGeometryFieldId)) return { success: false, message: 'Cluster Geometry Field ID is invalid; update failed' };

                    CaptureData.DateCaptured = new Date(dateCaptured);
                    if (description) CaptureData.Description = description;
                    if (captureMethod) CaptureData.idVCaptureMethod = captureMethod;

                    if (folders && folders.length) {
                        const foldersMap = new Map<string, number>();
                        folders.forEach((folder) => foldersMap.set(folder.name, folder.variantType));
                        const CDFiles = await DBAPI.CaptureDataFile.fetchFromCaptureData(CaptureData.idCaptureData);
                        if (CDFiles) {
                            for await (const file of CDFiles) {
                                const asset = await DBAPI.Asset.fetch(file.idAsset);
                                if (asset) {
                                    const newVariantType = foldersMap.get(asset.FilePath);
                                    file.idVVariantType = newVariantType || file.idVVariantType;
                                    const update = await file.update();
                                    if (update) {
                                        continue;
                                    } else {
                                        return {
                                            success: false,
                                            message: `Unable to update Capture Data File with id ${file.idCaptureDataFile}; update failed`
                                        };
                                    }
                                } else {
                                    return {
                                        success: false,
                                        message: `Unable to fetch Asset with id ${file.idAsset}; update failed`
                                    };
                                }
                            }
                        } else {
                            return {
                                success: false,
                                message: `Unable to fetch Capture Data Files with id ${CaptureData.idCaptureData}; update failed`
                            };
                        }
                    }

                    const CaptureDataPhoto = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(CaptureData.idCaptureData);
                    if (CaptureDataPhoto && CaptureDataPhoto[0]) {
                        const [CD] = CaptureDataPhoto;

                        CD.CameraSettingsUniform = maybe<boolean>(cameraSettingUniform);
                        if (datasetType) CD.idVCaptureDatasetType = datasetType;
                        CD.CaptureDatasetFieldID = maybe<number>(datasetFieldId);
                        CD.idVItemPositionType = maybe<number>(itemPositionType);
                        CD.ItemPositionFieldID = maybe<number>(itemPositionFieldId);
                        CD.ItemArrangementFieldID = maybe<number>(itemArrangementFieldId);
                        CD.idVFocusType = maybe<number>(focusType);
                        CD.idVLightSourceType = maybe<number>(lightsourceType);
                        CD.idVBackgroundRemovalMethod = maybe<number>(backgroundRemovalMethod);
                        CD.idVClusterType = maybe<number>(clusterType);
                        CD.ClusterGeometryFieldID = maybe<number>(clusterGeometryFieldId);
                        await CD.update();
                    } else {
                        return {
                            success: false,
                            message: `Unable to fetch CaptureDataPhoto with id ${idObject}; update failed`
                        };
                    }
                    await CaptureData.update();
                } else {
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
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
                        CreationMethod,
                        Modality,
                        Units,
                        Purpose,
                        ModelFileType
                    } = data.Model;

                    if (Name) Model.Name = Name;
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
                } else {
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
                }
            }
            break;
        } case eSystemObjectType.eScene: {
            const Scene = await DBAPI.Scene.fetch(idObject);
            if (Scene) {
                Scene.Name = data.Name;
                if (data.Scene) {
                    if (typeof data.Scene.IsOriented === 'boolean') Scene.IsOriented = data.Scene.IsOriented;
                    if (typeof data.Scene.HasBeenQCd === 'boolean') Scene.HasBeenQCd = data.Scene.HasBeenQCd;
                }
                await Scene.update();
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
            }
            break;
        }
        case eSystemObjectType.eAssetVersion: {
            const AssetVersion = await DBAPI.AssetVersion.fetch(idObject);

            if (AssetVersion) {
                AssetVersion.FileName = data.Name;

                if (data.AssetVersion) {
                    const { Ingested } = data.AssetVersion;
                    if (!isUndefined(Ingested))
                        AssetVersion.Ingested = Ingested;
                }

                await AssetVersion.update();
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
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
            } else {
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
            }
            break;
        }
        default:
            break;
    }

    return { success: true, message: '' };
}
