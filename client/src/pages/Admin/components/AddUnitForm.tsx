/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

import { Box, FormControl, FormHelperText, InputLabel } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LoadingButton } from '../../../components';
import { CreateUnitDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { toTitleCase } from '../../../constants/helperfunctions';
import * as yup from 'yup';
import { Helmet } from 'react-helmet';
import { DebounceInput } from 'react-debounce-input';

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
    formRowInput: {
        gridColumnStart: '2'
    },
    formField: {
        backgroundColor: 'white',
        borderRadius: '4px',
        border: '1px solid rgb(118,118,118)',
        width: '60%',
        fontWeight: typography.fontWeightRegular,
        fontFamily: typography.fontFamily,
        fontSize: 'inherit',
        height: '30px'
    }
}));

function AddUnitForm(): React.ReactElement {
    const classes = useStyles();
    const history = useHistory();
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [ARKPrefix, setARKPrefix] = useState('');

    // these are the states referenced when rendering error inputs after failed validation
    const [validName, setValidName] = useState<boolean | null>(null);
    const [validAbbreviation, setValidAbbreviation] = useState<boolean | null>(null);

    const singularSystemObjectType = 'unit';

    // schema for validating the appropriate form fields
    const schema = yup.object().shape({
        name: yup.string().min(1),
        abbreviation: yup.string().min(1).max(20)
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

    // Handles validation for the different system object types
    const validateFields = async (): Promise<boolean | void> => {
        try {
            const isValidName = await schema.isValid({ name });
            setValidName(isValidName);
            const isValidAbbreviation = await schema.isValid({ abbreviation });
            setValidAbbreviation(isValidAbbreviation);
            if (abbreviation.length > 20)
                toast.warn('Creation Failed: Unit Abbreviation must be 20 characters or less in length');
            else if (!isValidName || !isValidAbbreviation)
                toast.warn('Creation Failed: Please Address The Errors Above');
            return isValidName && isValidAbbreviation;
        } catch (error) {
            const message: string = (error instanceof Error) ? error.message : 'Validation Failure';
            toast.warn(message);
        } finally {
            setIsUpdatingData(false);
        }
    };

    const createUnit = async (): Promise<void> => {
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
            const message: string = (error instanceof Error) ? `: ${error.message}` : '';
            toast.error(`Failed to create object${message}`);
        } finally {
            setIsUpdatingData(false);
            if (newUnitSystemObjectId) {
                history.push(`/repository/details/${newUnitSystemObjectId}`);
            } else {
                toast.error('Unable to retrieve new System Object Id');
            }
        }
    };

    return (
        <Box className={classes.container}>
            <Helmet>
                <title>Create Unit</title>
            </Helmet>
            <Box display='flex' flexDirection='column' className={classes.formContainer}>
                <Box className={classes.formRow}>
                    <InputLabel htmlFor='unitName' className={classes.formRowLabel}>{toTitleCase(singularSystemObjectType)} Name</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='unitName'
                            className={classes.formField}
                            value={name}
                            onChange={onNameUpdate}
                        />
                        {validName === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>}
                    </FormControl>
                </Box>
                <Box className={classes.formRow}>
                    <InputLabel htmlFor='unitAbbreviation' className={classes.formRowLabel}>Abbreviation</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='unitAbbreviation'
                            className={classes.formField}
                            value={abbreviation}
                            onChange={onAbbreviationUpdate}
                        />
                        {validAbbreviation === false && <FormHelperText style={{ backgroundColor: '#EFF2FC', color: '#f44336' }}>Required</FormHelperText>}
                    </FormControl>
                </Box>
                <Box className={classes.formRow}>
                    <InputLabel htmlFor='unitARKPrefix' className={classes.formRowLabel}>ARKPrefix</InputLabel>
                    <FormControl variant='outlined'>
                        <DebounceInput
                            id='unitARKPrefix'
                            className={classes.formField}
                            value={ARKPrefix}
                            onChange={onARKPrefixUpdate}
                        />
                    </FormControl>
                </Box>
            </Box>
            <LoadingButton className={classes.updateButton} onClick={createUnit} disableElevation loading={isUpdatingData}>
                Create
            </LoadingButton>
        </Box>
    );
}

export default AddUnitForm;
