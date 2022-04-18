/* eslint-disable react/jsx-max-props-per-line, react/jsx-boolean-value, @typescript-eslint/no-explicit-any */

import { Box, InputLabel, FormControl, FormHelperText, Select, MenuItem, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useLocation } from 'react-router';
import { toast } from 'react-toastify';
import { DebounceInput } from 'react-debounce-input';
import { Helmet } from 'react-helmet';
import * as yup from 'yup';
import clsx from 'clsx';
import { CreateProjectDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { getUnitsList } from '../hooks/useAdminView';
import { toTitleCase } from '../../../constants/helperfunctions';
import GenericBreadcrumbsView from '../../../components/shared/GenericBreadcrumbsView';

const useStyles = makeStyles(({ typography }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        marginLeft: '15px'
    },
    btn: {
        height: 30,
        width: 90,
        backgroundColor: '#3854d0',
        color: 'white',
        outline: '2px hidden #8DABC4',
        '& :focus': {
            outline: '2px solid #8DABC4',
        }
    },
    formContainer: {
        width: '600px',
        borderRadius: 10,
        padding: '5px',
        background: '#687DDB1A 0% 0% no-repeat padding-box;',
        border: '1px solid #B7D2E5CC',
        boxShadow: '0 0 0 5px #75B3DF',
        marginTop: '15px',
        marginLeft: '5px',
        display: 'flex',
        flexDirection: 'column'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '30% 70%',
        gridGap: '10px',
        alignItems: 'center',
        minHeight: 30,
        padding: '0px 5px',
        '&:not(:last-child)': {
            borderBottom: '1px solid #D8E5EE'
        }
    },
    formRowLabel: {
        gridColumnStart: '1',
        fontSize: '0.8rem',
        color: 'black'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '5px',
        border: '1px solid rgb(118,118,118)',
        width: '95%',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        height: '20px'
    },
    descriptionInput: {
        backgroundColor: 'white',
        borderRadius: '4px',
        width: '80%',
        minHeight: '100px',
        // new
        resize: 'vertical',
        fontSize: '0.8rem',
        marginTop: 3
    },
    unitInput: {
        width: '60%',
        minWidth: 'fit-content',
        height: '24px',
        padding: '0px 5px',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: '0.8rem',
        color: 'black',
        borderRadius: 5,
        border: '1px solid rgb(118,118,118)',
        backgroundColor: 'white'
    },
    breadCrumbsContainer: {
        display: 'flex',
        alignItems: 'center',
        minHeight: '46px',
        paddingLeft: '20px',
        paddingRight: '20px',
        background: '#ECF5FD',
        color: '#3F536E',
        width: 'fit-content'
    },
    buttonGroup: {
        marginTop: '15px',
        columnGap: 30,
        display: 'flex'
    },
}));

function AddProjectForm(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState(0);
    const [unitList, setUnitList] = useState<any>([]);
    const location = useLocation();

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
        }
    };

    const createProject = async (): Promise<void> => {
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
            <Box className={classes.breadCrumbsContainer}>
                <GenericBreadcrumbsView items={location.pathname.slice(1)} />
            </Box>
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
            <Box className={classes.buttonGroup}>
                <Button className={classes.btn} onClick={createProject} disableElevation>
                    Create
                </Button>
                <Button variant='contained' className={classes.btn} onClick={() => history.push('/admin/projects')} disableElevation>
                    Cancel
                </Button>
            </Box>

        </Box>
    );
}

export default AddProjectForm;
