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

    if (!data.Name || isUndefined(data.Retired) || isNull(data.Retired)) {
        return { success: false, message: 'Error with Name and/or Retired field(s)' };
    }

    const SO = await DBAPI.SystemObject.fetch(idSystemObject);

    if (!SO)
        return { success: false, message: 'Error with fetching the object' };
    if (data.Retired) {
        const retireSuccess = await SO.retireObject();
        if (!retireSuccess) {
            LOG.error('Error with retiring object', LOG.LS.eDB);
            return { success: false, message: 'Error with retiring object' };
        }
    } else {
        const reinstateScuccess = await SO.reinstateObject();
        if (!reinstateScuccess) {
            LOG.error('Error with reinstating object', LOG.LS.eDB);
            return { success: false, message: 'Error with reinstating object' };
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
                        return { success: false, message: `failed to update identifier with id ${idIdentifier}` };
                    }
                } else {
                    LOG.error(`failed to find identifier ${idIdentifier}`, LOG.LS.eDB);
                    return { success: false, message: `failed to find identifier with id ${idIdentifier}` };
                }
            }

            // create new identifier
            if (idIdentifier === 0 && identifier && identifierType) {
                const newIdentifier = new DBAPI.Identifier({ idIdentifier: 0, IdentifierValue: identifier, idVIdentifierType: identifierType, idSystemObject });
                const createNewIdentifier = await newIdentifier.create();

                if (!createNewIdentifier) {
                    LOG.error(`updateObjectDetails failed to create newIdentifier ${JSON.stringify(newIdentifier)}`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: `There was an error when creating identifier ${identifier}`
                    };
                }
                if (preferred === true) {
                    const newIdentifier = await DBAPI.Identifier.fetchFromIdentifierValue(identifier);
                    if (newIdentifier && newIdentifier.length) {
                        identifierPreferred = newIdentifier[0].idIdentifier;
                    } else {
                        LOG.error('failed to fetch new preferred identifier', LOG.LS.eDB);
                        return {
                            success: false,
                            message: `Failed to find identifier with value ${identifier}`
                        };
                    }
                }
            }
        }
    }

    if (data.License) {
        const reassignedLicense = await DBAPI.License.fetch(data.License);
        if (!reassignedLicense) {
            LOG.error(`failed to fetch license with id ${data.License}`, LOG.LS.eDB);
            return { success: false, message: 'There was an error fetching the license for assignment. Please try again.' };
        }

        const reassignmentSuccess = await DBAPI.LicenseManager.setAssignment(idSystemObject, reassignedLicense);
        if (!reassignmentSuccess) {
            LOG.error(`failed to reassign license with id ${reassignedLicense.idLicense}`, LOG.LS.eDB);
            return { success: false, message: 'There was an error assigning the license. Please try again.' };
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

                const updateSuccess = await Unit.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating unit'
                    };
                }

            } else {
                LOG.error(`Failed to fetch unit with id ${idObject}`, LOG.LS.eDB);
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

                const updateSuccess = await Project.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating project'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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
                    Subject.idIdentifierPreferred = identifierPreferred;

                    // update exisiting geolocation OR create a new one and then connect with subject
                    if (Subject.idGeoLocation) {
                        const GeoLocation = await DBAPI.GeoLocation.fetch(Subject.idGeoLocation);
                        if (!GeoLocation) {
                            LOG.error(`Unable to fetch geolocation with id ${Subject.idGeoLocation}; update failed`, LOG.LS.eDB);
                            return {
                                success: false,
                                message: 'There was an error fetching GeoLocation'
                            };
                        }
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
                        const updateSuccess = await GeoLocation.update();
                        if (!updateSuccess) {
                            LOG.error(`Unable to update geolocation with id ${Subject.idGeoLocation}; update failed`, LOG.LS.eDB);
                            return {
                                success: false,
                                message: 'There was an error updating Geolocation'
                            };
                        }
                    } else {
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
                        const creationSuccess = await GeoLocation.create();
                        if (!creationSuccess) {
                            LOG.error('Unable to create geolocation', LOG.LS.eDB);
                            return {
                                success: false,
                                message: 'There was an error with creating geolocation'
                            };
                        }
                        Subject.idGeoLocation = GeoLocation.idGeoLocation;
                    }

                    const subjectUpdateSuccess = await Subject.update();
                    if (!subjectUpdateSuccess) {
                        LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                        return {
                            success: false,
                            message: 'There was an error updating subject'
                        };
                    }

                } else {
                    LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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
                    if (!isNull(EntireSubject) && !isUndefined(EntireSubject))
                        Item.EntireSubject = EntireSubject;

                    // update existing geolocation OR create a new one and then connect with item
                    if (Item.idGeoLocation) {
                        const GeoLocation = await DBAPI.GeoLocation.fetch(Item.idGeoLocation);
                        if (!GeoLocation) {
                            LOG.error(`Unable to fetch GeoLocation with id ${Item.idGeoLocation}; update failed`, LOG.LS.eDB);
                            return {
                                success: false,
                                message: 'There was an error fetching the geolocation'
                            };
                        }
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
                        const updateSuccess = await GeoLocation.update();
                        if (!updateSuccess) {
                            LOG.error(`Failed to update GeoLocation with id ${Item.idGeoLocation}`, LOG.LS.eDB);
                            return {
                                success: false,
                                message: 'There was an error updating geolocation'
                            };
                        }
                    } else {
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
                        const creationSuccess = await GeoLocation.create();
                        if (!creationSuccess) {
                            LOG.error('Unable to create geolocation', LOG.LS.eDB);
                            return {
                                success: false,
                                message: 'There was an error creating geolocation'
                            };
                        }

                        Item.idGeoLocation = GeoLocation.idGeoLocation;
                    }

                    const updateSuccess = await Item.update();
                    if (!updateSuccess) {
                        LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                        return {
                            success: false,
                            message: 'There was an error updating item'
                        };
                    }
                } else {
                    LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
                }
            }
            break;
        }
        case eSystemObjectType.eCaptureData: {
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
                        if (!CDFiles) {
                            LOG.error(`Unable to fetch Capture Data Files with id ${CaptureData.idCaptureData}; update failed`, LOG.LS.eDB);
                            return {
                                success: false,
                                message: `Unable to fetch Capture Data Files with id ${CaptureData.idCaptureData}; update failed`
                            };
                        }
                        for (const file of CDFiles) {
                            const asset = await DBAPI.Asset.fetch(file.idAsset);
                            if (!asset) {
                                LOG.error(`Unable to fetch asset with id ${file.idAsset}; update failed`, LOG.LS.eDB);
                                return {
                                    success: false,
                                    message: `Unable to fetch Asset with id ${file.idAsset}; update failed`
                                };
                            }
                            const newVariantType = foldersMap.get(asset.FilePath);
                            file.idVVariantType = newVariantType || file.idVVariantType;
                            const updateSuccess = await file.update();
                            if (!updateSuccess) {
                                LOG.error(`Unable to update Capture Data File with id ${file.idCaptureDataFile}; update failed`, LOG.LS.eDB);
                                return {
                                    success: false,
                                    message: `Unable to update Capture Data File with id ${file.idCaptureDataFile}; update failed`
                                };
                            }
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
                        const updateSuccess = await CD.update();
                        if (!updateSuccess) {
                            LOG.error(`Unable to update CaptureDataPhoto with id ${CD.idCaptureData}; update failed`, LOG.LS.eDB);
                            return {
                                success: false,
                                message: `Unable to update CaptureDataPhoto with id ${CD.idCaptureData}; update failed`
                            };
                        }
                    } else {
                        LOG.error(`Unable to fetch CaptureDataPhoto with id ${idObject}; update failed`, LOG.LS.eDB);
                        return {
                            success: false,
                            message: `Unable to fetch CaptureDataPhoto with id ${idObject}; update failed`
                        };
                    }
                    const updateSuccess = await CaptureData.update();
                    if (!updateSuccess) {
                        LOG.error(`Unable to update Capture Data with id ${CaptureData.idCaptureData}; update failed`, LOG.LS.eDB);
                        return {
                            success: false,
                            message: `Unable to update Capture Data with id ${CaptureData.idCaptureData}; update failed`
                        };
                    }

                } else {
                    LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
                }
            }
            break;
        }
        case eSystemObjectType.eModel: {
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

                    const updateSuccess = await Model.update();
                    if (!updateSuccess) {
                        LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                        return {
                            success: false,
                            message: `Unable to update Model with id ${Model.idModel}; update failed`
                        };
                    }
                } else {
                    LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                    };
                }
            }
            break;
        }
        case eSystemObjectType.eScene: {
            const Scene = await DBAPI.Scene.fetch(idObject);
            if (Scene) {
                Scene.Name = data.Name;
                if (data.Scene) {
                    if (typeof data.Scene.PosedAndQCd === 'boolean') Scene.PosedAndQCd = data.Scene.PosedAndQCd;
                    if (typeof data.Scene.ApprovedForPublication === 'boolean') Scene.ApprovedForPublication = data.Scene.ApprovedForPublication;
                }
                const updateSuccess = await Scene.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating scene'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
            }
            break;
        }
        case eSystemObjectType.eIntermediaryFile: {
            const IntermediaryFile = await DBAPI.IntermediaryFile.fetch(idObject);
            if (IntermediaryFile) {
                const Asset = await DBAPI.Asset.fetch(IntermediaryFile.idAsset);
                if (!Asset) {
                    LOG.error(`Unable to fetch Asset using IntermediaryFile.idAsset ${IntermediaryFile.idAsset}`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: `Unable to fetch Asset with id ${idObject}; update failed`
                    };
                }
                Asset.FileName = data.Name;
                const updateSuccess = await Asset.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating asset'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                return {
                    success: false,
                    message: `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`
                };
            }
            break;
        }
        case eSystemObjectType.eProjectDocumentation: {
            const ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(idObject);

            if (ProjectDocumentation) {
                ProjectDocumentation.Name = data.Name;

                if (data.ProjectDocumentation) {
                    const { Description } = data.ProjectDocumentation;
                    if (Description) ProjectDocumentation.Description = Description;
                }

                const updateSuccess = await ProjectDocumentation.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating project documentation'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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

                const updateSuccess = await Asset.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating asseet'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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

                const updateSuccess = await AssetVersion.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating asset version'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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
                const updateSuccess = await Actor.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating actor'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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
                const updateSuccess = await Stakeholder.update();
                if (!updateSuccess) {
                    LOG.error(`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
                    return {
                        success: false,
                        message: 'There was an error updating stakeholder'
                    };
                }
            } else {
                LOG.error(`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`, LOG.LS.eDB);
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
