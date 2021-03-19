/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react/jsx-boolean-value */

/**
This component is responsible for creating new SystemObjects and will handle the appropriate SystemObject type. Currently handles:
    Units
    Projects
 */

import { Box, Typography /*, Tab, TabProps, Tabs */ } from '@material-ui/core';
import { fade, makeStyles /*, withStyles */ } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { useParams } from 'react-router';
import { DebounceInput } from 'react-debounce-input';
// import { useHistory } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { LoadingButton } from '../../../../components';
// createproject, createunit queries
// import DetailsTab from '../../Repository/components/DetailsView/DetailsTab';
import DetailsThumbnail from '../../Repository/components/DetailsView/DetailsThumbnail';
import ObjectDetails from '../../Repository/components/DetailsView/ObjectDetails';
import { toTitleCase } from '../../../constants/helperfunctions';

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
        // backgroundColor: 'brown',
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
    }
}));

type ParamsProperties = {
    systemObjectType: string;
};

function AddSystemObjectForm(): React.ReactElement {
    const classes = useStyles();
    const params: ParamsProperties = useParams();
    // const history = useHistory();
    // const [isUpdatingData, setIsUpdatingData] = useState(false);
    const [name, setName] = useState('');
    // const [unitAbbreviation, setUnitAbbreviation] = useState('');
    // const [unitARKPrefix, setUnitARKPrefix] = useState('');
    // const [updatedData, setUpdatedData] = useState({});
    const [systemObjectType] = useState(params.systemObjectType);
    const singularSystemObjectType = systemObjectType.slice(0, systemObjectType.length - 1);

    console.log(systemObjectType);

    const onNameUpdate = ({ target }) => {
        setName(target.value);
    };
    // const set

    //  const setSystemObjectName = () => {

    //  }

    // const onUnitAbbreviationUpdate = ({ target }) => {
    //     setUnitAbbreviation(target.value)
    // }

    // const onUnitARKPrefixChange = () => {}

    // const updateData = async (): Promise<void> => {
    // const confirmed: boolean = global.confirm(`Are you sure you want to update data`);
    // if (!confirmed) return;

    // setIsUpdatingData(true);
    // try {
    //     // get idSystemObject from the create query and then push to that
    //     // const { data } = graphqlquery for creating the data

    //     if (data?.updateObjectDetails?.success) {
    //         toast.success('Object created successfully');
    //     } else {
    //         throw new Error('Create request returned success: false');
    //     }
    // } catch (error) {
    //     toast.error('Failed to create object');
    // } finally {
    //     setIsUpdatingData(false);
    //     if (data?success) {
    //         history.push(/*repository */)
    //     }
    // }
    // };

    return (
        <Box className={classes.container}>
            <Box display='flex' flexDirection='row' justifyContent='center' mb={1}>
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
            {/* responsible for the box and thumbnail */}
            <Box display='flex'>
                <Box display='flex' flex={1} flexDirection='column' mt={2}>
                    {/* <Tabs value={tab} classes={{ root: classes.tab }} indicatorColor='primary' textColor='primary' onChange={handleTabChange}>
                        {tabs.map((tab: string, index: number) => (
                            <StyledTab key={index} label={tab} />
                        ))}
                    </Tabs>
                    {tabPanels} */}
                </Box>
                <Box display='flex' flex={1} padding={2}>
                    <DetailsThumbnail />
                </Box>
            </Box>
            {/* <LoadingButton className={classes.updateButton} onClick={updateData} disableElevation loading={isUpdatingData}>
                Update
            </LoadingButton> */}
        </Box>
    );
}

// const StyledTab = withStyles(({ palette }) => ({
//     root: {
//         color: palette.background.paper,
//         '&:focus': {
//             opacity: 1
//         }
//     }
// }))((props: TabProps) => <Tab disableRipple {...props} />);

export default AddSystemObjectForm;

// export default function AdminAddSystemObjectForm() {}
