/* eslint-disable @typescript-eslint/no-explicit-any */
import { UpdateObjectDetailsResult, MutationUpdateObjectDetailsArgs, MetadataInput, User } from '../../../../../types/graphql';
import { Parent, Context } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface/';
import * as DBAPI from '../../../../../db';
import * as CACHE from '../../../../../cache';
import { maybe } from '../../../../../utils/types';
import { isNull, isUndefined } from 'lodash';
import { SystemObjectTypeToName } from '../../../../../db/api/ObjectType';
import * as H from '../../../../../utils/helpers';
import { PublishScene, SceneUpdateResult } from '../../../../../collections/impl/PublishScene';
import * as COMMON from '@dpo-packrat/common';
import { NameHelpers } from '../../../../../utils/nameHelpers';
import { RecordKeeper as RK } from '../../../../../records/recordKeeper';

export default async function updateObjectDetails(_: Parent, args: MutationUpdateObjectDetailsArgs, context: Context): Promise<UpdateObjectDetailsResult> {
    const { input } = args;
    const { user } = context;
    const { idSystemObject, idObject, objectType, data } = input;

    console.log('[Server.updateObjectDetails] input received:', JSON.stringify(args.input, null, 2));

    if (!data.Name || isUndefined(data.Retired) || isNull(data.Retired))
        return sendResult(false,'update object details failed','Error with Name and/or Retired field(s); update failed');

    const SO = await DBAPI.SystemObject.fetch(idSystemObject);
    if (!SO)
        return sendResult(false,'update object details failed',`Error fetching object ${idSystemObject}; update failed`);

    if (!SO.Retired && data.Retired) {
        if (!await SO.retireObject())
            return sendResult(false,'update object details failed','Error retiring object; update failed');
    } else if (SO.Retired && !data.Retired) {
        if (!await SO.reinstateObject())
            return sendResult(false,'update object details failed','Error reinstating object; update failed');
    }

    let identifierPreferred: null | number = null;
    if (data?.Identifiers && data?.Identifiers.length) {
        for await (const Identifier of data.Identifiers) {
            const { idIdentifier, identifier, identifierType, preferred } = Identifier;
            if (idIdentifier && identifier && identifierType) {
                const existingIdentifier = await DBAPI.Identifier.fetch(idIdentifier);
                if (existingIdentifier) {
                    if (preferred)
                        identifierPreferred = idIdentifier;
                    existingIdentifier.IdentifierValue = identifier;
                    existingIdentifier.idVIdentifierType = Number(identifierType);
                    if (!await existingIdentifier.update())
                        return sendResult(false,'update object details failed',`Unable to update identifier with id ${idIdentifier}; update failed`);
                }
            }

            // create new identifier
            if (idIdentifier === 0 && identifier && identifierType) {
                const newIdentifier = new DBAPI.Identifier({ idIdentifier: 0, IdentifierValue: identifier, idVIdentifierType: identifierType, idSystemObject });
                if (!await newIdentifier.create())
                    return sendResult(false,'update object details failed',`Unable to create identifier when updating ${SystemObjectTypeToName(objectType)}; update failed`);
                if (preferred === true)
                    identifierPreferred = newIdentifier.idIdentifier;
            }
        }
    }

    const LR: DBAPI.LicenseResolver | undefined = await CACHE.LicenseCache.getLicenseResolver(idSystemObject);
    const LicenseOld: DBAPI.License | undefined = LR?.License ?? undefined;
    let LicenseNew: DBAPI.License | undefined = LicenseOld;
    if (data.License != null) {
        if (data.License > 0) {
            const reassignedLicense: DBAPI.License | null = await DBAPI.License.fetch(data.License);
            if (!reassignedLicense)
                return sendResult(false,'update object details failed',`Unable to fetch license with id ${data.License}; update failed`);

            if (!await DBAPI.LicenseManager.setAssignment(idSystemObject, reassignedLicense))
                return sendResult(false,'update object details failed',`Unable to reassign license for idSystemObject ${idSystemObject} with id ${reassignedLicense.idLicense}; update failed`);
            LicenseNew = reassignedLicense;
        } else {
            if (!await DBAPI.LicenseManager.clearAssignment(idSystemObject))
                return sendResult(false,'update object details failed',`Unable to clear license with for idSystemObject ${idSystemObject}; update failed`);
            LicenseNew = undefined;
        }
    }
    RK.logDebug(RK.LogSection.eGQL,'update object details','changing license',{ oldLicense: LicenseOld, newLicense: LicenseNew },'GraphQL.SystemObject.ObjectDetails');

    const metadataRes: H.IOResults = await handleMetadata(idSystemObject, data.Metadata, user);
    if (!metadataRes.success)
        return sendResult(false,'update object details failed',metadataRes.error);

    switch (objectType) {
        case COMMON.eSystemObjectType.eUnit: {
            const Unit = await DBAPI.Unit.fetch(idObject);
            if (!Unit)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            Unit.Name = data.Name;
            if (data.Unit) {
                const { Abbreviation, ARKPrefix } = data.Unit;
                Unit.Abbreviation = maybe<string>(Abbreviation);
                Unit.ARKPrefix = maybe<string>(ARKPrefix);
            }

            if (!await Unit.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eProject: {
            const Project = await DBAPI.Project.fetch(idObject);
            if (!Project)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            Project.Name = data.Name;
            if (data.Project) {
                const { Description } = data.Project;
                Project.Description = maybe<string>(Description);
            }

            if (!await Project.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eSubject: {
            if (data.Subject) {
                const { Altitude, Latitude, Longitude, R0, R1, R2, R3, TS0, TS1, TS2 } = data.Subject;
                const geoLocationProvided: boolean = Altitude !== null || Latitude !== null || Longitude !== null || R0 !== null ||
                    R1 !== null || R2 !== null || R3 !== null || TS0 !== null || TS1 !== null || TS2 !== null;

                const Subject = await DBAPI.Subject.fetch(idObject);
                if (!Subject)
                    return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

                Subject.Name = data.Name;
                Subject.idIdentifierPreferred = identifierPreferred;

                // update exisiting geolocation OR create a new one and then connect with subject
                if (Subject.idGeoLocation) {
                    const GeoLocation = await DBAPI.GeoLocation.fetch(Subject.idGeoLocation);
                    if (!GeoLocation)
                        return sendResult(false,'update object details failed',`Unable to fetch GeoLocation with id ${Subject.idGeoLocation}; update failed`);

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
                    if (!await GeoLocation.update())
                        return sendResult(false,'update object details failed',`Unable to update GeoLocation with id ${Subject.idGeoLocation}; update failed`);
                } else if (geoLocationProvided) {
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
                    if (!await GeoLocation.create())
                        return sendResult(false,'update object details failed',`Unable to create GeoLocation when updating ${SystemObjectTypeToName(objectType)}; update failed`);

                    Subject.idGeoLocation = GeoLocation.idGeoLocation;
                }

                if (!await Subject.update())
                    return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            }
            break;
        }
        case COMMON.eSystemObjectType.eItem: {
            if (data.Item) {
                const { EntireSubject } = data.Item;

                const Item = await DBAPI.Item.fetch(idObject);
                if (!Item)
                    return sendResult(false,'update object details failed',`Unable to fetch Media Group with id ${idObject}; update failed`);

                const namedWithoutSubtitle: boolean = (data.Name != null && data.Subtitle == null);
                Item.Name = namedWithoutSubtitle ? data.Name : computeNewName(Item.Name, Item.Title, data.Subtitle); // do this before updating .Title
                Item.Title = data.Subtitle ?? null;

                if (!isNull(EntireSubject) && !isUndefined(EntireSubject))
                    Item.EntireSubject = EntireSubject;

                if (!await Item.update())
                    return sendResult(false,'update object details failed',`Unable to update Media Group with id ${idObject}; update failed`);
            }
            break;
        }
        case COMMON.eSystemObjectType.eCaptureData: {
            if (data.CaptureData) {
                const CaptureData = await DBAPI.CaptureData.fetch(idObject);
                if (!CaptureData)
                    return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

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
                    folders,
                    datasetUse
                } = data.CaptureData;

                if (datasetFieldId && !H.Helpers.validFieldId(datasetFieldId)) return sendResult(false,'update object details failed','Dataset Field ID is invalid; update failed');
                if (itemPositionFieldId && !H.Helpers.validFieldId(itemPositionFieldId)) return sendResult(false,'update object details failed','Position Field ID is invalid; update failed');
                if (itemArrangementFieldId && !H.Helpers.validFieldId(itemArrangementFieldId)) return sendResult(false,'update object details failed','Arrangement Field ID is invalid; update failed');
                if (clusterGeometryFieldId && !H.Helpers.validFieldId(clusterGeometryFieldId)) return sendResult(false,'update object details failed','Cluster Geometry Field ID is invalid; update failed');

                CaptureData.DateCaptured = new Date(dateCaptured);
                if (description) CaptureData.Description = description;
                if (captureMethod) CaptureData.idVCaptureMethod = captureMethod;

                if (folders && folders.length) {
                    const foldersMap = new Map<string, number>();
                    folders.forEach((folder) => foldersMap.set(folder.name, folder.variantType ?? 0));
                    const CDFiles = await DBAPI.CaptureDataFile.fetchFromCaptureData(CaptureData.idCaptureData);
                    if (!CDFiles)
                        return sendResult(false,'update object details failed',`Unable to fetch Capture Data Files with id ${CaptureData.idCaptureData}; update failed`);
                    for (const file of CDFiles) {
                        const assetVersion = await DBAPI.AssetVersion.fetchLatestFromAsset(file.idAsset);
                        if (!assetVersion)
                            return sendResult(false,'update object details failed',`Unable to fetch asset version with idAsset ${file.idAsset}; update failed`);

                        const newVariantType = foldersMap.get(assetVersion.FilePath);
                        file.idVVariantType = newVariantType || null;
                        if (!await file.update())
                            return sendResult(false,'update object details failed',`Unable to update Capture Data File with id ${file.idCaptureDataFile}; update failed`);
                    }
                }
                if (!await CaptureData.update())
                    return sendResult(false,'update object details failed',`Unable to update Capture Data with id ${CaptureData.idCaptureData}; update failed`);

                // Fetch and update photogrammetry capture data details
                const CaptureDataPhoto: DBAPI.CaptureDataPhoto[] | null = await DBAPI.CaptureDataPhoto.fetchFromCaptureData(CaptureData.idCaptureData);
                if (!CaptureDataPhoto || CaptureDataPhoto.length < 1)
                    return sendResult(false,'update object details failed',`Unable to fetch CaptureDataPhoto with id ${idObject}; update failed`);

                const [CD] = CaptureDataPhoto;

                CD.CameraSettingsUniform = H.Helpers.safeBoolean(cameraSettingUniform);
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
                CD.CaptureDatasetUse = datasetUse;
                if (!await CD.update())
                    return sendResult(false,'update object details failed',`Unable to update CaptureDataPhoto with id ${CD.idCaptureData}; update failed`);
            }
            break;
        }
        case COMMON.eSystemObjectType.eModel: {
            if (data.Model) {
                const Model = await DBAPI.Model.fetch(idObject);
                if (!Model)
                    return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

                const {
                    DateCreated,
                    CreationMethod,
                    Modality,
                    Units,
                    Purpose,
                    ModelFileType,
                    Variant
                } = data.Model;

                const namedWithoutSubtitle: boolean = (data.Name != null && data.Subtitle == null);
                Model.Name = namedWithoutSubtitle ? data.Name : computeNewName(Model.Name, Model.Title, data.Subtitle); // do this before updating .Title
                Model.Title = data.Subtitle ?? null;

                if (CreationMethod) Model.idVCreationMethod = CreationMethod;
                if (Modality) Model.idVModality = Modality;
                if (Purpose) Model.idVPurpose = Purpose;
                if (Units) Model.idVUnits = Units;
                if (ModelFileType) Model.idVFileType = ModelFileType;
                Model.DateCreated = new Date(DateCreated);
                if (Variant) Model.Variant = Variant;

                if (!await Model.update())
                    return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            }
            break;
        }
        case COMMON.eSystemObjectType.eScene: {
            const Scene = await DBAPI.Scene.fetch(idObject);
            if (!Scene)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            const oldPosedAndQCd: boolean = Scene.PosedAndQCd;

            const namedWithoutSubtitle: boolean = (data.Name != null && data.Subtitle == null);
            Scene.Name = namedWithoutSubtitle ? data.Name : computeNewName(Scene.Name, Scene.Title, data.Subtitle); // do this before updated .Title
            Scene.Title = data.Subtitle ?? null;

            if (data.Scene) {
                if (typeof data.Scene.PosedAndQCd === 'boolean') Scene.PosedAndQCd = data.Scene.PosedAndQCd;
                if (typeof data.Scene.ApprovedForPublication === 'boolean') Scene.ApprovedForPublication = data.Scene.ApprovedForPublication;
            }
            if (!await Scene.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            // if we've changed Posed and QC'd, and/or we've updated our license, create or remove downloads
            const res: SceneUpdateResult = await PublishScene.handleSceneUpdates(Scene.idScene, idSystemObject, user?.idUser,
                oldPosedAndQCd, Scene.PosedAndQCd, LicenseOld, LicenseNew);
            if (!res.success)
                return sendResult(false,'update object details failed',res.error);
            return { success: true, message: res.downloadsGenerated ? 'Scene downloads are being generated' : res.downloadsRemoved ? 'Scene downloads were removed' : '' };
        }
        case COMMON.eSystemObjectType.eIntermediaryFile: {
            const IntermediaryFile = await DBAPI.IntermediaryFile.fetch(idObject);
            if (!IntermediaryFile)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            const Asset = await DBAPI.Asset.fetch(IntermediaryFile.idAsset);
            if (!Asset)
                return sendResult(false,'update object details failed',`Unable to fetch Asset using IntermediaryFile.idAsset ${IntermediaryFile.idAsset}; update failed`);
            Asset.FileName = data.Name;
            if (!await Asset.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            const assetVersion: DBAPI.AssetVersion | null = await DBAPI.AssetVersion.fetchLatestFromAsset(IntermediaryFile.idAsset);
            if (!assetVersion)
                return sendResult(false,'update object details failed',`Unable to fetch Asset Version using IntermediaryFile.idAsset ${IntermediaryFile.idAsset}; update failed`);
            assetVersion.FileName = data.Name;
            if (!await assetVersion.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eProjectDocumentation: {
            const ProjectDocumentation = await DBAPI.ProjectDocumentation.fetch(idObject);
            if (!ProjectDocumentation)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            ProjectDocumentation.Name = data.Name;
            if (data.ProjectDocumentation) {
                const { Description } = data.ProjectDocumentation;
                if (Description) ProjectDocumentation.Description = Description;
            }

            if (!await ProjectDocumentation.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eAsset: {
            const Asset = await DBAPI.Asset.fetch(idObject);
            if (!Asset)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            Asset.FileName = data.Name;
            if (data.Asset) {
                const { AssetType } = data.Asset;
                if (AssetType) Asset.idVAssetType = AssetType;
            }

            if (!await Asset.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eAssetVersion: {
            const AssetVersion = await DBAPI.AssetVersion.fetch(idObject);
            if (!AssetVersion)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            AssetVersion.FileName = data.Name;
            if (data.AssetVersion) {
                const { FilePath, Ingested } = data.AssetVersion;
                if (FilePath) AssetVersion.FilePath = FilePath;
                if (!isUndefined(Ingested))
                    AssetVersion.Ingested = Ingested;
            }

            if (!await AssetVersion.update())
                return sendResult(false, `Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eActor: {
            const Actor = await DBAPI.Actor.fetch(idObject);
            if (!Actor)
                return sendResult(false, `Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            Actor.IndividualName = data.Name;
            if (data.Actor) {
                const { OrganizationName } = data.Actor;
                Actor.OrganizationName = maybe<string>(OrganizationName);
            }
            if (!await Actor.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        case COMMON.eSystemObjectType.eStakeholder: {
            const Stakeholder = await DBAPI.Stakeholder.fetch(idObject);
            if (!Stakeholder)
                return sendResult(false,'update object details failed',`Unable to fetch ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);

            Stakeholder.IndividualName = data.Name;
            if (data.Stakeholder) {
                const { OrganizationName, MailingAddress, EmailAddress, PhoneNumberMobile, PhoneNumberOffice } = data.Stakeholder;
                if (OrganizationName) Stakeholder.OrganizationName = OrganizationName;
                Stakeholder.MailingAddress = maybe<string>(MailingAddress);
                Stakeholder.EmailAddress = maybe<string>(EmailAddress);
                Stakeholder.PhoneNumberMobile = maybe<string>(PhoneNumberMobile);
                Stakeholder.PhoneNumberOffice = maybe<string>(PhoneNumberOffice);
            }
            if (!await Stakeholder.update())
                return sendResult(false,'update object details failed',`Unable to update ${SystemObjectTypeToName(objectType)} with id ${idObject}; update failed`);
            break;
        }
        default:
            break;
    }

    // update shared ObjectProperties, if it exists
    // NOTE: assuming a single property of each type on an object
    const sensitivitySrc = data.ObjectProperties?.find( p => p.propertyType.toLowerCase()==='sensitivity');
    if(sensitivitySrc) {
        console.log('handling object properties: ',data.ObjectProperties,idSystemObject);
        const op: DBAPI.ObjectProperty[] | null = await DBAPI.ObjectProperty.fetchDerivedFromObject([idSystemObject]);
        const sensitivityDst: DBAPI.ObjectProperty | null = op?.find( p => p.PropertyType.toLowerCase()==='sensitivity' ) ?? null;
        if(!sensitivityDst)
            return sendResult(false, `Unable to fetch ObjectProperty for 'sensitivity' with id ${idSystemObject}; update failed`);

        sensitivityDst.Level = sensitivitySrc.level ?? sensitivityDst.Level;
        sensitivityDst.Rationale = sensitivitySrc.rationale ?? sensitivityDst.Rationale;
        sensitivityDst.idContact = sensitivitySrc.idContact ?? sensitivityDst.idContact;

        const updateResult: boolean = await sensitivityDst.update();
        if(!updateResult)
            return sendResult(false, `Unable to update ObjectProperty for 'sensitivity' with id ${idSystemObject}; update failed`);
    }

    return { success: true, message: '' };
}

function sendResult(success: boolean, message: string, reason?: string, data?: any): UpdateObjectDetailsResult {
    if (!success)
        RK.logError(RK.LogSection.eGQL,message,reason,data,'GraphQL.SystemObject.ObjectDetails');
    return { success, message: message ?? '' };
}

export async function handleMetadata(idSystemObject: number, metadatas: MetadataInput[] | null | undefined, user: User | undefined): Promise<H.IOResults> {
    if (!metadatas)
        return { success: true };

    for (const metadataInput of metadatas) {
        // handle wacky case of Edan metadata, which sometimes has a custom "Label".  In this case, encode the metadata label and value into a single value, separated by COL.EdanLabelContentDelimiter
        const value: string = (metadataInput.Label ? metadataInput.Label + COL.EdanLabelContentDelimiter : '') + metadataInput.Value;

        const valueLen: number = value.length;
        if (metadataInput.idMetadata) {
            // Updating existing metadata
            const metadata: DBAPI.Metadata | null = await DBAPI.Metadata.fetch(metadataInput.idMetadata);
            if (!metadata)
                return { success: false, error: `Unable to fetch metadata with id ${metadataInput.idMetadata}; update failed` };

            if (valueLen <= 255) {
                metadata.ValueShort = value;
                metadata.ValueExtended = null;
            } else {
                metadata.ValueShort = null;
                metadata.ValueExtended = value;
            }
            metadata.idAssetVersionValue = null;
            if (!await metadata.update())
                return { success: false, error: `Unable to update metadata with id ${metadataInput.idMetadata}` };
        } else {
            // Creating new metadata!
            const metadata: DBAPI.Metadata = new DBAPI.Metadata({
                Name: metadataInput.Name,
                ValueShort: valueLen <= 255 ? value : null,
                ValueExtended: valueLen <= 255 ? null : value,
                idAssetVersionValue: null,
                idUser: user?.idUser ?? null,
                idVMetadataSource: null,
                idSystemObject,
                idSystemObjectParent: idSystemObject,
                idMetadata: 0
            });
            if (!await metadata.create())
                return { success: false, error: `Unable to create metadata ${JSON.stringify(metadata)}` };
        }
    }
    return { success: true };
}

function computeNewName(oldName: string, oldTitle: string | null, newTitle: string | null | undefined): string {
    const oldBaseName: string = NameHelpers.computeBaseTitle(oldName, oldTitle);
    const newName: string = oldBaseName + ((newTitle) ? `: ${newTitle}` : '');
    // LOG.info(`updateObjectDetails computeNewName(${oldName}, ${oldTitle}, ${newTitle}) = ${newName} (oldBaseName = ${oldBaseName})`, LOG.LS.eGQL);

    return newName;
}