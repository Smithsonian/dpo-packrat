/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

/**
This component is responsible for creating new SystemObjects and will handle the appropriate SystemObject type. Currently handles:
    Units
    Projects
 */

import { Box, Typography, FormControl, TextField, FormHelperText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { Fragment, useState } from 'react';
import { useParams } from 'react-router';
import { DebounceInput } from 'react-debounce-input';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LoadingButton } from '../../../components';
import { CreateUnitDocument, CreateProjectDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { toTitleCase } from '../../../constants/helperfunctions';
import * as yup from 'yup';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
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
    updateButton: {
        height: 35,
        width: 100,
        marginTop: 30,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
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
    }
}));

type ParamsProperties = {
    systemObjectType: string;
};

function AddSystemObjectForm(): React.ReactElement {
    const classes = useStyles();
    const params: ParamsProperties = useParams();
    const history = useHistory();
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [ARKPrefix, setARKPrefix] = useState('');
    const [description, setDescription] = useState('');
    const [systemObjectType] = useState(params.systemObjectType);
    const [validName, setValidName] = useState<boolean | null>(null);
    const [validAbbreviation, setValidAbbreviation] = useState<boolean | null>(null);

    const singularSystemObjectType = systemObjectType.slice(0, systemObjectType.length - 1);

    // schema for validating the appropriate form fields
    const schema = yup.object().shape({
        name: yup.string().min(1),
        abbreviation: yup.string().min(1)
    });

    const onNameUpdate = ({ target }) => {
        setName(target.value);
    };

    const onAbbreviationUpdate = ({ target }) => {
        setAbbreviation(target.value);
    };

    const onARKPrefixUpdate = ({ target }) => {
        setARKPrefix(target.value);
    };

    const onDescriptionUpdate = ({ target }) => {
        setDescription(target.value);
    };

    // Handles validation for the different system object types
    const validateFields = async (): Promise<boolean | void> => {
        switch (systemObjectType) {
            case 'units':
                try {
                    const isValidName = await schema.isValid({ name });
                    setValidName(isValidName);
                    const isValidAbbreviation = await schema.isValid({ abbreviation });
                    setValidAbbreviation(isValidAbbreviation);
                    if (!isValidName || !isValidAbbreviation) {
                        toast.warn('Creation Failed: Please Address The Errors Above');
                    }
                    return isValidName && isValidAbbreviation;
                } catch (error) {
                    toast.warn(error);
                } finally {
                    setIsUpdatingData(false);
                }
                break;
            case 'projects':
                try {
                    const isValidName = await schema.isValid({ name });
                    setValidName(isValidName);
                    if (!isValidName) {
                        toast.warn('Creation Failed: Please Address The Errors Above');
                    }
                    return isValidName;
                } catch (error) {
                    toast.warn(error);
                } finally {
                    setIsUpdatingData(false);
                }
                break;
        }
    };

    const createUnit = async (): Promise<void> => {
        const confirmed: boolean = global.confirm('Are you sure you want to create this entry?');
        if (!confirmed) return;

        setIsUpdatingData(true);
        const validUpdate = await validateFields();
        if (!validUpdate) return;

        let newUnitSystemObjectId;
        try {
            const { data } = await apolloClient.mutate({
                mutation: CreateUnitDocument,
                variables: {
                    input: {
                        Name: name,
                        Abbreviation: abbreviation,
                        ARKPrefix
                    }
                }
            });
            if (data?.createUnit) {
                toast.success('Object created successfully');
                newUnitSystemObjectId = data?.createUnit?.Unit?.SystemObject?.idSystemObject;
            } else {
                throw new Error('Create request returned success: false');
            }
        } catch (error) {
            toast.error('Failed to create object');
        } finally {
            setIsUpdatingData(false);
            if (newUnitSystemObjectId) {
                history.push(`/repository/details/${newUnitSystemObjectId}`);
            } else {
                toast.error('Unable to retrieve new System Object Id');
            }
        }
    };

    const createProject = async (): Promise<void> => {
        const confirmed: boolean = global.confirm('Are you sure you want to create this entry?');
        if (!confirmed) return;
        setIsUpdatingData(true);

        const validUpdate = await validateFields();
        if (!validUpdate) return;

        let newUnitSystemObjectId;
        try {
            const { data } = await apolloClient.mutate({
                mutation: CreateProjectDocument,
                variables: {
                    input: {
                        Name: name,
                        Description: description
                    }
                }
            });
            if (data?.createProject) {
                toast.success('Project created successfully');
                newUnitSystemObjectId = data?.createProject?.Project?.SystemObject?.idSystemObject;
            } else {
                throw new Error('Create request returned success: false');
            }
        } catch (error) {
            toast.error('Failed to create project');
        } finally {
            setIsUpdatingData(false);
            if (newUnitSystemObjectId) {
                history.push(`/repository/details/${newUnitSystemObjectId}`);
            } else {
                toast.error('Unable to retrieve new System Object Id');
            }
        }
    };

    // Handles the logic for the viewable inputs on the form
    let formFields;
    let createButtonBehavior;
    switch (systemObjectType) {
        case 'units':
            formFields = (
                <Fragment>
                    <Box className={classes.formRow}>
                        <Typography className={classes.formRowLabel}>Abbreviation</Typography>
                        <FormControl variant='outlined'>
                            {validAbbreviation !== false ? (
                                <TextField
                                    className={classes.formField}
                                    style={{ width: '270px' }}
                                    variant='outlined'
                                    size='small'
                                    value={abbreviation}
                                    onChange={onAbbreviationUpdate}
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
                                        value={abbreviation}
                                        onChange={onAbbreviationUpdate}
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                    />
                                    <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>
                                </React.Fragment>
                            )}
                        </FormControl>
                    </Box>
                    <Box className={classes.formRow}>
                        <Typography className={classes.formRowLabel}>ARKPrefix</Typography>
                        <FormControl variant='outlined'>
                            <TextField
                                className={classes.formField}
                                style={{ width: '270px' }}
                                variant='outlined'
                                size='small'
                                value={ARKPrefix}
                                onChange={onARKPrefixUpdate}
                                InputLabelProps={{
                                    shrink: true
                                }}
                            />
                        </FormControl>
                    </Box>
                </Fragment>
            );
            createButtonBehavior = createUnit;
            break;
        case 'projects':
            formFields = (
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
            );
            createButtonBehavior = createProject;
            break;
    }

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
                                <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>
                            </React.Fragment>
                        )}
                    </FormControl>
                </Box>
                {formFields}
            </Box>
            <LoadingButton className={classes.updateButton} onClick={createButtonBehavior} disableElevation loading={isUpdatingData}>
                Create
            </LoadingButton>
        </Box>
    );
}

export default AddSystemObjectForm;
