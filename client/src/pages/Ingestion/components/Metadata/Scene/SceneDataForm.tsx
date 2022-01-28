/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import { Box, Checkbox, Tooltip, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@material-ui/core';
import { DebounceInput } from 'react-debounce-input';
import { makeStyles, fade } from '@material-ui/core/styles';
import clsx from 'clsx';
import { palette } from '../../../../../theme';

const useStyles = makeStyles(({ typography, breakpoints, palette }) => ({
    tableContainer: {
        padding: '0px 2px 0px 2px',
        width: 'fit-content',
        height: 'fit-content'
    },
    checkbox: {
        border: '0px',
        padding: '0px',
        height: '18px',
    },
    input: {
        height: 22,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8rem',
        },
        padding: '0px 10px',
        borderRadius: 5,
    },
    text: {
        alignItems: 'center',
        color: palette.primary.dark,
    },
    valueText: {
        paddingLeft: '4px'
    },
    tableBody: {
        '& > tr': {
            borderBottom: '1px solid #D8E5EE'
        }
    },
    tableCell: {
        border: 'none',
        padding: '1px 10px'
    },
    tableRow: {
        height: '26.5px'
    },
    blueRow: {
        backgroundColor: palette.primary.light
    },
    yellowRow: {
        backgroundColor: palette.secondary.light
    }
}));

interface SceneData {
    Name: string;
    CountScene: number;
    CountNode: number;
    CountCamera: number;
    CountLight: number;
    CountModel: number;
    CountMeta: number;
    CountSetup: number;
    CountTour: number;
    EdanUUID: string | null;
    ApprovedForPublication: boolean;
    PosedAndQCd: boolean;
}

interface SceneDataProps {
    sceneData: SceneData;
    name: string;
    EdanUUID: string;
    approvedForPublication: boolean;
    posedAndQCd: boolean;
    idAssetVersion?: number;
    setNameField: ({ target }: { target: EventTarget }) => void;
    setCheckboxField: ({ target }: { target: EventTarget }) => void;
}

function SceneDataForm(props: SceneDataProps): React.ReactElement {
    const { sceneData, setCheckboxField, setNameField, name, approvedForPublication, posedAndQCd, EdanUUID } = props;
    const classes = useStyles();
    if (!sceneData)
        return <Box></Box>;
    const { CountScene, CountNode, CountCamera, CountLight, CountModel, CountMeta, CountSetup, CountTour } = sceneData;

    return (
        <Box style={{ width: 'fit-content', height: 'fit-content', backgroundColor: palette.primary.light, paddingTop: '5px' }}>
            <TableContainer component={Paper} elevation={0} className={classes.tableContainer}>
                <Table>
                    <TableBody className={classes.tableBody}>
                        <TableRow className={clsx(classes.blueRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Name
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <DebounceInput
                                    element='input'
                                    title='sceneName-input'
                                    value={name || ''}
                                    type='string'
                                    name='name'
                                    onChange={setNameField}
                                    className={classes.input}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.blueRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Approved For Publication
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Checkbox
                                    className={classes.checkbox}
                                    name='approvedForPublication'
                                    onChange={setCheckboxField}
                                    checked={approvedForPublication}
                                    title='approvedForPublication-input'
                                    size='small'
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.blueRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Posed and QC&#39;d
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Tooltip placement='right' title='If checked, downloads will be generated if this scene has a master model as a parent.' arrow>
                                    <Checkbox
                                        className={classes.checkbox}
                                        name='posedAndQCd'
                                        onChange={setCheckboxField}
                                        checked={posedAndQCd}
                                        title='posedAndQCd-input'
                                        size='small'
                                    />
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    EDAN UUID
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {EdanUUID}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Scene Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountScene}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Node Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountNode}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Camera Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountCamera}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Light Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountLight}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Model Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountModel}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Meta Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountMeta}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Setup Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountSetup}
                                </Typography>
                            </TableCell>
                        </TableRow>
                        <TableRow className={clsx(classes.yellowRow, classes.tableRow)} style={{ borderBottom: 'none' }}>
                            <TableCell className={classes.tableCell}>
                                <Typography className={classes.text} variant='caption'>
                                    Tour Count
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.tableCell}>
                                <Typography className={clsx(classes.text, classes.valueText)} variant='caption'>
                                    {CountTour}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default SceneDataForm;
