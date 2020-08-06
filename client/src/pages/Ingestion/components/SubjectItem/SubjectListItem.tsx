import React from 'react';
import { TableRow, TableCell, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { MdAddCircleOutline, MdRemoveCircleOutline } from 'react-icons/md';
import { Subject } from '../../../../context';

const useStyles = makeStyles(() => ({
    name: {
        display: 'flex'
    },
    options: {
        marginLeft: 20
    },
    option: {
        cursor: 'pointer'
    }
}));

interface SubjectListItemProps {
    arkId: string;
    unit: string;
    name: string;
    selected: boolean;
    onAdd: (subject: Subject) => void;
    onRemove: (arkId: string) => void;
}

function SubjectListItem(props: SubjectListItemProps): React.ReactElement {
    const { arkId, unit, name, selected, onAdd, onRemove } = props;
    const classes = useStyles();

    const add = () => {
        const subject: Subject = {
            arkId,
            unit,
            name
        };

        onAdd(subject);
    };

    const remove = () => onRemove(arkId);

    return (
        <TableRow>
            <TableCell>{arkId}</TableCell>
            <TableCell align='left'>{unit}</TableCell>
            <TableCell className={classes.name} align='left'>
                <Typography variant='caption'>{name}</Typography>
                <Box className={classes.options}>
                    {selected ? <MdRemoveCircleOutline className={classes.option} onClick={remove} size={24} /> : <MdAddCircleOutline className={classes.option} onClick={add} size={24} />}
                </Box>
            </TableCell>
        </TableRow>
    );
}

export default SubjectListItem;