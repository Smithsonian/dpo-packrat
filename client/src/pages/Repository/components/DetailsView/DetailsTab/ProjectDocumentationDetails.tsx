/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ProjectDocumentationDetails
 *
 * This component renders details tab for Actor specific details used in DetailsTab component.
 */
import React, { useEffect } from 'react';
import { Loader } from '../../../../../components';
import { DetailComponentProps } from './index';
import { eSystemObjectType } from '../../../../../types/server';
import { useDetailTabStore } from '../../../../../store';
import { Typography, Table, TableBody, TableCell, TableContainer, TableRow, Box } from '@material-ui/core';
import { useStyles, updatedFieldStyling } from './CaptureDataDetails';
import { DebounceInput } from 'react-debounce-input';
import { isFieldUpdated } from '../../../../../utils/repository';

function ProjectDocumentationDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading, disabled, onUpdateDetail, objectType } = props;
    const classes = useStyles();
    const [ProjectDocumentationDetails, updateDetailField] = useDetailTabStore(state => [state.ProjectDocumentationDetails, state.updateDetailField]);

    useEffect(() => {
        onUpdateDetail(objectType, ProjectDocumentationDetails);
    }, [ProjectDocumentationDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const onSetField = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        updateDetailField(eSystemObjectType.eProjectDocumentation, 'Description', value);
    };

    const PDData = data.getDetailsTabDataForObject?.ProjectDocumentation;

    return (
        <Box minWidth='fit-content' style={{ backgroundColor: 'rgb(236, 245, 253)' }}>
            <TableContainer style={{ paddingTop: '10px', paddingBottom: '5px' }}>
                <Table className={classes.table}>
                    <TableBody>
                        <TableRow className={classes.tableRow}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.labelText}>Description</Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell} style={{ verticalAlign: 'middle' }}>
                                <DebounceInput
                                    title='Description-input'
                                    disabled={disabled}
                                    value={ProjectDocumentationDetails?.Description || ''}
                                    type='string'
                                    name='Description'
                                    onChange={onSetField}
                                    className={classes.input}
                                    element='textarea'
                                    forceNotifyByEnter={false}
                                    debounceTimeout={400}
                                    style={{
                                        padding: 10,
                                        resize: 'none',
                                        borderRadius: 5,
                                        width: '600px',
                                        height: '80px',
                                        ...updatedFieldStyling(isFieldUpdated(ProjectDocumentationDetails, PDData, 'Description'))
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

export default ProjectDocumentationDetails;
