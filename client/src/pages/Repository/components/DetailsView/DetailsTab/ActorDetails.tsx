/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ActorDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';
import { DebounceInput } from 'react-debounce-input';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import clsx from 'clsx';

function ActorDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const classes = useStyles();
    const [ActorDetails, updateDetailField] = useDetailTabStore(state => [state.ActorDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ActorDetails);
    }, [ActorDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eActor, name, value);
    };

    const actorData = data.getDetailsTabDataForObject?.Actor;

    return (
        <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)', paddingTop: '5px', paddingBottom: '5px' }}>
            <TableContainer>
                <Table className={classes.table}>
                    <TableBody>
                        <TableRow>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>
                                    Organization Name
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='OrganizationName-input'
                                    disabled={disabled}
                                    value={ActorDetails?.OrganizationName || ''}
                                    type='string'
                                    name='OrganizationName'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(ActorDetails, actorData, 'OrganizationName')) }}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ActorDetails;
