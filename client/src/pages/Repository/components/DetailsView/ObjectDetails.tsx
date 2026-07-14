/* eslint-disable react/jsx-max-props-per-line */
/**
 * Object Details
 *
 * This component renders object details for the Repository Details UI.
 */
import { Box, Button, Typography, Select, MenuItem, Tooltip, Divider } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import { NewTabLink } from '../../../../components';
import { GetSystemObjectDetailsResult, RepositoryPath, License, ObjectPropertyResult, Unit } from '../../../../types/graphql';
import { getDetailsUrlForObject } from '../../../../utils/repository';
import { useLicenseStore, useDetailTabStore } from '../../../../store';
import { clearLicenseAssignment, assignLicense, publish } from '../../hooks/useDetailsView';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import { LoadingButton } from '../../../../components';
import { toast } from 'react-toastify';
import { eSystemObjectType, ePublishedState } from '@dpo-packrat/common';
import { ToolTip } from '../../../../components';
import { HelpOutline } from '@material-ui/icons';
import { getUnitsList } from '../../../Admin/hooks/useAdminView';
import RetireActionModal from './RetireActionModal';

const useStyles = makeStyles(({ palette }) => createStyles({
    detail: {
        display: 'flex',
        alignItems: 'flex-start',
        minHeight: 20,
        width: '100%',
        marginBottom: 8
    },
    label: {
        fontWeight: 500,
        alignSelf: 'flex-start',
        color: palette.primary.dark
    },
    value: {
        color: palette.primary.dark,
        textDecoration: ({ clickable = true, value, paths }: DetailProps) => (clickable && (value || paths) ? 'underline' : undefined)
    }
}));

const useObjectDetailsStyles = makeStyles(({ breakpoints, palette }) => ({
    loadingBtn: {
        height: 20,
        width: 'fit-content',
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 24
        }
    },
    select: {
        fontSize: '0.875rem',
        color: 'rgb(44, 64, 90)',
        marginRight: '5px',
        height: 20
    },
    assignedLicense: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        whiteSpace: 'pre',
        flexWrap: 'wrap'
    },
    inheritedLicense: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'baseline',
        whiteSpace: 'pre-wrap',
        flexWrap: 'wrap'
    },
    buttonRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        rowGap: 6,
        marginTop: 4
    },
    sectionDivider: {
        marginTop: 8,
        marginBottom: 8
    },
    link: {
        display: 'flex',
        color: 'rgb(0, 121, 196)',
        marginRight: '5px',
        textDecoration: 'underline'
    },
    value: {
        color: palette.primary.dark
    }
}));

interface ObjectDetailsProps {
    unit?: RepositoryPath[] | null;
    project?: RepositoryPath[] | null;
    subject?: RepositoryPath[] | null;
    item?: RepositoryPath[] | null;
    asset?: RepositoryPath | null;
    disabled: boolean;
    publishedState: string;
    publishedEnum: number;
    publishable: boolean;
    isDraft?: boolean;
    retired: boolean;
    hideRetired?: boolean;
    objectType?: number;
    originalFields?: GetSystemObjectDetailsResult;
    onRetiredUpdate?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    onRetireComplete?: () => void;
    onLicenseUpdate?: (event) => void;
    onPublishUpdate?: () => void;
    onLicenseChange?: () => void;
    path?: RepositoryPath[][] | null;
    updateData?: () => Promise<boolean>;
    idSystemObject: number;
    license?: number;
    licenseInheritance?: number | null;
    objectProperties?: ObjectPropertyResult[] | null;
}

