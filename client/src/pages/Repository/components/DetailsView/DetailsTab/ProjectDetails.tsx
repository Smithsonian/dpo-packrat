/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ProjectDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { isFieldUpdated } from '../../../../../utils/repository';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '@dpo-packrat/common';
import { useDetailTabStore } from '../../../../../store';
import { Typography, Table, TableBody, TableCell, TableContainer, TableRow, Box } from '@material-ui/core';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import { DebounceInput } from 'react-debounce-input';

function ProjectDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const classes = useStyles();
    const [ProjectDetails, updateDetailField] = useDetailTabStore(state => [state.ProjectDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ProjectDetails);
    }, [ProjectDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        updateDetailField(eSystemObjectType.eProject, 'Description', value);
    };

    const projectData = data.getDetailsTabDataForObject?.Project;

    return (
        <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
            <TableContainer style={{ paddingTop: '10px', paddingBottom: '5px' }}>
                <Table className={classes.table}>
                    <TableBody>
                        <TableRow className={classes.tableRow}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>Description</Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell} style={{ verticalAlign: 'middle', height: 'fit-content' }}>
                                <DebounceInput
                                    title='Description-input'
                                    disabled={disabled}
                                    value={ProjectDetails?.Description || ''}
                                    type='string'
                                    name='Description'
                                    onChange={onSetField}
                                    className={classes.input}
                                    element='textarea'
                                    forceNotifyByEnter={false}
                                    debounceTimeout={400}
                                    style={{
                                        height: '80px',
                                        width: '600px',
                                        padding: 10,
                                        resize: 'none',
                                        borderRadius: 5,
                                        ...updatedFieldStyling(isFieldUpdated(ProjectDetails, projectData, 'Description'))
                                    }}
                                >
                                </DebounceInput>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ProjectDetails;
