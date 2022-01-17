/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

import { Box, FormControl, FormHelperText, Button, InputLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { DebounceInput } from 'react-debounce-input';
import { GetLicenseDocument } from '../../../../types/graphql';
import { apolloClient } from '../../../../graphql/index';
import { createLicense, updateLicense } from '../../hooks/useAdminview';
import { toTitleCase } from '../../../../constants/helperfunctions';
import * as yup from 'yup';
import { useLicenseStore } from '../../../../store';
import { Helmet } from 'react-helmet';
import clsx from 'clsx';

const useStyles = makeStyles(({ breakpoints, typography }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 60px)',
        width: '1200px',
        overflowY: 'scroll',
        marginLeft: '1%',
        marginTop: '1%',
        [breakpoints.down('lg')]: {
            maxHeight: 'calc(100vh - 120px)',
            padding: 10
        }
    },
    formContainer: {
        width: '700px',
        maxHeight: '90%',
        borderRadius: 10,
        padding: '10px 20px',
        background: '#687DDB1A 0% 0% no-repeat padding-box;',
        border: '1px solid #B7D2E5CC',
        boxShadow: '0 0 0 15px #75B3DF',
        marginTop: '2%',
        marginLeft: '1%'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '30% 70%',
        gridGap: '10px',
        alignItems: 'center',
        minHeight: '5%',
        paddingTop: '10px',
        paddingBottom: '10px',
        '&:not(:last-child)': {
            borderBottom: '1px solid #D8E5EE'
        }
    },
    formRowLabel: {
        gridColumnStart: '1',
        fontSize: '0.875rem',
        color: 'auto'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px',
        border: '1px solid rgb(118,118,118)',
        width: '55%',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: 'inherit',
        height: '30px'
    },
    descriptionInput: {
        width: '80%',
        minHeight: '100px'
    },
    btn: {
        backgroundColor: '#3854d0',
        color: 'white',
        width: '90px',
        height: '30px',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    ButtonGroup: {
        marginTop: '30px',
        '& Button': {
            marginRight: '30px'
        }
    }
}));

function LicenseForm(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const parameters: { idLicense: string } = useParams();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [restrictLevel, setRestrictLevel] = useState('');
    const [validName, setValidName] = useState<boolean | null>(null);
    const [updateLicenseEntries, getEntries] = useLicenseStore(state => [state.updateLicenseEntries, state.getEntries]);

    const singularSystemObjectType = 'license';
    const { idLicense } = parameters;

    const create: boolean = idLicense === 'create';

    const schema = yup.object().shape({
        name: yup.string().min(1)
    });

    useEffect(() => {
        const fetchLicenseQuery = async () => {
            if (create) return;

            const { data } = await apolloClient.query({
                query: GetLicenseDocument,
                variables: {
                    input: {
                        idLicense: Number(idLicense)
                    }
                }
            });

            setName(data.getLicense.License.Name);
            setDescription(data.getLicense.License.Description);
            setRestrictLevel(data.getLicense.License.RestrictLevel);
        };

        fetchLicenseQuery();
    }, [idLicense, create]);

    const onNameUpdate = ({ target }) => {
        setName(target.value);
    };

    const onDescriptionUpdate = ({ target }) => {
        setDescription(target.value);
    };

    const onRestrictLevelUpdate = ({ target }) => {
        setRestrictLevel(target.value);
    };

    const validateFields = async (): Promise<boolean | void> => {
        try {
            const isValidName = await schema.isValid({ name });

            const licenseList = getEntries();
            let isUniqueName = true;
            licenseList.forEach(license => {
                if (license.idLicense !== Number(idLicense)) {
                    if (license.Name === name) {
                        isUniqueName = false;
                    }
                }
            });
            setValidName(isValidName && isUniqueName);
            if (!isValidName) {
                toast.warn('Creation Failed: Name Cannot Be Empty');
            }
            if (!isUniqueName) {
                toast.warn('Creation Failed: License Name Must Be Unique');
            }
            return isValidName && isUniqueName;
        } catch (error) {
            const message: string = (error instanceof Error) ? error.message : 'Validation Failure';
            toast.warn(message);
        }
    };

    const onUpdateLicense = async () => {
        const validUpdate = await validateFields();
        if (!validUpdate) return;

        try {
            const { data } = await updateLicense(Number(idLicense), name, description, Number(restrictLevel));
            await updateLicenseEntries();

            if (data) {
                toast.success('License updated successfully');
                history.push('/admin/licenses');
            } else {
                throw new Error('Update request returned success: false');
            }
        } catch (error) {
            toast.error(`Failed to update license: error ${error}`);
        }
    };

    const onCreateLicense = async (): Promise<void> => {
        const validUpdate = await validateFields();
        if (!validUpdate) {
            toast.warn('Creation Failed. Please double-check your form inputs');
            return;
        }

        try {
            const { data } = await createLicense(name, description, Number(restrictLevel));
            await updateLicenseEntries();

            if (data?.createLicense) {
                toast.success('License created successfully');
                history.push('/admin/licenses');
            } else {
                throw new Error('Create request returned success: false');
            }
        } catch (error) {
            toast.error(`Failed to create license: error ${error}`);
        }
    };

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Create License</title>
            </Helmet>
            <Box display='flex' flexDirection='column' className={classes.formContainer}>
                <Box className={classes.formRow}>
                    <InputLabel className={classes.formRowLabel} htmlFor='licenseNameInput'>{toTitleCase(singularSystemObjectType)} Name</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='licenseNameInput'
                            className={classes.formField}
                            value={name}
                            onChange={onNameUpdate}
                        />
                        {validName === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required or already in system</FormHelperText>}
                    </FormControl>
                </Box>
                <Box className={classes.formRow}>
                    <InputLabel className={classes.formRowLabel} htmlFor='licenseRestrictionLevelInput'>Restriction Level</InputLabel>
                    <DebounceInput
                        element='input'
                        className={classes.formField}
                        id='licenseRestrictionLevelInput'
                        value={restrictLevel || ''}
                        onChange={onRestrictLevelUpdate}
                    />
                </Box>
                <Box className={classes.formRow}>
                    <InputLabel className={classes.formRowLabel} htmlFor='licenseTextarea'>Description</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='licenseTextarea'
                            element='textarea'
                            value={description || ''}
                            className={clsx(classes.descriptionInput, classes.formField)}
                            name='description'
                            onChange={onDescriptionUpdate}
                            debounceTimeout={400}
                        />
                    </FormControl>
                </Box>
            </Box>
            <Box className={classes.ButtonGroup}>
                {create ? (
                    <Button className={classes.btn} onClick={onCreateLicense} disableElevation>
                        Create
                    </Button>
                ) : (
                    <Button className={classes.btn} onClick={onUpdateLicense} disableElevation>
                        Update
                    </Button>
                )}
                <Button variant='contained' className={classes.btn} onClick={() => history.push('/admin/licenses')}>
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}

export default LicenseForm;
