/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * DetailsView
 *
 * This component renders repository details view for the Repository UI.
 */
import API, { RequestResponse } from '../../../../api';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Typography,
    Tooltip
} from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { LoadingButton } from '../../../../components';
import IdentifierList from '../../../../components/shared/IdentifierList';
import { useUploadStore, useVocabularyStore, useRepositoryStore, useIdentifierStore, useDetailTabStore, ModelDetailsType, SceneDetailsType, useObjectMetadataStore, eObjectMetadataType } from '../../../../store';
import {
    ActorDetailFieldsInput,
    AssetDetailFieldsInput,
    AssetVersionDetailFieldsInput,
    CaptureDataDetailFields,
    CaptureDataDetailFieldsInput,
    ItemDetailFieldsInput,
    ModelDetailFieldsInput,
    ObjectPropertyResult,
    ProjectDetailFieldsInput,
    ProjectDocumentationDetailFieldsInput,
    RelatedObjectType,
    SceneDetailFieldsInput,
    StakeholderDetailFieldsInput,
    SubjectDetailFieldsInput,
    UnitDetailFieldsInput,
    UpdateIdentifier,
    UpdateObjectDetailsDataInput
} from '../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '@dpo-packrat/common';
import { withDefaultValueBoolean, withDefaultValueNumber } from '../../../../utils/shared';
import ObjectSelectModal from '../../../Ingestion/components/Metadata/Model/ObjectSelectModal';
import { updateDetailsTabData, useObjectDetails, deleteIdentifier, getDetailsTabDataForObject } from '../../hooks/useDetailsView';
import DetailsHeader from './DetailsHeader';
import DetailsTab, { UpdateDataFields } from './DetailsTab';
import DetailsThumbnail from './DetailsThumbnail';
import ObjectDetails from './ObjectDetails';
import ObjectNotFoundView from './ObjectNotFoundView';
import { eIngestionMode } from '../../../../constants';
import SpecialUploadList from '../../../Ingestion/components/Uploads/SpecialUploadList';
import { UploadReferences } from '../../../../store';
import NoticeBanner from './NoticeBanner';
import { useContactStore, Contact } from '../../../../store/contact';
import SplitActionButton, { SplitActionOption } from '../../../../components/controls/SplitActionButton';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        width: 'fit-content',
        flexDirection: 'column',
        padding: 20,
        paddingBottom: 0,
        paddingRight: 0,
        [breakpoints.down('lg')]: {
            paddingRight: 20
        }
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'auto',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            padding: 10
        }
    },
    updateButton: {
        height: 35,
        width: 100,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        }
    },
    toggle: {
        // base styles (optional)
        textTransform: 'none',

        // selected state
        '&.Mui-selected': {
            backgroundColor: palette.primary.main,
            color: 'white',
            borderColor: palette.primary.main,
        },
        // selected + hover
        '&.Mui-selected:hover': {
            backgroundColor: palette.primary.main, // a little darker for hover
            borderColor: palette.primary.main,
        },
    },
}));

type DetailsParams = {
    idSystemObject: string;
};
type DetailsFields = {
    name?: string;
    retired?: boolean;
    idLicense?: number;
    subtitle?: string;
};
type SceneGeneParameters = {
    optimalPlacement: boolean,
    decimationTool: 'Meshlab' | 'RapidCompact',
    decimationPasses: number
};

