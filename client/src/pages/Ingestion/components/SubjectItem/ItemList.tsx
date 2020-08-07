import React, { useContext } from 'react';
import { TableContainer, Table, TableCell, TableHead, TableRow, TableBody, Checkbox } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { AppContext, Item, defaultItem } from '../../../../context';
import { FaRegCircle, FaDotCircle } from 'react-icons/fa';
import { grey, blue } from '@material-ui/core/colors';
import useItem from '../../hooks/useItem';
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
        color: palette.primary.contrastText
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
        paddingBottom: 8,
        fontSize: typography.body1.fontSize,
        fontFamily: typography.fontFamily,
        borderBottom: `1px solid ${palette.grey[300]}`,
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
    const { ingestion: { items } } = useContext(AppContext);
    const { updateItem } = useItem();

    const selectableHeaderStyle = {
        width: 100
    };

    const getItemsList = (item: Item, index: number) => {
        const { id, selected, name, fullSubject } = item;
        const isDefaultItem = id === defaultItem.id;

        let content: React.ReactElement = (
            <>
                {name}
            </>
        );

        const onUpdateSelected = (selected: boolean) => {
            updateItem({ ...item, selected });
        };

        const onUpdateFullSubject = (fullSubject: boolean) => {
            updateItem({ ...item, fullSubject });
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
                onUpdateFullSubject={onUpdateFullSubject}
                selected={selected}
                fullSubject={fullSubject}
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
    fullSubject: boolean;
    onUpdateSelected: (selected: boolean) => void;
    onUpdateFullSubject: (fullSubject: boolean) => void;
    children?: React.ReactElement | React.ReactElement[]
}

function ItemListItem(props: ItemListItemProps) {
    const classes = useStyles();
    const { isDefaultItem, selected, onUpdateSelected, onUpdateFullSubject, fullSubject, children } = props;

    const rowStyle = {
        width: 100
    };

    return (
        <TableRow>
            <TableCell style={rowStyle} align='center'>
                {!selected && <FaRegCircle className={classes.selected} onClick={() => onUpdateSelected(true)} size={24} color={grey[500]} />}
                {selected && <FaDotCircle className={classes.selected} onClick={() => onUpdateSelected(false)} size={24} color={blue[500]} />}
            </TableCell>
            {children}
            <TableCell style={rowStyle} align='center'>
                {isDefaultItem ? (
                    <Checkbox
                        checked={fullSubject}
                        onChange={({ target }) => onUpdateFullSubject(target.checked)}
                        color='primary'
                    />
                ) : fullSubject ? 'Yes' : 'No'}
            </TableCell>
        </TableRow>
    );
}

export default ItemList;