function ObjectDetails(props: ObjectDetailsProps): React.ReactElement {
    const {
        unit,
        project,
        subject,
        item,
        asset,
        publishedState,
        publishedEnum,
        publishable,
        isDraft,
        retired,
        hideRetired,
        objectType,
        disabled,
        onRetireComplete,
        onLicenseUpdate,
        onPublishUpdate,
        idSystemObject,
        license,
        licenseInheritance,
        path,
        updateData,
        onLicenseChange
    } = props;
    const [licenseList, setLicenseList] = useState<License[]>([]);
    const [loading, setLoading] = useState(false);
    const [retireModalOpen, setRetireModalOpen] = useState(false);
    const retireChangedRef = useRef(false);
    const [unitList, setUnitList] = useState<Unit[]>([]);
    const getEntries = useLicenseStore(state => state.getEntries);
    const [ProjectDetails, updateDetailField] = useDetailTabStore(state => [state.ProjectDetails, state.updateDetailField]);
    const classes = useObjectDetailsStyles(props);
    const isProject = objectType === eSystemObjectType.eProject;

    useEffect(() => {
        const licenses = getEntries();
        if (licenses && licenses.length) {
            licenses.sort((a: License, b: License) => a.Name.localeCompare(b.Name));
        }
        setLicenseList(licenses);
    }, [getEntries]);

    useEffect(() => {
        if (!isProject) return;
        const fetchUnits = async () => {
            const { data } = await getUnitsList();
            if (data?.getUnitsFromNameSearch.Units && data?.getUnitsFromNameSearch.Units.length) {
                const fetched = data.getUnitsFromNameSearch.Units.slice();
                fetched.sort((a, b) => a.Name.localeCompare(b.Name));
                setUnitList(fetched);
            }
        };
        fetchUnits();
    }, [isProject]);

    let licenseSource: RepositoryPath | null = null;
    if (licenseInheritance && path) {
        for (const objectAncestorList of path) {
            for (const objectAncestor of objectAncestorList) {
                if (objectAncestor.idSystemObject === licenseInheritance) {
                    licenseSource = objectAncestor;
                    break;
                }
            }
            if (licenseSource)
                break;
        }
    }

    const onClearLicenseAssignment = async () => {
        setLoading(true);

        const { data } = await clearLicenseAssignment(idSystemObject);
        if (data?.clearLicenseAssignment?.success) {
            const message: string | null | undefined = data?.clearLicenseAssignment?.message;
            toast.success(`License assignment successfully cleared${message ? ': ' + message : ''}`);
            onLicenseChange?.();
        } else {
            toast.error(`License assignment failure: ${data?.clearLicenseAssignment?.message}`);
        }

        setLoading(false);
    };

    const onAssignInheritedLicense = async () => {
        setLoading(true);

        if (license) {
            const { data } = await assignLicense(idSystemObject, license);
            if (data?.assignLicense?.success) {
                const message: string | null | undefined = data?.assignLicense?.message;
                toast.success(`License assignment successfully assigned${message ? ': ' + message : ''}`);
                onLicenseChange?.();
            } else
                toast.error(`License assignment failure: ${data?.assignLicense?.message}`);
        }

        setLoading(false);
    };

    const onPublish = async () => { onPublishWorker(ePublishedState.ePublished, 'Publish as Public'); };
    const onAPIOnly = async () => { onPublishWorker(ePublishedState.eAPIOnly, 'Publish as Public (Unlisted)'); };
    const onUnpublish = async () => { onPublishWorker(ePublishedState.eNotPublished, 'Unpublish'); };
    const onInternal = async () => { onPublishWorker(ePublishedState.eInternal, 'Publish as Internal'); };
    const onSyncToEdan = async () => { onPublishWorker(ePublishedState.ePublished, 'Sync to Edan'); };

    const onPublishWorker = async (eState: number, action: string) => {
        setLoading(true);

        // if we're attempting to publish a subject, call the passed in update method first to persist metadata edits
        if (objectType === eSystemObjectType.eSubject && updateData !== undefined) {
            if (!await updateData()) {
                toast.error(`${action} failed while updating object`);
                setLoading(false);
                return;
            }
        }

        const { data } = await publish(idSystemObject, eState);
        if (data?.publish?.success) {
            toast.success(`${action} succeeded`);
            onPublishUpdate?.();
        } else
            toast.error(`${action} failed: ${data?.publish?.message}`);

        setLoading(false);
    };

    const onUnitChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        updateDetailField(eSystemObjectType.eProject, 'idUnit', event.target.value as number);
    };

    return (
        <Box display='flex' flex={3} flexDirection='column'>
            {isProject ? (
                <Detail
                    label='Unit'
                    valueComponent={
                        <Select
                            name='Unit'
                            className={classes.select}
                            style={{ width: '16rem' }}
                            disabled={disabled}
                            value={ProjectDetails?.idUnit ?? 0}
                            onChange={onUnitChange}
                        >
                            <MenuItem value={0}><em>None</em></MenuItem>
                            {unitList.map(u => (
                                <MenuItem key={u.idUnit} value={u.idUnit}>{u.Name}</MenuItem>
                            ))}
                        </Select>
                    }
                />
            ) : unit && (<Detail label='Unit' paths={unit} />)}
            {project && (<Detail label='Project' paths={project} />)}
            {subject && (<Detail label='Subject' paths={subject} />)}
            {item && (<Detail label='Media Group' paths={item} />)}
            {(asset && objectType !== eSystemObjectType.eAsset && <Detail idSystemObject={asset?.idSystemObject} label='Asset' value={asset?.name} />)}
            {(objectType === eSystemObjectType.eScene) && (
                <>
                    <Divider className={classes.sectionDivider} />
                    <Detail
                        label='Publish State'
                        valueComponent={
                            <Box display='flex' flexDirection='column' width='100%'>
                                <Box className={classes.inheritedLicense}>
                                    <Typography className={classes.value}>
                                        {publishedState}{isDraft ? ' (draft)' : ''}
                                    </Typography>
                                    &nbsp;<Tooltip arrow title={ <ToolTip text={scenePublishButtonNotes} />}><HelpOutline fontSize='small' style={{ alignSelf: 'center', cursor: 'pointer' }} /></Tooltip>
                                </Box>
                                <Box className={classes.buttonRow}>
                                    <LoadingButton onClick={onPublish} className={classes.loadingBtn} loading={loading} disabled={!publishable}>Public</LoadingButton>
                                    <LoadingButton onClick={onAPIOnly} className={classes.loadingBtn} loading={loading} disabled={!publishable}>Public (Unlisted)</LoadingButton>
                                    <LoadingButton onClick={onInternal} className={classes.loadingBtn} loading={loading} disabled={!publishable}>Internal</LoadingButton>
                                    {(isDraft || publishedEnum !== ePublishedState.eNotPublished) && (<LoadingButton onClick={onUnpublish} className={classes.loadingBtn} loading={loading}>Unpublish</LoadingButton>)}
                                </Box>
                            </Box>
                        }
                    />
                </>
            )}
            {(objectType === eSystemObjectType.eSubject) && (
                <Detail
                    label='Edan Sync State'
                    valueComponent={
                        <Box className={classes.inheritedLicense}>
                            <Typography className={classes.value}>{publishedState}</Typography>
                            &nbsp;<LoadingButton onClick={onSyncToEdan} className={classes.loadingBtn} loading={loading} disabled={!publishable}>Sync to Edan</LoadingButton>
                        </Box>
                    }
                />
            )}
            {(objectType === eSystemObjectType.eScene) && <Divider className={classes.sectionDivider} />}
            {licenseSource ? (
                <Detail
                    label='License'
                    valueComponent={
                        <Box display='flex' flexDirection='column' width='100%'>
                            <Box className={classes.inheritedLicense}>
                                <Box fontStyle='italic'>
                                    <Typography className={classes.value}>{licenseList.find(lic => lic.idLicense === license)?.Name}</Typography>
                                </Box>
                                <Typography className={classes.value}>{' inherited from '}</Typography>
                                <NewTabLink className={classes.link} to={`/repository/details/${licenseSource.idSystemObject}`}>
                                    <Typography>{`${getTermForSystemObjectType(licenseSource.objectType)} ${licenseSource.name}`}</Typography>
                                </NewTabLink>
                                &nbsp;<Tooltip arrow title={ <ToolTip text={licenseNotes} />}><HelpOutline fontSize='small' style={{ alignSelf: 'center', cursor: 'pointer' }} /></Tooltip>
                            </Box>
                            <Box className={classes.buttonRow}>
                                <LoadingButton onClick={onAssignInheritedLicense} className={classes.loadingBtn} loading={loading}>
                                    Assign License
                                </LoadingButton>
                            </Box>
                        </Box>
                    }
                />
            ) : (
                <Detail
                    label='License'
                    valueComponent={
                        <Box display='flex' flexDirection='column' width='100%'>
                            <Box className={classes.assignedLicense}>
                                <Select name='License' className={classes.select}  style={{ width: '16rem' }} onChange={onLicenseUpdate} value={license}>
                                    <MenuItem value={0}>None</MenuItem>
                                    {licenseList.map(license => (
                                        <MenuItem value={license.idLicense} key={license.idLicense}>
                                            {license.Name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                &nbsp;<Tooltip arrow title={ <ToolTip text={licenseNotes} />}><HelpOutline fontSize='small' style={{ alignSelf: 'center', cursor: 'pointer' }} /></Tooltip>
                            </Box>
                            <Box className={classes.buttonRow}>
                                <LoadingButton onClick={onClearLicenseAssignment} loading={loading} className={classes.loadingBtn}>
                                    Clear Assignment
                                </LoadingButton>
                            </Box>
                        </Box>
                    }
                />
            )}
            {!hideRetired && (
                <>
                    <Divider className={classes.sectionDivider} />
                    <Detail
                        label='Retired'
                        valueComponent={
                            <Box className={classes.buttonRow}>
                                <Typography className={classes.value}>{retired ? 'Yes' : 'No'}</Typography>
                                <Button
                                    size='small'
                                    variant='contained'
                                    color='primary'
                                    style={{ color: '#fff' }}
                                    disabled={disabled}
                                    onClick={() => setRetireModalOpen(true)}
                                >
                                    {retired ? 'Reinstate' : 'Retire'}
                                </Button>
                            </Box>
                        }
                    />
                    <Divider className={classes.sectionDivider} />
                    <RetireActionModal
                        open={retireModalOpen}
                        idSystemObject={idSystemObject}
                        retire={!retired}
                        onComplete={() => { retireChangedRef.current = true; }}
                        onClose={() => {
                            setRetireModalOpen(false);
                            if (retireChangedRef.current) {
                                retireChangedRef.current = false;
                                onRetireComplete?.();
                            }
                        }}
                    />
                </>
            )}
        </Box>
    );
}

interface DetailProps {
    idSystemObject?: number;
    label: string;
    value?: string;
    valueComponent?: React.ReactNode;
    clickable?: boolean;
    name?: string;
    paths?: RepositoryPath[]
}

function Detail(props: DetailProps): React.ReactElement {
    const { idSystemObject, label, value, valueComponent, clickable = true, name, paths } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = null;
    if (value) {
        content = <Typography className={classes.value}>{value || '-'}</Typography>;
        if (clickable && idSystemObject)
            content = <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>{content}</NewTabLink>;
    } else if (paths) {
        content = <Box display='flex' flexDirection='column' alignItems='flex-start' style={{ width: '100%' }}>
            {paths.map((path, index) => {
                const ciInnner: React.ReactNode = <Typography className={classes.value}>{path.name || '-'}</Typography>;
                return (clickable && path.idSystemObject)
                    ? <NewTabLink to={getDetailsUrlForObject(path.idSystemObject)} key={index}>{ciInnner}</NewTabLink>
                    : <span key={index}>{ciInnner}</span>;
            })}
        </Box>;
    }

    return (
        <Box className={classes.detail}>
            <Box display='flex' flex={1.5}>
                <Typography className={classes.label}>{label}</Typography>
            </Box>
            <Box display='flex' flex={3.5}>
                <label htmlFor={name} style={{ display: 'none' }}>{name}</label>
                {valueComponent || content}
            </Box>
        </Box>
    );
}

export default ObjectDetails;

const scenePublishButtonNotes =
`Public: transmits the scene package to EDAN and marks the EDAN record as searchable on 3d.si.edu. Scene downloads are sent if the license allows.
.
Public (Unlisted): transmits the scene package to EDAN, but the record is not searchable; it is accessible only via direct URL. Downloads are sent if the license allows.
.
Internal: transmits the scene package to EDAN, but access is restricted to users behind the Smithsonian firewall.
.
Unpublish: marks the EDAN package as inactive and not searchable.`;

export const scenePublishRequirementsNotes =
`In order to publish a scene to EDAN, the following criteria must be met:
-The scene must have thumbnails.
-The scene must be Posed and QC'd (and marked as such on the Details tab).
-The scene must be Approved for Publication (and marked as such on the Details tab).
-The license controlling the scene must allow for publishing (i.e. not "None" and not "Restricted").
Changes made to scenes are only published to EDAN when the user clicks "Publish", "API Only", "Internal", or "Unpublish". Users must explicitly publish these changes to EDAN.`;

const licenseNotes =
'The license assigned to this object. It controls whether the scene can be published to EDAN and whether downloads are made available. Licenses can be inherited from an ancestor (Unit, Project, Subject, or Media Group) or assigned directly to this object.';