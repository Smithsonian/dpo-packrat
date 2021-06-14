/**
 * Object Details
 *
 * This component renders object details for the Repository Details UI.
 */
import { Box, Checkbox, Typography, Select, MenuItem, Button } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { NewTabLink } from '../../../../components';
import { GetSystemObjectDetailsResult, RepositoryPath } from '../../../../types/graphql';
import { getDetailsUrlForObject, getUpdatedCheckboxProps, isFieldUpdated } from '../../../../utils/repository';
import { withDefaultValueBoolean } from '../../../../utils/shared';
import { getLicenseList } from '../../hooks/useDetailsView';
import { License } from '../../../../types/graphql';

const useStyles = makeStyles(({ palette, typography }) => ({
    detail: {
        display: 'flex',
        minHeight: 20,
        width: '100%',
        marginBottom: 8
    },
    label: {
        fontWeight: typography.fontWeightMedium
    },
    value: {
        color: ({ clickable = true }: DetailProps) => (clickable ? palette.primary.main : palette.primary.dark),
        textDecoration: ({ clickable = true, value }: DetailProps) => (clickable && value ? 'underline' : undefined)
    },
    btn: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
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
    retired: boolean;
    hideRetired?: boolean;
    originalFields?: GetSystemObjectDetailsResult;
    onRetiredUpdate?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    licenseAssignment?: RepositoryPath | null;
}

function ObjectDetails(props: ObjectDetailsProps): React.ReactElement {
    const { unit, project, subject, item, publishedState, retired, hideRetired, disabled, originalFields, onRetiredUpdate /*, licenseAssignment */ } = props;
    const [licenseList, setLicenseList] = useState<License[]>([]);
    const isRetiredUpdated: boolean = isFieldUpdated({ retired }, originalFields, 'retired');

    useEffect(() => {
        const fetchInitialLicenseList = async () => {
            const { data } = await getLicenseList();
            const fetchedLicenses = [...data?.getLicenseList?.Licenses];
            if (fetchedLicenses && fetchedLicenses.length) {
                fetchedLicenses.sort((a, b) => a.Name.toLowerCase() - b.Name.toLowerCase());
            }
            setLicenseList(fetchedLicenses);
        };

        fetchInitialLicenseList();
    }, []);

    /*
        TODO
        Create a proper state to hold the license
        Create a function to handle Select's onChange
        Complete clearAssignment function
        Get the correct data shape to pass into select
        Write the component to include hyperlink to appropriate license object
        Figure out which kinds of system object have licenses
        Figure out how to inherit license from parent
    */

    const clearLicenseAssignment = () => {
        // TODO
    };

    const assignInheritedLicense = () => {
        // TODO
    };

    return (
        <Box display='flex' flex={2} flexDirection='column'>
            <Detail idSystemObject={unit?.idSystemObject} label='Unit' value={unit?.name} />
            <Detail idSystemObject={project?.idSystemObject} label='Project' value={project?.name} />
            <Detail idSystemObject={subject?.idSystemObject} label='Subject' value={subject?.name} />
            <Detail idSystemObject={item?.idSystemObject} label='Item' value={item?.name} />
            <Detail label='Publication Status' value={publishedState} clickable={false} />
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
            {licenseList.length ? (
                <Detail
                    label='License'
                    valueComponent={
                        <React.Fragment>
                            <Select onChange={() => {}} value={licenseList[0].idLicense}>
                                {licenseList.map(license => (
                                    <MenuItem value={license.idLicense} key={license.idLicense}>
                                        {license.Name}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Button
                                onClick={clearLicenseAssignment}
                                style={{ backgroundColor: '#687DDB', color: 'white', width: 'fit-content', height: '30px', marginLeft: '10px' }}
                            >
                                Clear Assignment
                            </Button>
                        </React.Fragment>
                    }
                />
            ) : (
                <Detail
                    label='License'
                    valueComponent={
                        <React.Fragment>
                            <Button
                                onClick={assignInheritedLicense}
                                style={{ backgroundColor: '#687DDB', color: 'white', width: 'fit-content', height: '30px', marginLeft: '10px' }}
                            >
                                Assign License
                            </Button>
                        </React.Fragment>
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
            <Box display='flex' flex={2}>
                <Typography className={classes.label}>{label}</Typography>
            </Box>
            <Box display='flex' flex={3}>
                {valueComponent || content}
            </Box>
        </Box>
    );
}

export default ObjectDetails;
