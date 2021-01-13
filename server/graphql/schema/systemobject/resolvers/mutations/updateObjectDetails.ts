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

    if (SO) {
        SO.Retired = data.Retired;
        // TODO: KARAN: how to update SO? SO.update()?
    }

    switch (objectType) {
        case eSystemObjectType.eUnit: {
            if (data.Unit) {
                const { Abbreviation, ARKPrefix } = data.Unit;
                const Unit = await DBAPI.Unit.fetch(idObject);

                if (Unit) {
                    Unit.Name = data.Name;
                    Unit.Abbreviation = maybe<string>(Abbreviation);
                    Unit.ARKPrefix = maybe<string>(ARKPrefix);
                    await Unit.update();
                }
            }
            break;
        }
        case eSystemObjectType.eProject: {
            if (data.Project) {
                const { Description } = data.Project;
                const Project = await DBAPI.Project.fetch(idObject);

                if (Project) {
                    Project.Name = data.Name;
                    Project.Description = maybe<string>(Description);
                    await Project.update();
                }
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
        case eSystemObjectType.eCaptureData:
            // TODO: KARAN: How to update capture data?
            break;
        case eSystemObjectType.eModel:
            // TODO: KARAN: How to update model?
            break;
        case eSystemObjectType.eScene:
            // TODO: KARAN: How to update scene?
            break;
        case eSystemObjectType.eIntermediaryFile:
            break;
        case eSystemObjectType.eProjectDocumentation: {
            if (data.ProjectDocumentation) {
                const { Description } = data.ProjectDocumentation;
                const ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(idObject);

                if (ProjectDocumentation) {
                    ProjectDocumentation.Name = data.Name;
                    if (Description) ProjectDocumentation.Description = Description;
                    await ProjectDocumentation.update();
                }
            }
            break;
        }
        case eSystemObjectType.eAsset: {
            if (data.Asset) {
                const { FilePath, AssetType } = data.Asset;
                const Asset = await DBAPI.Asset.fetch(idObject);

                if (Asset) {
                    Asset.FileName = data.Name;
                    if (FilePath) Asset.FilePath = FilePath;
                    if (AssetType) Asset.idVAssetType = AssetType;

                    await Asset.update();
                }
            }
            break;
        }
        case eSystemObjectType.eAssetVersion: {
            if (data.AssetVersion) {
                const { Ingested } = data.AssetVersion;
                const AssetVersion = await DBAPI.AssetVersion.fetch(idObject);

                if (AssetVersion) {
                    AssetVersion.FileName = data.Name;
                    if (Ingested) AssetVersion.Ingested = Ingested;
                    await AssetVersion.update();
                }
            }
            break;
        }
        case eSystemObjectType.eActor: {
            if (data.Actor) {
                const { OrganizationName } = data.Actor;
                const Actor = await DBAPI.Actor.fetch(idObject);

                if (Actor) {
                    Actor.OrganizationName = maybe<string>(OrganizationName);
                    await Actor.update();
                }
            }
            break;
        }
        case eSystemObjectType.eStakeholder: {
            if (data.Stakeholder) {
                const { OrganizationName, MailingAddress, EmailAddress, PhoneNumberMobile, PhoneNumberOffice } = data.Stakeholder;
                const Stakeholder = await DBAPI.Stakeholder.fetch(idObject);

                if (Stakeholder) {
                    if (OrganizationName) Stakeholder.OrganizationName = OrganizationName;
                    Stakeholder.MailingAddress = maybe<string>(MailingAddress);
                    Stakeholder.EmailAddress = maybe<string>(EmailAddress);
                    Stakeholder.PhoneNumberMobile = maybe<string>(PhoneNumberMobile);
                    Stakeholder.PhoneNumberOffice = maybe<string>(PhoneNumberOffice);
                    await Stakeholder.update();
                }
            }
            break;
        }
        default:
            break;
    }

    return { success: true };
}
