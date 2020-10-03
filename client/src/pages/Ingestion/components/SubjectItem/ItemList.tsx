import React from 'react';
import { TableContainer, Table, TableCell, TableHead, TableRow, TableBody, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useItem, StateItem, defaultItem } from '../../../../store';
import { FaRegCircle, FaDotCircle } from 'react-icons/fa';
import { grey, blue } from '@material-ui/core/colors';
import { DebounceInput } from 'react-debounce-input';

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
    container: {
        maxHeight: '18vh',
        backgroundColor: palette.background.paper
    },
    headerText: {
        position: 'sticky',
        top: 0,
        backgroundColor: palette.background.paper,
        color: palette.primary.contrastText,
        zIndex: 10
    },
    body: {
        overflow: 'auto'
    },
    emptyList: {
        textAlign: 'center',
        color: palette.grey[500],
        fontStyle: 'italic',
        marginTop: spacing(4)
    },
    selected: {
        cursor: 'pointer'
    },
    nameInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        padding: '0px 2px',
        fontSize: typography.body1.fontSize,
        fontFamily: typography.fontFamily,
        '&:focus': {
            outline: 'none',
        },
        '&::placeholder': {
            fontStyle: 'italic'
        },
        '&::-moz-placeholder': {
            fontStyle: 'italic'
        }
    }
}));

function ItemList(): React.ReactElement {
    const classes = useStyles();
    const [items, updateItem] = useItem(state => [state.items, state.updateItem]);

    const selectableHeaderStyle = {
        width: 100
    };

    const getItemsList = (item: StateItem, index: number) => {
        const { id, selected, name, entireSubject } = item;
        const isDefaultItem = id === defaultItem.id;

        let content: React.ReactElement = (
            <React.Fragment>
                {name}
            </React.Fragment>
        );

        const onUpdateSelected = (selected: boolean) => {
            updateItem({ ...item, selected });
        };

        const onUpdateEntireSubject = (entireSubject: boolean) => {
            updateItem({ ...item, entireSubject });
        };

        const onUpdateName = (event: React.ChangeEvent<HTMLInputElement>) => {
            const { target } = event;
            const name = target.value;

            updateItem({ ...item, name });
        };

        if (isDefaultItem) {
            content = (
                <DebounceInput
                    value={name}
                    className={classes.nameInput}
                    onChange={onUpdateName}
                    debounceTimeout={500}
                    placeholder='Add new item here'
                />
            );
        }

        return (
            <ItemListItem
                key={index}
                isDefaultItem={isDefaultItem}
                onUpdateSelected={onUpdateSelected}
                onUpdateEntireSubject={onUpdateEntireSubject}
                selected={selected}
                entireSubject={entireSubject}
            >
                <TableCell align='left'>
                    {content}
                </TableCell>
            </ItemListItem >
        );
    };

    return (
        <TableContainer className={classes.container}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell className={classes.headerText} style={selectableHeaderStyle} align='center'>Selected</TableCell>
                        <TableCell className={classes.headerText} align='left'>Name</TableCell>
                        <TableCell className={classes.headerText} style={selectableHeaderStyle} align='center'>Full Subject?</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody className={classes.body}>
                    {items.map(getItemsList)}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

interface ItemListItemProps {
    isDefaultItem: boolean;
    selected: boolean;
    entireSubject: boolean;
    onUpdateSelected: (selected: boolean) => void;
    onUpdateEntireSubject: (entireSubject: boolean) => void;
    children?: React.ReactElement | React.ReactElement[]
}

function ItemListItem(props: ItemListItemProps) {
    const classes = useStyles();
    const { isDefaultItem, selected, onUpdateSelected, onUpdateEntireSubject, entireSubject, children } = props;

    const cellStyle = {
        width: 100,
        padding: '8px 16px'
    };

    return (
        <TableRow>
            <TableCell style={cellStyle} align='center'>
                {!selected && <FaRegCircle className={classes.selected} onClick={() => onUpdateSelected(true)} size={24} color={grey[500]} />}
                {selected && <FaDotCircle className={classes.selected} onClick={() => onUpdateSelected(false)} size={24} color={blue[500]} />}
            </TableCell>
            {children}
            <TableCell style={cellStyle} align='center'>
                {isDefaultItem ? (
                    <Checkbox
                        checked={entireSubject}
                        onChange={({ target }) => onUpdateEntireSubject(target.checked)}
                        color='primary'
                    />
                ) : entireSubject ? 'Yes' : 'No'}
            </TableCell>
        </TableRow>
    );
}

export default ItemList;