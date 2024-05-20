/* eslint-disable react-hooks/exhaustive-deps */
/**
 * UnitDetails
 *
 * This component renders details tab for Unit specific details used in DetailsTab component.
 */
import { Box, Table, TableBody, TableCell, TableContainer, TableRow } from '@material-ui/core';
import React, { useEffect } from 'react';
import { /*InputField,*/ Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { useDetailTabStore } from '../../../../../store';
import { eSystemObjectType } from '@dpo-packrat/common';
import { DebounceInput } from 'react-debounce-input';
import clsx from 'clsx';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import LabelTooltipText from '../../../../../components/controls/LabelTooltipText';

function UnitDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const classes = useStyles();
    const [UnitDetails, updateDetailField] = useDetailTabStore(state => [state.UnitDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, UnitDetails);
    }, [UnitDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        updateDetailField(eSystemObjectType.eUnit, name, value);
    };

    const unitData = data.getDetailsTabDataForObject?.Unit;

    return (
        <Box style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
            <TableContainer style={{ paddingTop: '5px', paddingBottom: '5px' }} >
                <Table className={classes.table}>
                    <TableBody>
                        <TableRow className={classes.tableRow}>
                            <TableCell className={classes.tableCell}>
                                {/* <Typography className={classes.labelText}>Abbreviation</Typography> */}
                                <LabelTooltipText
                                    label='Abbreviation'
                                    labelTooltipTxt='This is the shortened version of the name chosen.'
                                />
                            </TableCell>
                            <TableCell className={clsx(classes.tableCell, classes.valueText)}>
                                <DebounceInput
                                    element='input'
                                    title='abbreviation-input'
                                    disabled={disabled}
                                    value={UnitDetails?.Abbreviation || ''}
                                    type='string'
                                    name='Abbreviation'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(UnitDetails, unitData, 'Abbreviation')) }}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow className={classes.tableRow}>
                            <TableCell className={classes.tableCell}>
                                {/* <Typography className={classes.labelText}>ARKPrefix</Typography> */}
                                <LabelTooltipText
                                    label='ARKPrefx'
                                    labelTooltipTxt='The ARK prefix is used to show a shortened version of the ARK URL that only contains the ID of the unit selected.'
                                />
                            </TableCell>
                            <TableCell className={clsx(classes.tableCell, classes.valueText)}>
                                <DebounceInput
                                    element='input'
                                    title='ARKPrefix-input'
                                    disabled={disabled}
                                    value={UnitDetails?.ARKPrefix || ''}
                                    type='string'
                                    name='ARKPrefix'
                                    onChange={onSetField}
                                    className={clsx(classes.input, classes.datasetFieldInput)}
                                    style={{ ...updatedFieldStyling(isFieldUpdated(UnitDetails, unitData, 'ARKPrefix')) }}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default UnitDetails;