function DetailsView(): React.ReactElement {
    const classes = useStyles();
    const params = useParams<DetailsParams>();
    const [modalOpen, setModalOpen] = useState(false);
    const [details, setDetails] = useState<DetailsFields>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [detailQuery, setDetailQuery] = useState<any>({});
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [isGeneratingDownloads, setIsGeneratingDownloads] = useState(false);
    const [canGenerateDownloads, setCanGenerateDownloads] = useState(true);

    const [objectRelationship, setObjectRelationship] = useState<RelatedObjectType>(RelatedObjectType.Source);
    const [loadingIdentifiers, setLoadingIdentifiers] = useState(true);
    const idSystemObject: number = Number.parseInt(params.idSystemObject as string, 10);
    const { data, loading } = useObjectDetails(idSystemObject);
    let [updatedData, setUpdatedData] = useState<UpdateObjectDetailsDataInput>({});
    const [updatedIdentifiers, setUpdatedIdentifiers] = useState(false);
    const [updatedMetadata, setUpdatedMetadata] = useState(false);
    const [uploadReferences, setUploadReferences] = useState<UploadReferences | null>(null);
    const [ initializeObjectProperties, getObjectProperties, clearObjectProperties ] = useDetailTabStore(s => [
        s.initializeObjectProperties,
        s.getObjectProperties,
        s.clearObjectProperties
    ]);
    const [refreshTick, setRefreshTick] = useState(0);
    const [sceneGenParameters, setSceneGenParameters] = useState<SceneGeneParameters | null>(null);
    const [sceneGenDialogOpen, setSceneGenDialogOpen] = React.useState(false);
    const [decimationPassesInput, setDecimationPassesInput] = React.useState(
        String(sceneGenParameters?.decimationPasses ?? 1)
    );

    const getEntries = useVocabularyStore(state => state.getEntries);
    const [
        stateIdentifiers,
        areIdentifiersUpdated,
        addNewIdentifier,
        initializeIdentifierState,
        removeTargetIdentifier,
        updateIdentifier,
        checkIdentifiersBeforeUpdate,
        updateIdentifierPreferred,
        initializePreferredIdentifier
    ] = useIdentifierStore(state => [
        state.stateIdentifiers,
        state.areIdentifiersUpdated,
        state.addNewIdentifier,
        state.initializeIdentifierState,
        state.removeTargetIdentifier,
        state.updateIdentifier,
        state.checkIdentifiersBeforeUpdate,
        state.updateIdentifierPreferred,
        state.initializePreferredIdentifier
    ]);
    const [resetRepositoryFilter, resetKeywordSearch, initializeTree] = useRepositoryStore(state => [state.resetRepositoryFilter, state.resetKeywordSearch, state.initializeTree]);
    const [initializeDetailFields, getDetail, getDetailsViewFieldErrors] = useDetailTabStore(state => [
        state.initializeDetailFields,
        state.getDetail,
        state.getDetailsViewFieldErrors
    ]);
    const [getAllMetadataEntries, areMetadataUpdated, metadataControl, metadataDisplay, validateMetadataFields, initializeMetadata, resetMetadata] = useObjectMetadataStore(state => [state.getAllMetadataEntries, state.areMetadataUpdated, state.metadataControl, state.metadataDisplay, state.validateMetadataFields, state.initializeMetadata, state.resetMetadata]);
    const [resetSpecialPending] = useUploadStore(state => [state.resetSpecialPending]);

    const objectDetailsData = data;
    const fetchDetailTabDataAndSetState = async () => {
        const detailsTabData = await getDetailsTabDataForObject(idSystemObject, objectType);
        setDetailQuery(detailsTabData);
        initializeDetailFields(detailsTabData, objectType);
        if (objectType === eSystemObjectType.eSubject) {
            initializePreferredIdentifier(detailsTabData?.data?.getDetailsTabDataForObject?.Subject?.idIdentifierPreferred);
            setLoadingIdentifiers(false);
        }

        // init our object properties for this system object
        const raw = detailsTabData?.data?.getDetailsTabDataForObject?.objectProperties;
        console.log('[DetailsTabData] objectProperties from query', {
            idSO: idSystemObject,
            hasValue: Array.isArray(raw),
            count: Array.isArray(raw) ? raw.length : 'n/a',
        });
        if (Array.isArray(raw)) {
            useDetailTabStore.getState().initializeObjectProperties(idSystemObject, raw);
        } else {
            console.warn('[DetailsTabData] objectProperties missing; NOT overwriting store');
        }
    };
    const onUploaderReset = () => {
        resetSpecialPending(eIngestionMode.eAttach);
        resetSpecialPending(eIngestionMode.eUpdate);
        setUploadReferences(null);
    };
    const onUploaderOpen = (uploadType: eIngestionMode, references: UploadReferences) => {
        if (references.idAsset !== uploadReferences?.idAsset || references.idSOAttachment !== uploadReferences?.idSOAttachment) onUploaderReset();
        if (uploadType === eIngestionMode.eAttach) setUploadReferences({ idSOAttachment: references.idSOAttachment });
        if (uploadType === eIngestionMode.eUpdate) setUploadReferences({ idAsset: references.idAsset, idSOAttachment: references.idSOAttachment });
        setTimeout(() => {
            const specialUploader = document.getElementById('special-uploader');
            specialUploader?.scrollIntoView();
        }, 300);

    };
    const verifyGenerateDownloads = async (): Promise<boolean> => {
        // check whether we can actually generate downloads
        // TODO: check QC checkbox status, (ideally) if a generate downloads is already running, ...
        console.log('[PACKRAT] Verifying Generate Downloads...');

        // make a call to our generate downloads endpoint with the current scene id
        const response: RequestResponse = await API.generateDownloads([idSystemObject], true);
        if((response.success === false || !response.data || response.data.length===0)) {
            console.log(`[Packrat:ERROR] cannot verify if generate downloads is available. (${response.message})`);
            setCanGenerateDownloads(false);
            return false;
        }
        // console.log(`[PACKRAT:DEBUG] array: ${response.data && Array.isArray(response.data)} | isRunning: ${response.data[0].state.isJobRunning}, isValid: ${response.data[0].state.isValid}`,response);

        // see if we can actually run based on if a job isn't already running
        // and our scene meets the core requirements
        // should only receive one response here since this is from the details page
        const canRun: boolean = (response.data && Array.isArray(response.data))
            && (response.data[0].state.isJobRunning === false)
            && (response.data[0].state.isValid === true);

        // we have success so enable it
        // console.log(`[PACKRAT:DEBUG] can generate downloads: ${canRun}`);
        setCanGenerateDownloads(canRun);
        return canRun;
    };

    useEffect(() => {
        if (data) {
            // console.log('[DetailsView] getSystemObjectDetails:', JSON.stringify(data.getSystemObjectDetails, null, 2));
            const handleDetailTab = async () => {
                await fetchDetailTabDataAndSetState();
            };
            handleDetailTab();
        }
    }, [idSystemObject, data]);
    useEffect(() => {
        if (data && !loading) {
            const { name, retired, license, metadata, subTitle } = data.getSystemObjectDetails;
            setDetails({ name, retired, idLicense: license?.idLicense || 0, subtitle: subTitle ?? '' });
            initializeIdentifierState(data.getSystemObjectDetails.identifiers);
            if (objectType === eSystemObjectType.eSubject) {
                initializeMetadata(eObjectMetadataType.eSubjectView, metadata); // comment me out!
            } else {
                initializeMetadata(eObjectMetadataType.eDetailView, metadata); // comment me out!
            }
        }
    }, [data, loading, initializeIdentifierState]);
    useEffect(() => {
        const propsFromServer = data?.getSystemObjectDetails?.objectProperties ?? [];
        console.log('[DetailsView] init from server', { idSO: idSystemObject, count: propsFromServer.length, types: propsFromServer.map(p => p.propertyType) });
        initializeObjectProperties(idSystemObject, propsFromServer);

        return () =>  {
            console.log('[DetailsView] clearing ObjectProperties for', idSystemObject);
            clearObjectProperties(idSystemObject);
        };

    }, [idSystemObject, data?.getSystemObjectDetails?.objectProperties]);

    // checks for updates to identifiers
    useEffect(() => {
        setUpdatedIdentifiers(areIdentifiersUpdated());
    }, [stateIdentifiers]);

    // checks for updates to metadata
    useEffect(() => {
        setUpdatedMetadata(areMetadataUpdated());
    }, [metadataControl, metadataDisplay]);
    useEffect(() => {
        return () => {
            resetMetadata();
        };
    }, []);
    useEffect(() => {
        onUploaderReset();

        return () => onUploaderReset();
    }, []);
    useEffect(() => {
        verifyGenerateDownloads();
    }, []);
    useEffect(() => {
        // warm the cache once
        useContactStore.getState().loadAll();
    }, []);
    useEffect(() => {
        // keep in sync if dialog parameters change
        setDecimationPassesInput(String(sceneGenParameters?.decimationPasses ?? 1));
    }, [sceneGenParameters?.decimationPasses, sceneGenDialogOpen]);

    // contacts and notice
    const ops = useDetailTabStore(s => s.getObjectProperties(idSystemObject));
    const primaryIdContact: number | null = React.useMemo(() => {
        if (!ops || !ops.length) return null;
        const sens = ops
            .filter(p => p.propertyType.toLowerCase() === 'sensitivity' && p.level > 0)
            .reduce<ObjectPropertyResult | undefined>((max, cur) => (!max || cur.level > max.level ? cur : max), undefined);
        return sens?.idContact ?? null;
    }, [ops]);
    const getContact = useContactStore(s => s.get); // hook used unconditionally ✔
    const contact: Contact | undefined = getContact(primaryIdContact ?? undefined);
    const notice = React.useMemo(
        () => getNoticeConfig(ops, contact),
        [ops, contact]
    );

    if (!data || !params.idSystemObject) {
        return <ObjectNotFoundView loading={loading} />;
    }

    const {
        idObject,
        objectType,
        allowed,
        publishedState,
        publishedEnum,
        publishable,
        thumbnail,
        unit,
        project,
        subject,
        item,
        asset,
        assetOwner,
        objectAncestors,
        sourceObjects,
        derivedObjects,
        objectVersions,
        metadata,
        licenseInheritance = null,
    } = data.getSystemObjectDetails;
    const disabled: boolean = !allowed;

    const addIdentifer = () => {
        addNewIdentifier();
    };

    const removeIdentifier = async (idIdentifier: number, id: number) => {
        // handles deleting exisiting identifiers and newly added ones
        if (idIdentifier) {
            const confirm = window.confirm('Are you sure you wish to remove this?');
            if (!confirm) return;
            const deleteIdentifierSuccess = await deleteIdentifier(idIdentifier);
            if (deleteIdentifierSuccess) {
                removeTargetIdentifier(idIdentifier);
                setUpdatedIdentifiers(false);
                toast.success('Identifier removed');
            } else {
                toast.error('Error when removing identifier');
            }
        } else {
            removeTargetIdentifier(0, id);
        }
    };

    const updateIdentifierFields = (id: number, name: string, value) => {
        updateIdentifier(id, name, value);
    };

    const onModalClose = () => {
        setModalOpen(false);
        setObjectRelationship(RelatedObjectType.Source);
        resetRepositoryFilter(false);
    };

    const onAddSourceObject = () => {
        setObjectRelationship(RelatedObjectType.Source);
        resetKeywordSearch();
        resetRepositoryFilter(false);
        initializeTree();
        setModalOpen(true);
    };

    const onAddDerivedObject = () => {
        setObjectRelationship(RelatedObjectType.Derived);
        resetKeywordSearch();
        resetRepositoryFilter(false);
        initializeTree();
        setModalOpen(true);
    };

    const onNameUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, name: target.value }));
        updatedDataFields.Name = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onRetiredUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, retired: target.checked }));
        updatedDataFields.Retired = target.checked;
        setUpdatedData(updatedDataFields);
    };

    const onLicenseUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, idLicense: target.value }));
        updatedDataFields.License = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onSubtitleUpdate = ({ target }): void => {
        const updatedDataFields: UpdateObjectDetailsDataInput = { ...updatedData };
        setDetails(details => ({ ...details, subtitle: target.value }));
        updatedDataFields.Subtitle = target.value;
        setUpdatedData(updatedDataFields);
    };

    const onPublishUpdate = (): void => {
        // console.log(`[PACKRAT] ${JSON.stringify(target)}`);
        // if(target)
        //     console.log(`[PACKRAT:DEBUG] Repository.DetailsView.onPublishUpdate (value: ${target.value} | enum: ${PublishedStateEnumToString(target.value)} | name: ${target.name} | ${ePublishedState[parseInt(target.value)]}:${typeof(ePublishedState[parseInt(target.value)])} | data: ${publishedState})`);
        console.log('[PACKRAT:DEBUG] Repository.DetailsView.onPublishUpdate');

        // update our tick so child components update themself
        setRefreshTick(t => t + 1);

        // const pState: ePublishedState = ePublishedState[parseInt(target.value)];
        // if(pState.toString() != publishedState) {
        //     console.warn('published states diff. updating...');
        // } else  {
        //     console.info('published states are identical. skipping update');
        //     return;
        // }
        // switch(pState) {
        //     case ePublishedState.eNotPublished: {
        //         console.info('[PACKRAT] un-publishing...');
        //     }

        //     case
        // }
    };

    const onUpdateDetail = (objectType: number, data: UpdateDataFields): void => {

        const updatedDataFields: UpdateObjectDetailsDataInput = {
            ...updatedData,
            Name: details.name,
            Retired: details.retired
        };
        console.log('[DetailsView.onUpdateDetail] received from child:', data);

        // we need to extract object properties and append to our data since it is a shared
        // data and not specific to an object type.
        if (data && (data as any).ObjectProperties) {
            const { ObjectProperties, ...rest } = (data as any);
            // keep exactly the array shape you receive
            console.log('[DetailsView.onUpdateDetail] extracted ObjectProperties:', ObjectProperties);
            data = rest as any; // pass the remainder to the per-type input
        }

        switch (objectType) {
            case eSystemObjectType.eUnit:
                updatedDataFields.Unit = data as UnitDetailFieldsInput;
                break;
            case eSystemObjectType.eProject:
                updatedDataFields.Project = data as ProjectDetailFieldsInput;
                break;
            case eSystemObjectType.eSubject:
                updatedDataFields.Subject = data as SubjectDetailFieldsInput;
                break;
            case eSystemObjectType.eItem:
                updatedDataFields.Item = data as ItemDetailFieldsInput;
                break;
            case eSystemObjectType.eCaptureData:
                updatedDataFields.CaptureData = data as CaptureDataDetailFieldsInput;
                break;
            case eSystemObjectType.eModel:
                updatedDataFields.Model = data as ModelDetailFieldsInput;
                break;
            case eSystemObjectType.eScene: {
                // make sure we only update if the values we get back are different
                const next = data as SceneDetailFieldsInput;
                const prev = (updatedData.Scene ?? {}) as SceneDetailFieldsInput;

                const same =
                prev?.ApprovedForPublication === next?.ApprovedForPublication &&
                prev?.PosedAndQCd === next?.PosedAndQCd;

                // No actual change — skip touching state to avoid churn
                if (same)
                    return;

                updatedDataFields.Scene = next;
                break;
            }
            case eSystemObjectType.eIntermediaryFile:
                break;
            case eSystemObjectType.eProjectDocumentation:
                updatedDataFields.ProjectDocumentation = data as ProjectDocumentationDetailFieldsInput;
                break;
            case eSystemObjectType.eAsset:
                updatedDataFields.Asset = data as AssetDetailFieldsInput;
                break;
            case eSystemObjectType.eAssetVersion:
                updatedDataFields.AssetVersion = data as AssetVersionDetailFieldsInput;
                break;
            case eSystemObjectType.eActor:
                updatedDataFields.Actor = data as ActorDetailFieldsInput;
                break;
            case eSystemObjectType.eStakeholder:
                updatedDataFields.Stakeholder = data as StakeholderDetailFieldsInput;
                break;
            default:
                break;
        }
        setUpdatedData(updatedDataFields);
    };

    const updateData = async (): Promise<boolean> => {

        toast.dismiss();
        setIsUpdatingData(true);
        const identifierCheck = checkIdentifiersBeforeUpdate();
        if (identifierCheck.length) {
            identifierCheck.forEach(error => toast.error(error));
            setIsUpdatingData(false);
            return false;
        }

        const stateIdentifiersWithIdSystemObject: UpdateIdentifier[] = stateIdentifiers.map(({ id, identifier, identifierType, idIdentifier, preferred }) => {
            return {
                id,
                identifier,
                identifierType,
                idSystemObject,
                idIdentifier,
                preferred
            };
        });

        updatedData.Retired = updatedData?.Retired || details?.retired;
        updatedData.Name = updatedData?.Name || objectDetailsData?.getSystemObjectDetails.name;
        updatedData.Subtitle = updatedData?.Subtitle || details?.subtitle;
        updatedData.Identifiers = stateIdentifiersWithIdSystemObject || [];

        const invalidMetadata = validateMetadataFields();
        if (invalidMetadata.length) {
            invalidMetadata.forEach(message => toast.error(message, { autoClose: false }));
            return false;
        }

        if (objectType === eSystemObjectType.eItem && typeof updatedData.Item?.EntireSubject === 'boolean' && !updatedData.Item.EntireSubject) {
            if (!updatedData.Subtitle || !updatedData.Subtitle.length) {
                toast.error('Subtitle required because Entire Subject is not checked');
                setIsUpdatingData(false);
                return false;
            }
        }

        // Create another validation here to make sure that the appropriate SO types are being checked
        const errors = await getDetailsViewFieldErrors(updatedData, objectType);
        if (errors.length) {
            errors.forEach(error => toast.error(`${error}`, { autoClose: false }));
            setIsUpdatingData(false);
            return false;
        }

        try {
            if (objectType === eSystemObjectType.eModel) {
                const ModelDetails = getDetail(objectType) as ModelDetailsType;
                const { DateCreated, idVCreationMethod, idVModality, idVPurpose, idVUnits, idVFileType, Variant } = ModelDetails;

                updatedData.Model = {
                    Name: updatedData?.Name,
                    CreationMethod: idVCreationMethod,
                    Modality: idVModality,
                    Purpose: idVPurpose,
                    Units: idVUnits,
                    ModelFileType: idVFileType,
                    DateCreated,
                    Variant: Variant ?? '[]',
                };
            }

            if (objectType === eSystemObjectType.eScene && updatedData.Scene) {
                const SceneDetails = getDetail(objectType) as SceneDetailsType;
                const { ApprovedForPublication, PosedAndQCd } = SceneDetails;
                updatedData.Scene = { PosedAndQCd, ApprovedForPublication };
            }
            // convert subject inputs to numbers to handle scientific notation
            if (objectType === eSystemObjectType.eSubject && updatedData.Subject) {
                const { Latitude, Longitude, Altitude, TS0, TS1, TS2, R0, R1, R2, R3 } = updatedData.Subject;
                updatedData.Subject.Latitude = Latitude ? Number(Latitude) : null;
                updatedData.Subject.Longitude = Longitude ? Number(Longitude) : null;
                updatedData.Subject.Altitude = Altitude ? Number(Altitude) : null;
                updatedData.Subject.TS0 = TS0 ? Number(TS0) : null;
                updatedData.Subject.TS1 = TS1 ? Number(TS1) : null;
                updatedData.Subject.TS2 = TS2 ? Number(TS2) : null;
                updatedData.Subject.R0 = R0 ? Number(R0) : null;
                updatedData.Subject.R1 = R1 ? Number(R1) : null;
                updatedData.Subject.R2 = R2 ? Number(R2) : null;
                updatedData.Subject.R3 = R3 ? Number(R3) : null;
            }

            if (objectType === eSystemObjectType.eCaptureData) {
                const CaptureDataDetails = getDetail(objectType) as CaptureDataDetailFields;
                const {
                    captureMethod,
                    dateCaptured,
                    datasetType,
                    systemCreated,
                    description,
                    cameraSettingUniform,
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
                } = CaptureDataDetails;

                updatedData.CaptureData = {
                    captureMethod,
                    dateCaptured,
                    datasetType,
                    systemCreated,
                    description,
                    cameraSettingUniform,
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
                };
            }

            const metadata = getAllMetadataEntries().filter(entry => entry.Name);
            updatedData.Metadata = metadata;

            // get our object properties
            // console.log('[DetailsView.updateData] final updatedData:', JSON.stringify(updatedData, null, 2));
            const ops = getObjectProperties(idSystemObject) ?? [];
            if (ops.length) {
                updatedData = {
                    ...updatedData,
                    ObjectProperties: ops.map(({ propertyType, level, rationale, idContact }) => ({
                        propertyType,
                        level,
                        rationale,
                        idContact
                    }))
                };
            }
            // console.log('[DetailsView.updateData] object properties:', JSON.stringify(ops, null, 2));

            // send data to the server
            const { data } = await updateDetailsTabData(idSystemObject, idObject, objectType, updatedData);

            if (data?.updateObjectDetails?.success) {
                const message: string | null | undefined = data?.updateObjectDetails?.message;
                toast.success(`Data saved successfully${message? ': ' + message : ''}`);
                fetchDetailTabDataAndSetState();

                // tell children to refresh their own data
                setRefreshTick(t => t + 1);

                return true;
            } else
                throw new Error(data?.updateObjectDetails?.message ?? '');
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Failed to save updated data${message}`);
            return false;
        } finally {
            setIsUpdatingData(false);

            // check our generate downloads button
            await verifyGenerateDownloads();
        }
    };

    const generateDownloads = async (): Promise<boolean> => {
        // fire off download generation for the scene. (UI element, ln. 593)
        // TODO: move into 'Assets' tab (currently lacking context/details on if we're a scene)
        console.log('[PACKRAT] Generating Downloads...');
        if(isGeneratingDownloads === true || canGenerateDownloads === false) {
            console.error('[Packrat] cannot generate downloads. not sure how you got here...');
            return false;
        }
        setIsGeneratingDownloads(true);
        setCanGenerateDownloads(false);

        // get our current time so we can make sure we exeecute for a certain amount of time
        const startTime: number = Date.now();

        // make a call to our generate downloads endpoint with the current scene id
        // return sucess when the job is started or if one is already running
        const response: RequestResponse = await API.generateDownloads([idSystemObject]);
        if(response.success === false) {

            // get our message from our first response
            const responseMessage: string = response.data?.[0]?.message ?? 'undefined';

            // if the job is running then handle differently
            if(responseMessage.includes('already running')) {
                console.log(`[Packrat - WARN] cannot generate downloads. (${responseMessage})`);
                toast.warn('Not generating downloads. Job already running. Please wait for it to finish.');
            } else {
                console.log(`[Packrat - ERROR] cannot generate downloads. (${responseMessage})`);
                toast.error('Cannot generate downloads. Check the report.');
            }

            // update our button state
            setCanGenerateDownloads(true);

            // set to false to stop 'loading' animation on button. doesn't (currently) represent state of job on server
            setIsGeneratingDownloads(false);
            return false;
        }

        // wait for a period of time before resetting our buttons
        // setting a minimal time improves UX and shows spinning logo
        const diffTime = Math.max(1,2000-(Date.now()-startTime));
        setTimeout(() => {
            // TODO: keep polling to set our button state back
            // if our message is already running then we notify the user
            toast.success('Generating Downloads started. This may take awhile...');

            // cleanup our button state
            setCanGenerateDownloads(true);
            setIsGeneratingDownloads(false);
        }, diffTime);

        //console.log(`waiting ${diffTime/1000}s before cleaning up button`);
        return true;
    };

    //#region SCENE GENERATION
    const DEFAULT_SCENE_GEN_PARAMS: SceneGeneParameters = {
        optimalPlacement: true,
        decimationTool: 'Meshlab',
        decimationPasses: 1,
    };
    const generateSceneAdvanced = async(parameters?: any | null): Promise<boolean> => {

        console.log('[PACKRAT] Generating Scene...', data.getSystemObjectDetails, parameters, sceneGenParameters);

        // make a call to our generate scene endpoint with the current scene id
        // return sucess when the job is started or if one is already running
        const response: RequestResponse = await API.generateScene([idSystemObject], parameters ? sceneGenParameters : undefined);
        if(response.success === false) {

            // get our message from our first response
            const responseMessage: string = response.data?.[0]?.message ?? 'undefined';

            // if the job is running then handle differently
            if(responseMessage.includes('already running')) {
                console.log(`[Packrat - WARN] cannot generate scene. (${responseMessage})`);
                toast.warn('Not generating scene. Job already running. Please wait for it to finish.');
            } else {
                console.log(`[Packrat - ERROR] cannot generate scene. (${responseMessage})`);
                toast.error('Cannot generate scene. Check the report.');
            }

            console.log(idSystemObject,parameters,sceneGenParameters);
            return false;
        }

        toast.success('Generating scene started. This may take awhile...');
        return true;
    };
    const generateScene = async (): Promise<boolean> => {
        // feed null to trigger defaults are to be used
        return generateSceneAdvanced(null);
    };
    const updateSceneGenParams = (partial: Partial<SceneGeneParameters>) => {
        setSceneGenParameters(prev => ({ ...(prev ?? DEFAULT_SCENE_GEN_PARAMS), ...partial }));
    };
    const confirmSceneGenAdvanced = async () => {
        await generateSceneAdvanced(sceneGenParameters); // null means defaults (simple)
        setSceneGenDialogOpen(false);
    };
    const commitSceneGenDecimationPasses = () => {
        const n = Math.max(1, parseInt(decimationPassesInput, 10) || 1);
        updateSceneGenParams({ decimationPasses: n });
        setDecimationPassesInput(String(n));
    };
    const sceneGenOptions: SplitActionOption[] = [
        { label: 'Generate Scene', onClick: generateScene },
        { label: 'Generate Scene (Advanced)', onClick: () => setSceneGenDialogOpen(true) },
    ];
    //#endregion

    const immutableNameTypes = new Set([eSystemObjectType.eItem, eSystemObjectType.eModel, eSystemObjectType.eScene]);

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                {notice?.show && (
                    <NoticeBanner
                        state={notice.state}
                        title={notice.title}
                        messageHTML={notice.messageHTML}
                        messageText={notice.messageText}
                    />
                )}

                <DetailsHeader
                    originalFields={data.getSystemObjectDetails}
                    name={details.name}
                    disabled={disabled || immutableNameTypes.has(objectType)}
                    objectType={objectType}
                    path={objectAncestors}
                    onNameUpdate={onNameUpdate}
                />

                <Box display='flex' mt={2}>
                    <ObjectDetails
                        unit={unit}
                        project={project}
                        subject={subject}
                        item={item}
                        asset={asset}
                        disabled={disabled}
                        publishedState={publishedState}
                        publishedEnum={publishedEnum}
                        publishable={publishable}
                        retired={withDefaultValueBoolean(details.retired, false)}
                        objectType={objectType}
                        onRetiredUpdate={onRetiredUpdate}
                        onLicenseUpdate={onLicenseUpdate}
                        onPublishUpdate={onPublishUpdate}
                        originalFields={data.getSystemObjectDetails}
                        license={withDefaultValueNumber(details.idLicense, 0)}
                        idSystemObject={idSystemObject}
                        licenseInheritance={licenseInheritance}
                        path={objectAncestors}
                        updateData={updateData}
                    />
                    <Box display='flex' flex={2.2} flexDirection='column'>
                        <IdentifierList
                            viewMode
                            disabled={disabled}
                            identifiers={stateIdentifiers || []}
                            identifierTypes={getEntries(eVocabularySetID.eIdentifierIdentifierType)}
                            onAdd={addIdentifer}
                            onRemove={removeIdentifier}
                            onUpdate={updateIdentifierFields}
                            subjectView={objectType === eSystemObjectType.eSubject}
                            onUpdateIdIdentifierPreferred={updateIdentifierPreferred}
                            loading={loadingIdentifiers}
                        />
                    </Box>
                </Box>

                <Box display='flex' alignItems='center' mt={'10px'}>
                    <LoadingButton className={classes.updateButton} onClick={updateData} disableElevation loading={isUpdatingData}>
                        Update
                    </LoadingButton>
                    {(updatedIdentifiers || updatedMetadata) &&
                        <div
                            style={{ fontStyle: 'italic', marginLeft: '5px' }}
                        >Update needed to save your data</div>}

                    {(objectType === eSystemObjectType.eScene || objectType === eSystemObjectType.eModel) &&
                        <LoadingButton className={classes.updateButton}
                            loading={false}
                            onClick={() => document.getElementById('Voyager-Explorer')?.scrollIntoView()}
                            style={{ marginLeft: 5 }}
                        >View</LoadingButton>}

                    {(objectType === eSystemObjectType.eScene) &&
                        <LoadingButton className={classes.updateButton}
                            loading={isGeneratingDownloads}
                            disabled={!canGenerateDownloads}
                            onClick={generateDownloads}
                            style={{ marginLeft: 5, width: '200px' }}
                        >Generate Downloads</LoadingButton>}

                    {(objectType === eSystemObjectType.eModel) &&
                    <>
                        <SplitActionButton options={sceneGenOptions} defaultIndex={0} />

                        <Dialog
                            open={sceneGenDialogOpen}
                            onClose={() => setSceneGenDialogOpen(false)}
                            aria-labelledby='adv-generate-title'
                            fullWidth
                            maxWidth='xs'
                            PaperProps={{ style: { maxWidth: '30rem' } }}
                        >
                            <DialogTitle id='adv-generate-title'>Advanced Scene Generation</DialogTitle>

                            <DialogContent dividers>
                                <Typography variant='body2' gutterBottom style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    If you know your model needs special handling, or you want to torubleshoot poor results, use the settings below to change how the Voyager scene is generated.
                                    <p><b><a href='mailto:packrat@si.edu' style={{ color: 'black' }}>Contact Packrat Support for Guidance</a></b></p>
                                </Typography>

                                {/* Optimal Placement (tooltip + toggle group) */}
                                <Tooltip title='If enabled, the system will attempt to optimally place each vertex after decimation. If seeing "spikes" in your resulting meshes, try disabling this.'>
                                    <Box mt={2} mb={1} display='flex' flexDirection='column'>
                                        <Typography variant='subtitle2' style={{ fontSize: '0.875rem' }}>Optimal Placement</Typography>
                                        <ToggleButtonGroup
                                            value={(sceneGenParameters?.optimalPlacement ?? true) ? 'on' : 'off'}
                                            exclusive
                                            onChange={(_, value) => updateSceneGenParams({ optimalPlacement: value === 'on' })}
                                            style={{ marginTop: 4 }}
                                        >
                                            <ToggleButton value='on' className={classes.toggle}>On</ToggleButton>
                                            <ToggleButton value='off' className={classes.toggle}>Off</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Tooltip>

                                {/* Decimation Tool (tooltip + outlined select) */}
                                <Tooltip title='Select which decimation tool to use when simplifying the model mesh. MeshLab is the default.'>
                                    <TextField
                                        select
                                        variant='outlined'
                                        fullWidth
                                        margin='normal'
                                        label='Decimation Tool'
                                        value={sceneGenParameters?.decimationTool ?? 'Meshlab'}
                                        onChange={(e) =>
                                            updateSceneGenParams({
                                                decimationTool: e.target.value as SceneGeneParameters['decimationTool'],
                                            })
                                        }
                                    >
                                        <MenuItem value='Meshlab'>Meshlab</MenuItem>
                                        <MenuItem value='RapidCompact'>Rapid Compact</MenuItem>
                                    </TextField>
                                </Tooltip>

                                {/* Decimation Passes (tooltip + outlined number field) */}
                                <Tooltip title='The number of times to run iterative decimation. This can help with very complex geometry as it progressively tries to reduce the geometry. Default is 1.'>
                                    <TextField
                                        variant='outlined'
                                        label='Decimation Passes'
                                        type='number'                   // keep number for scroll/keyboard; string state handles editing
                                        margin='normal'
                                        fullWidth
                                        inputProps={{ min: 1, step: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
                                        value={decimationPassesInput}   // <-- string
                                        onChange={(e) => setDecimationPassesInput(e.target.value)} // allow '', '12', etc.
                                        onBlur={commitSceneGenDecimationPasses}  // clamp/apply when the user is done
                                        onKeyDown={(e) => { if (e.key === 'Enter') commitSceneGenDecimationPasses(); }}
                                    />
                                </Tooltip>
                            </DialogContent>

                            <DialogActions>
                                <Button onClick={() => setSceneGenDialogOpen(false)}>Cancel</Button>
                                <Button color='primary' variant='contained' onClick={confirmSceneGenAdvanced} style={{ color: 'white' }}>
                                    Run Advanced
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </>
                    }
                </Box>

                <Box display='flex'>
                    <DetailsTab
                        disabled={disabled}
                        idSystemObject={idSystemObject}
                        objectType={objectType}
                        assetOwner={assetOwner}
                        sourceObjects={sourceObjects}
                        derivedObjects={derivedObjects}
                        onAddSourceObject={onAddSourceObject}
                        onAddDerivedObject={onAddDerivedObject}
                        onUpdateDetail={onUpdateDetail}
                        onSubtitleUpdate={onSubtitleUpdate}
                        subtitle={details?.subtitle}
                        originalSubtitle={data.getSystemObjectDetails?.subTitle || ''}
                        objectVersions={objectVersions}
                        detailQuery={detailQuery}
                        metadata={metadata}
                        onUploaderOpen={onUploaderOpen}
                        publishedState={publishedState}
                        refreshTick={refreshTick}
                        parentRetired={details?.retired ?? false}
                    />
                </Box>
                {(uploadReferences && uploadReferences.idAsset) && (
                    <SpecialUploadList
                        uploadType={eIngestionMode.eUpdate}
                        onUploaderClose={onUploaderReset}
                        idAsset={uploadReferences?.idAsset}
                        idSOAttachment={idSystemObject}
                        idSO={idSystemObject}
                    />
                )}
                {(uploadReferences && uploadReferences.idSOAttachment) && <SpecialUploadList uploadType={eIngestionMode.eAttach} onUploaderClose={onUploaderReset} idSOAttachment={uploadReferences?.idSOAttachment} idSO={idSystemObject} />}

                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail thumbnail={thumbnail} idSystemObject={idSystemObject} objectType={objectType} />
                </Box>

                <ObjectSelectModal
                    open={modalOpen}
                    onModalClose={onModalClose}
                    selectedObjects={objectRelationship === RelatedObjectType.Source ? sourceObjects : derivedObjects}
                    idSystemObject={idSystemObject}
                    relationship={objectRelationship}
                    objectType={objectType}
                />
            </Box>
        </Box>
    );
}

//#region NOTICE
type NoticeConfig = {
    show: boolean;
    state: 'error' | 'warning' | 'info';
    title: string;
    messageHTML?: string;
    messageText?: string;
};
export function getNoticeConfig(properties: ObjectPropertyResult[] | null, contact?: Contact | null): NoticeConfig | null {
    // creates notices from the object's properties.
    // currently limited to one notice (sensitivity), but can later
    // support other notices/flags to the user.
    if(!properties)
        return { show: false, state: 'info', title: '' };

    console.log(contact);

    // see if we have a sensitivity notice
    const sensitiveProps: ObjectPropertyResult | undefined = properties.filter(p => p.propertyType.toLowerCase() === 'sensitivity' && p.level > 0)
        .reduce<ObjectPropertyResult | undefined>((max, cur) => {
        if (!max || cur.level > max.level) return cur;
        return max;
    }, undefined);

    // if we have nothing return, otherwise, take first
    if(!sensitiveProps)
        return { show: false, state: 'info', title: 'no notices need showing' };
    const prop: ObjectPropertyResult = sensitiveProps;

    // build our notice for return
    let messageHTML = '';
    switch(sensitiveProps.level) {
        case 0: {
            messageHTML += 'This object is deemed NOT sensitive, but still follows Smithsonian policy for digital assets.';
            messageHTML += '</br>Governing policy: <a href="https://www.si.edu/sites/default/files/about/sd609.pdf" target="_blank" rel="noopener noreferrer">DIGITAL ASSET ACCESS AND USE (SD-609)</a>.';
        } break;
        case 1: {
            messageHTML += 'This object is marked as sensitive and must not be modified or published without proper authorization. ';
            messageHTML += '</br>Governing policy: <a href="https://www.si.edu/sites/default/files/about/sd609.pdf" target="_blank" rel="noopener noreferrer">DIGITAL ASSET ACCESS AND USE (SD-609)</a>.';
        } break;
        case 2: {
            messageHTML += 'This object is confidential and visible only to selecet members.';
            messageHTML += '</br>Governing policy: <a href="https://www.si.edu/sites/default/files/about/sd609.pdf" target="_blank" rel="noopener noreferrer">DIGITAL ASSET ACCESS AND USE (SD-609)</a>.';
            messageHTML += '</br></br>If you think you should be able to see this object please contact the individual below and Packrat support (<b>packrat@si.edu</b>)';
        }
    }

    // shared lines (contact/reason)
    messageHTML += `</br></br><b>Reason</b>: ${prop.rationale}`;
    messageHTML += `</br><b>Contact</b>: ${contact?.Name ?? 'Anonymous'} (${contact?.EmailAddress ?? 'Unknown'})`;

    return {
        show: true,
        state: (prop.level===1) ? 'warning' : (prop.level===2) ? 'error' : 'info',
        title: (prop.level===1) ? 'Sensitive Object' : (prop.level===2) ? 'Confidential' : 'Not Sensitive',
        messageHTML
    };
}
//#endregion

export default DetailsView;
