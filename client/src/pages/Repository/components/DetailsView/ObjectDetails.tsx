/* eslint-disable react/jsx-max-props-per-line */
/**
 * Object Details
 *
 * This component renders object details for the Repository Details UI.
 */
import { Box, Checkbox, Typography, Select, MenuItem } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { NewTabLink } from '../../../../components';
import { GetSystemObjectDetailsResult, RepositoryPath, License } from '../../../../types/graphql';
import { getDetailsUrlForObject, getUpdatedCheckboxProps, isFieldUpdated } from '../../../../utils/repository';
import { withDefaultValueBoolean } from '../../../../utils/shared';
import { useLicenseStore } from '../../../../store';
import { clearLicenseAssignment, assignLicense, publish } from '../../hooks/useDetailsView';
import { getTermForSystemObjectType } from '../../../../utils/repository';
import { LoadingButton } from '../../../../components';
import { toast } from 'react-toastify';
import { ePublishedState } from '../../../../types/server';

const useStyles = makeStyles(({ palette, typography }) => ({
    detail: {
        display: 'flex',
        minHeight: 20,
        width: '100%',
        marginBottom: 8
    },
    label: {
        fontWeight: typography.fontWeightMedium,
        alignSelf: 'center'
    },
    value: {
        color: ({ clickable = true }: DetailProps) => (clickable ? palette.primary.main : palette.primary.dark),
        textDecoration: ({ clickable = true, value }: DetailProps) => (clickable && value ? 'underline' : undefined)
    }
}));

const useObjectDetailsStyles = makeStyles(({ breakpoints, palette }) => ({
    loadingBtn: {
        height: 35,
        width: 'fit-content',
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        }
    },
    select: {
        fontSize: '0.875rem',
        color: 'rgb(44, 64, 90)',
        marginRight: '5px'
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
    link: {
        display: 'flex',
        color: 'rgb(0, 121, 196)',
        marginRight: '5px',
        textDecoration: 'underline'
    }
}));

const CheckboxNoPadding = withStyles({
    root: {
        border: '0px',
        padding: '0px'
    }
})(Checkbox);

interface ObjectDetailsProps {
    unit?: RepositoryPath | null;
    project?: RepositoryPath | null;
    subject?: RepositoryPath | null;
    item?: RepositoryPath | null;
    disabled: boolean;
    publishedState: string;
    publishedEnum: number;
    publishable: boolean;
    retired: boolean;
    hideRetired?: boolean;
    hidePublishState?: boolean;
    originalFields?: GetSystemObjectDetailsResult;
    onRetiredUpdate?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    onLicenseUpdate?: (event) => void;
    path?: RepositoryPath[][] | null;
    idSystemObject: number;
    license?: number;
    licenseInheritance?: number | null;
}

