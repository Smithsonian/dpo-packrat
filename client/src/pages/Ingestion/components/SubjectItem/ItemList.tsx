import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { RiCheckboxBlankCircleLine, RiRecordCircleFill } from 'react-icons/ri';
import { defaultItem, StateItem, useItemStore } from '../../../../store';
import { palette } from '../../../../theme';

const useStyles = makeStyles(({ palette, spacing, typography, breakpoints }) => ({
    container: {
        maxHeight: '18vh',
        backgroundColor: palette.background.paper
    },
    headerText: {
        position: 'sticky',
        top: 0,
        fontSize: '0.8em',
        backgroundColor: palette.background.paper,
        color: palette.primary.contrastText,
        zIndex: 10,
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
    },
    selected: {
        cursor: 'pointer',
        marginTop: 4
    },
    nameInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        padding: '0px 2px',
        fontSize: '1em',
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
    const [items, updateItem] = useItemStore(state => [state.items, state.updateItem]);

    const selectableHeaderStyle = {
        width: 100
    };

    const getItemsList = (item: StateItem, index: number) => {
        const { id, selected, name, entireSubject } = item;
        const isDefaultItem = id === defaultItem.id;

        let content: React.ReactNode = (
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
    children?: React.ReactNode;
}

function ItemListItem(props: ItemListItemProps) {
    const classes = useStyles();
    const { isDefaultItem, selected, onUpdateSelected, onUpdateEntireSubject, entireSubject, children } = props;

    const cellStyle = {
        width: 100,
    };

    return (
        <TableRow>
            <TableCell style={cellStyle} align='center'>
                {!selected && <RiCheckboxBlankCircleLine className={classes.selected} onClick={() => onUpdateSelected(true)} size={20} color={grey[400]} />}
                {selected && <RiRecordCircleFill className={classes.selected} onClick={() => onUpdateSelected(false)} size={20} color={palette.primary.main} />}
            </TableCell>
            {children}
            <TableCell style={cellStyle} align='center'>
                {isDefaultItem ? (
                    <>
                        {!entireSubject && <MdCheckBoxOutlineBlank className={classes.selected} onClick={() => onUpdateEntireSubject(true)} size={20} color={grey[500]} />}
                        {entireSubject && <MdCheckBox className={classes.selected} onClick={() => onUpdateEntireSubject(false)} size={20} color={palette.primary.main} />}
                    </>
                ) : entireSubject ? 'Yes' : 'No'}
            </TableCell>
        </TableRow>
    );
}

export default ItemList;