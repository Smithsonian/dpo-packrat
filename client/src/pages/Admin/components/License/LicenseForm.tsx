/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

import { Box, Typography, FormControl, TextField, FormHelperText, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState, useEffect } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { DebounceInput } from 'react-debounce-input';
import { CreateLicenseDocument, UpdateLicenseDocument, GetLicenseListDocument, GetLicenseDocument } from '../../../../types/graphql';
import { apolloClient } from '../../../../graphql/index';
import { toTitleCase } from '../../../../constants/helperfunctions';
import * as yup from 'yup';

const useStyles = makeStyles(({ breakpoints }) => ({
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
        gridColumnStart: '1'
    },
    formRowInput: {
        gridColumnStart: '2'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px'
    },
    descriptionInput: {
        backgroundColor: 'white',
        borderRadius: '4px',
        width: '80%',
        minHeight: '100px'
    },
    btn: {
        backgroundColor: '#687DDB',
        color: 'white',
        width: '90px',
        height: '30px'
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

            const { data } = await apolloClient.query({
                query: GetLicenseListDocument,
                variables: {
                    input: {
                        search: ''
                    }
                }
            });
            const licenseList = data?.getLicenseList?.Licenses;
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
            toast.warn(error);
        }
    };

    const updateLicense = async () => {
        const validUpdate = await validateFields();
        if (!validUpdate) return;

        try {
            const { data } = await apolloClient.mutate({
                mutation: UpdateLicenseDocument,
                variables: {
                    input: {
                        idLicense: Number(idLicense),
                        Name: name,
                        Description: description,
                        RestrictLevel: Number(restrictLevel)
                    }
                },
                refetchQueries: [{ query: GetLicenseListDocument, variables: { input: { search: '' } } }],
                awaitRefetchQueries: true
            });
            if (data) {
                toast.success('License updated successfully');
            } else {
                throw new Error('Update request returned success: false');
            }
        } catch (error) {
            toast.error(`Failed to update license: error ${error}`);
        } finally {
            history.push('/admin/licenses');
        }
    };

    const createLicense = async (): Promise<void> => {
        const validUpdate = await validateFields();
        if (!validUpdate) {
            toast.warn('Creation Failed. Please double-check your form inputs');
            return;
        }

        try {
            const { data } = await apolloClient.mutate({
                mutation: CreateLicenseDocument,
                variables: {
                    input: {
                        Name: name,
                        Description: description,
                        RestrictLevel: restrictLevel,
                    }
                },
                refetchQueries: [{ query: GetLicenseListDocument, variables: { input: { search: '' } } }],
                awaitRefetchQueries: true
            });
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
            <Box display='flex' flexDirection='column' className={classes.formContainer}>
                <Box className={classes.formRow}>
                    <Typography className={classes.formRowLabel}>{toTitleCase(singularSystemObjectType)} Name</Typography>
                    <FormControl variant='outlined'>
                        {validName !== false ? (
                            <TextField
                                className={classes.formField}
                                style={{ width: '270px' }}
                                variant='outlined'
                                size='small'
                                value={name}
                                onChange={onNameUpdate}
                                InputLabelProps={{
                                    shrink: true
                                }}
                            />
                        ) : (
                            <React.Fragment>
                                <TextField
                                    error
                                    className={classes.formField}
                                    style={{ width: '270px' }}
                                    variant='outlined'
                                    size='small'
                                    value={name}
                                    onChange={onNameUpdate}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                />
                                <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required or already in system</FormHelperText>
                            </React.Fragment>
                        )}
                    </FormControl>
                </Box>
                <Box className={classes.formRow}>
                    <Typography className={classes.formRowLabel}>Restriction Level</Typography>
                    <TextField
                        className={classes.formField}
                        style={{ width: '270px' }}
                        variant='outlined'
                        size='small'
                        value={restrictLevel || ''}
                        onChange={onRestrictLevelUpdate}
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Box>
                <Box className={classes.formRow}>
                    <Typography className={classes.formRowLabel}>Description</Typography>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            element='textarea'
                            value={description || ''}
                            className={classes.descriptionInput}
                            name='description'
                            onChange={onDescriptionUpdate}
                            debounceTimeout={400}
                        />
                    </FormControl>
                </Box>
            </Box>
            <Box className={classes.ButtonGroup}>
                {create ? (
                    <Button className={classes.btn} onClick={createLicense} disableElevation>
                        Create
                    </Button>
                ) : (
                    <Button className={classes.btn} onClick={updateLicense} disableElevation>
                        Update
                    </Button>
                )}
                <Link to='/admin/licenses' style={{ textDecoration: 'none' }}>
                    <Button variant='contained' className={classes.btn}>
                        Cancel
                    </Button>
                </Link>
            </Box>
        </Box>
    );
}

export default LicenseForm;