function ObjectDetails(props: ObjectDetailsProps): React.ReactElement {
    const {
        unit,
        project,
        subject,
        item,
        publishedState,
        publishedEnum,
        publishable,
        retired,
        hideRetired,
        hidePublishState,
        disabled,
        originalFields,
        onRetiredUpdate,
        onLicenseUpdate,
        idSystemObject,
        license,
        licenseInheritance,
        path
    } = props;
    const [licenseList, setLicenseList] = useState<License[]>([]);
    const [loading, setLoading] = useState(false);
    const isRetiredUpdated: boolean = isFieldUpdated({ retired }, originalFields, 'retired');
    const getEntries = useLicenseStore(state => state.getEntries);
    const classes = useObjectDetailsStyles(props);

    useEffect(() => {
        const licenses = getEntries();
        if (licenses && licenses.length) {
            licenses.sort((a: License, b: License) => a.Name.localeCompare(b.Name));
        }
        setLicenseList(licenses);
    }, [getEntries]);

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
            toast.success('License assignment successfully cleared');
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
                toast.success('License assignment successfully cleared');
            } else {
                toast.error(`License assignment failure: ${data?.assignLicense?.message}`);
            }
        }

        setLoading(false);
    };

    const onPublish = async () => { onPublishWorker(ePublishedState.ePublished, 'Publish'); };
    const onAPIOnly = async () => { onPublishWorker(ePublishedState.eAPIOnly, 'Publish for API Only'); };
    const onUnpublish = async () => { onPublishWorker(ePublishedState.eNotPublished, 'Unpublish'); };

    const onPublishWorker = async (eState: number, action: string) => {
        setLoading(true);

        const { data } = await publish(idSystemObject, eState);
        if (data?.publish?.success)
            toast.success(`${action} succeeded`);
        else
            toast.error(`${action} failed: ${data?.publish?.message}`);

        setLoading(false);
    };

    return (
        <Box display='flex' flex={2} flexDirection='column'>
            <Detail idSystemObject={unit?.idSystemObject} label='Unit' value={unit?.name} />
            <Detail idSystemObject={project?.idSystemObject} label='Project' value={project?.name} />
            <Detail idSystemObject={subject?.idSystemObject} label='Subject' value={subject?.name} />
            <Detail idSystemObject={item?.idSystemObject} label='Item' value={item?.name} />
            {!hidePublishState && (
                <Detail
                    label='Publish State'
                    valueComponent={
                        <Box className={classes.inheritedLicense}>
                            <Typography>{publishedState}</Typography>
                            &nbsp;<LoadingButton onClick={onPublish} className={classes.loadingBtn} loading={loading} disabled={!publishable}>Publish</LoadingButton>
                            &nbsp;<LoadingButton onClick={onAPIOnly} className={classes.loadingBtn} loading={loading} disabled={!publishable}>API Only</LoadingButton>
                            &nbsp;{(publishedEnum !== ePublishedState.eNotPublished) && (<LoadingButton onClick={onUnpublish} className={classes.loadingBtn} loading={loading}>Unpublish</LoadingButton>)}
                        </Box>
                    }
                />
            )}
            {!hideRetired && (
                <Detail
                    label='Retired'
                    valueComponent={
                        <CheckboxNoPadding
                            name='retired'
                            disabled={disabled}
                            checked={withDefaultValueBoolean(retired, false)}
                            onChange={onRetiredUpdate}
                            {...getUpdatedCheckboxProps(isRetiredUpdated)}
                        />
                    }
                />
            )}
            {licenseSource ? (
                <Detail
                    label='License'
                    valueComponent={
                        <Box className={classes.inheritedLicense}>
                            <Box fontStyle='italic'>
                                <Typography>{licenseList.find(lic => lic.idLicense === license)?.Name}</Typography>
                            </Box>
                            <Typography>{' inherited from '}</Typography>
                            <NewTabLink className={classes.link} to={`/repository/details/${licenseSource.idSystemObject}`} target='_blank'>
                                <Typography>{`${getTermForSystemObjectType(licenseSource.objectType)} ${licenseSource.name}`}</Typography>
                            </NewTabLink>
                            <LoadingButton onClick={onAssignInheritedLicense} className={classes.loadingBtn} loading={loading}>
                                Assign License
                            </LoadingButton>
                        </Box>
                    }
                />
            ) : (
                <Detail
                    label='License'
                    valueComponent={
                        <Box className={classes.assignedLicense}>
                            <Select name='License' className={classes.select} onChange={onLicenseUpdate} value={license}>
                                <MenuItem value={0}>None</MenuItem>
                                {licenseList.map(license => (
                                    <MenuItem value={license.idLicense} key={license.idLicense}>
                                        {license.Name}
                                    </MenuItem>
                                ))}
                            </Select>
                            <LoadingButton onClick={onClearLicenseAssignment} loading={loading} className={classes.loadingBtn}>
                                Clear Assignment
                            </LoadingButton>
                        </Box>
                    }
                />
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
}

function Detail(props: DetailProps): React.ReactElement {
    const { idSystemObject, label, value, valueComponent, clickable = true } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = <Typography className={classes.value}>{value || '-'}</Typography>;

    if (clickable && idSystemObject) {
        content = <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>{content}</NewTabLink>;
    }

    return (
        <Box className={classes.detail}>
            <Box display='flex' flex={1.5}>
                <Typography className={classes.label}>{label}</Typography>
            </Box>
            <Box display='flex' flex={3.5}>
                {valueComponent || content}
            </Box>
        </Box>
    );
}

export default ObjectDetails;
