/* eslint-disable react/jsx-max-props-per-line, react/jsx-boolean-value, @typescript-eslint/no-explicit-any */

import { Box, InputLabel, FormControl, FormHelperText, Select, MenuItem } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DebounceInput } from 'react-debounce-input';
import { Helmet } from 'react-helmet';
import * as yup from 'yup';
import clsx from 'clsx';
import { LoadingButton } from '../../../components';
import { CreateProjectDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { getUnitsList } from '../hooks/useAdminView';
import { toTitleCase } from '../../../constants/helperfunctions';

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
        backgroundColor: 'white',
        borderRadius: '4px',
        width: '80%',
        minHeight: '100px'
    },
    unitInput: {
        width: '80%'
    },
}));

function AddProjectForm(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState(0);
    const [unitList, setUnitList] = useState<any>([]);

    // these are the states referenced when rendering error inputs after failed validation
    const [validUnit, setValidUnit] = useState(true);
    const [validName, setValidName] = useState<boolean | null>(null);

    const singularSystemObjectType = 'project';

    // schema for validating the appropriate form fields
    const schema = yup.object().shape({
        name: yup.string().min(1),
        unit: yup.number().positive(),
    });

    // Fetches initial unit list for drop down
    useEffect(() => {
        const fetchUnitList = async () => {
            const { data } = await getUnitsList();
            if (data?.getUnitsFromNameSearch.Units && data?.getUnitsFromNameSearch.Units.length) {
                const fetchedUnitList = data?.getUnitsFromNameSearch.Units.slice();
                if (fetchedUnitList && fetchedUnitList.length) fetchedUnitList.sort((a, b) => a.Name.localeCompare(b.Name));
                setUnitList(fetchedUnitList);
            }
        };
        fetchUnitList();
    }, []);

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
            if (!isValidName)
                toast.error('Creation Failed: Project Name is invalid');

            const isValidUnit = await schema.isValid({ unit });
            setValidUnit(isValidUnit);
            if (!isValidUnit)
                toast.error('Creation Failed: Must Select A Unit', { autoClose: false });

            return isValidName && isValidUnit;
        } catch (error) {
            const message: string = (error instanceof Error) ? error.message : 'Validation Failure';
            toast.warn(message);
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
                        Unit: unit,
                        Description: description
                    }
                },
                refetchQueries: ['getProjectList']
            });
            if (data?.createProject) {
                toast.success('Project created successfully');
                newProjectSystemObjectId = data?.createProject?.Project?.SystemObject?.idSystemObject;
            } else {
                throw new Error('Create request returned success: false');
            }
        } catch (error) {
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Failed to create project${message}`);
        } finally {
            setIsUpdatingData(false);
            if (newProjectSystemObjectId) {
                history.push(`/repository/details/${newProjectSystemObjectId}`);
            } else {
                toast.error('Unable to retrieve new System Object Id');
            }
        }
    };

    const handleUnitSelectChange = ({ target }) => {
        setUnit(target.value);
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
                    <InputLabel className={classes.formRowLabel} htmlFor='unitSelect'>Unit</InputLabel>
                    <Select id='unitSelect' value={unit} onChange={handleUnitSelectChange} error={!validUnit} className={classes.unitInput}>
                        <MenuItem value={0} key={0}>
                            None
                        </MenuItem>
                        {unitList.map(unit => (
                            <MenuItem value={unit.idUnit} key={unit.idUnit}>
                                {unit.Name}
                            </MenuItem>
                        ))}
                    </Select>
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
