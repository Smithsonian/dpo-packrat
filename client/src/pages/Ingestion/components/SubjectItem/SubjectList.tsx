/**
 * SubjectList
 *
 * This component renders subject list table used in SubjectItem component.
 */
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { StateSubject, useSubjectStore } from '../../../../store';
import SubjectListItem from './SubjectListItem';

const useStyles = makeStyles(({ palette, spacing, breakpoints }) => ({
    container: {
        maxHeight: '20vh',
        backgroundColor: palette.background.paper
    },
    headerText: {
        position: 'sticky',
        top: 0,
        fontSize: '0.8em',
        backgroundColor: palette.background.paper,
        color: palette.primary.contrastText,
        [breakpoints.down('lg')]: {
            padding: '5px 16px',
        }
    },
    body: {
        overflow: 'auto'
    },
    emptyList: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: spacing(4)
    }
}));

interface SubjectListProps {
    subjects: StateSubject[];
    emptyLabel: string;
    selected: boolean;
}

function SubjectList(props: SubjectListProps): React.ReactElement {
    const { subjects, emptyLabel, selected } = props;
    const [addSubject, removeSubject] = useSubjectStore(state => [state.addSubject, state.removeSubject]);
    const classes = useStyles();

    const header: string[] = ['ARK / ID', 'UNIT', 'NAME'];

    const getSubjectList = ({ id, arkId, unit, name }: StateSubject, index: number) => (
        <SubjectListItem
            key={index}
            id={id}
            arkId={arkId}
            unit={unit}
            name={name}
            selected={selected}
            onAdd={addSubject}
            onRemove={removeSubject}
        />
    );

    return (
        <TableContainer className={classes.container}>
            <Table>
                <TableHead>
                    <TableRow style={{ padding: 0 }}>
                        {header.map((label, index) => <TableCell key={index} className={classes.headerText} align='left'>{label}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody className={classes.body}>
                    {!subjects.length && <EmptySubjectListComponent emptyLabel={emptyLabel} />}
                    {subjects.map(getSubjectList)}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

interface EmptySubjectListComponentProps {
    emptyLabel: string;
}

function EmptySubjectListComponent({ emptyLabel }: EmptySubjectListComponentProps) {
    const classes = useStyles();

    return (
        <TableRow>
            <TableCell />
            <TableCell align='center'>
                <Typography className={classes.emptyList} variant='caption'>{emptyLabel}</Typography>
            </TableCell>
            <TableCell />
        </TableRow>
    );
}

export default SubjectList;