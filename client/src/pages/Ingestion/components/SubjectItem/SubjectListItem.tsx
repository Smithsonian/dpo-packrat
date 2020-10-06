import React from 'react';
import { TableRow, TableCell, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { MdAddCircleOutline, MdRemoveCircleOutline } from 'react-icons/md';
import { StateSubject } from '../../../../store';

const useStyles = makeStyles(() => ({
    name: {
        width: '100%',
    },
    options: {
        marginLeft: 20
    },
    option: {
        cursor: 'pointer'
    }
}));

interface SubjectListItemProps {
    id: number;
    arkId: string;
    unit: string;
    name: string;
    selected: boolean;
    onAdd: (subject: StateSubject) => void;
    onRemove: (arkId: string) => void;
}

function SubjectListItem(props: SubjectListItemProps): React.ReactElement {
    const { id, arkId, unit, name, selected, onAdd, onRemove } = props;
    const classes = useStyles();

    const add = () => {
        const subject: StateSubject = {
            id,
            arkId,
            unit,
            name
        };

        onAdd(subject);
    };

    const remove = () => onRemove(arkId);

    const cellStyle = {
        padding: '8px 16px'
    };

    return (
        <TableRow>
            <TableCell style={cellStyle}>{arkId}</TableCell>
            <TableCell style={cellStyle} align='left'>{unit}</TableCell>
            <TableCell style={cellStyle} align='left'>
                <Box display='flex' flexDirection='row'>
                    <Typography className={classes.name} variant='caption'>{name}</Typography>
                    <Box className={classes.options}>
                        {selected ? <MdRemoveCircleOutline className={classes.option} onClick={remove} size={24} /> : <MdAddCircleOutline className={classes.option} onClick={add} size={24} />}
                    </Box>
                </Box>
            </TableCell>
        </TableRow>
    );
}

export default SubjectListItem;