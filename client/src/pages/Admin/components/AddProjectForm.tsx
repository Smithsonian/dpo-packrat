/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

import { Box, InputLabel, FormControl, FormHelperText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LoadingButton } from '../../../components';
import { DebounceInput } from 'react-debounce-input';
import { CreateProjectDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { toTitleCase } from '../../../constants/helperfunctions';
import * as yup from 'yup';
import { Helmet } from 'react-helmet';
import clsx from 'clsx';

const useStyles = makeStyles(({ palette, breakpoints, typography }) => ({
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
        gridColumnStart: '1',
        fontSize: '0.875rem',
        color: 'inherit'
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
        backgroundColor: 'white',
        borderRadius: '4px',
        width: '80%',
        minHeight: '100px'
    }
}));

function AddProjectForm(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // these are the states referenced when rendering error inputs after failed validation
    const [validName, setValidName] = useState<boolean | null>(null);

    const singularSystemObjectType = 'project';

    // schema for validating the appropriate form fields
    const schema = yup.object().shape({
        name: yup.string().min(1)
    });

    const onNameUpdate = ({ target }) => {
        setName(target.value);
    };

    const onDescriptionUpdate = ({ target }) => {
        setDescription(target.value);
    };

    // Handles validation for the different system object types
    const validateFields = async (): Promise<boolean | void> => {
        try {
            const isValidName = await schema.isValid({ name });
            setValidName(isValidName);
            if (!isValidName) {
                toast.warn('Creation Failed: Please Address The Errors Above');
            }
            return isValidName;
        } catch (error) {
            if (error instanceof Error)
                toast.warn(error);
        } finally {
            setIsUpdatingData(false);
        }
    };

    const createProject = async (): Promise<void> => {
        setIsUpdatingData(true);

        const validUpdate = await validateFields();
        if (!validUpdate) return;

        let newProjectSystemObjectId;
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
                newProjectSystemObjectId = data?.createProject?.Project?.SystemObject?.idSystemObject;
            } else {
                throw new Error('Create request returned success: false');
            }
        } catch (error) {
            toast.error('Failed to create project');
        } finally {
            setIsUpdatingData(false);
            if (newProjectSystemObjectId) {
                history.push(`/repository/details/${newProjectSystemObjectId}`);
            } else {
                toast.error('Unable to retrieve new System Object Id');
            }
        }
    };

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Create Project</title>
            </Helmet>
            <Box display='flex' flexDirection='column' className={classes.formContainer}>
                <Box className={classes.formRow}>
                    <InputLabel className={classes.formRowLabel} htmlFor='projectName'>{toTitleCase(singularSystemObjectType)} Name</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='projectName'
                            className={classes.formField}
                            value={name}
                            onChange={onNameUpdate}
                        />
                        {validName === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>}
                    </FormControl>
                </Box>
                <Box className={classes.formRow}>
                    <InputLabel className={classes.formRowLabel} htmlFor='projectDescription'>Description</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='projectDescription'
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
            <LoadingButton className={classes.updateButton} onClick={createProject} disableElevation loading={isUpdatingData}>
                Create
            </LoadingButton>
        </Box>
    );
}

export default AddProjectForm;
