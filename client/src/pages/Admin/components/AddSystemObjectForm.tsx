/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

/**
This component is responsible for creating new SystemObjects and will handle the appropriate SystemObject type. Currently handles:
    Units
    Projects
 */

import { Box, Typography, Tab, TabProps, Tabs } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import React, { Fragment, useState } from 'react';
import { useParams } from 'react-router';
import { DebounceInput } from 'react-debounce-input';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LoadingButton, InputField } from '../../../components';
import Description from '../../Ingestion/components/Metadata/Photogrammetry/Description';
import DetailsThumbnail from '../../Repository/components/DetailsView/DetailsThumbnail';
import ObjectDetails from '../../Repository/components/DetailsView/ObjectDetails';
import { CreateUnitDocument, CreateProjectDocument } from '../../../types/graphql';
import { apolloClient } from '../../../graphql/index';
import { toTitleCase } from '../../../constants/helperfunctions';
import * as yup from 'yup';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 140px)',
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: palette.primary.light,
        [breakpoints.down('lg')]: {
            maxHeight: 'calc(100vh - 120px)',
            padding: 10
        }
    },
    updateButton: {
        height: 35,
        width: 100,
        marginTop: 10,
        color: palette.background.paper,
        [breakpoints.down('lg')]: {
            height: 30
        }
    },
    header: {
        color: palette.primary.dark
    },
    name: {
        minWidth: 180,
        height: 20,
        padding: '5px 8px',
        borderRadius: 5,
        marginRight: 20,
        color: palette.primary.dark,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        backgroundColor: palette.background.paper,
        fontSize: '0.8em'
    },
    tabpanel: {
        backgroundColor: fade(palette.primary.main, 0.25)
    },
    tab: {
        backgroundColor: fade(palette.primary.main, 0.25)
    }
}));

type ParamsProperties = {
    systemObjectType: string;
};

function AddSystemObjectForm(): React.ReactElement {
    const classes = useStyles();
    const params: ParamsProperties = useParams();
    const history = useHistory();
    const [tab] = useState(0);
    const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [ARKPrefix, setARKPrefix] = useState('');
    const [description, setDescription] = useState('');
    const [systemObjectType] = useState(params.systemObjectType);
    const [validNameInput, setValidNameInput] = useState<boolean | null>(null);
    const [validAbbreviationInput, setValidAbbreviationInput] = useState<boolean | null>(null);

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

    const validateFields = async (): Promise<boolean | void> => {
        switch (systemObjectType) {
            case 'units':
                try {
                    const isValidName = await schema.isValid({ name });
                    setValidNameInput(isValidName);
                    const isValidAbbreviation = await schema.isValid({ abbreviation });
                    setValidAbbreviationInput(isValidAbbreviation);
                    if (!isValidName || !isValidAbbreviation) {
                        toast.warn(
                            `Creation Failed. Please double-check your form inputs. The following input(s) need a valid value: ${isValidName ? '' : 'name'} ${
                                isValidAbbreviation ? '' : 'abbreviation'
                            }`
                        );
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
                    setValidNameInput(isValidName);
                    if (!isValidName) {
                        toast.warn(`Creation Failed. Please double-check your form inputs. The following input(s) need a valid value: ${isValidName ? '' : 'name'}`);
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

        console.log(validNameInput, validAbbreviationInput);

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

    let formFields;
    let createButtonBehavior;
    switch (systemObjectType) {
        case 'units':
            formFields = (
                <Fragment>
                    <InputField viewMode required label='Abbreviation' value='' name='Abbreviation' onChange={onAbbreviationUpdate} />
                    <InputField viewMode required label='ARKPrefix' value='' name='ARKPrefix' onChange={onARKPrefixUpdate} />
                </Fragment>
            );
            createButtonBehavior = createUnit;
            break;
        case 'projects':
            formFields = <Description value={''} onChange={onDescriptionUpdate} />;
            createButtonBehavior = createProject;
            break;
    }

    return (
        <Box className={classes.container}>
            <Box display='flex' flexDirection='row' mb={1}>
                <Box display='flex' mr={4}>
                    <Typography className={classes.header} variant='h5'>
                        {toTitleCase(singularSystemObjectType)}
                    </Typography>
                </Box>
                <Box mr={4}>
                    <DebounceInput element='input' value={name || ''} className={classes.name} name='name' onChange={onNameUpdate} debounceTimeout={400} />
                </Box>
            </Box>
            <Box display='flex' mt={2}>
                <ObjectDetails publishedState={''} retired={false} disabled={true} hideRetired={true} />
            </Box>
            <Box display='flex'>
                <Box display='flex' flex={1} flexDirection='column' mt={2}>
                    <Tabs value={tab} classes={{ root: classes.tab }} indicatorColor='primary' textColor='primary'>
                        <StyledTab label={'Details'} />
                    </Tabs>
                    {formFields}
                </Box>
                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail />
                </Box>
            </Box>
            <LoadingButton className={classes.updateButton} onClick={createButtonBehavior} disableElevation loading={isUpdatingData}>
                Create
            </LoadingButton>
        </Box>
    );
}

const StyledTab = withStyles(({ palette }) => ({
    root: {
        color: palette.background.paper,
        '&:focus': {
            opacity: 1
        }
    }
}))((props: TabProps) => <Tab disableRipple {...props} />);

export default AddSystemObjectForm;
