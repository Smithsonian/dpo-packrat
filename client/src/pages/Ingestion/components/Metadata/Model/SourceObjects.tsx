/**
 * SourceObjectsList
 *
 * This component renders the source object list with add capability
 */
import { Box, Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { eSystemObjectType } from '../../../../../types/server';
import { getTermForSystemObjectType } from '../../../../../utils/repository';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        width: '52vw',
        flexDirection: 'column',
        borderRadius: 5,
        padding: 10,
        backgroundColor: palette.primary.light
    },
    list: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        backgroundColor: palette.secondary.light
    },
    header: {
        fontSize: '0.9em',
        color: palette.primary.dark
    },
    label: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    labelUnderline: {
        textDecoration: 'underline',
        cursor: 'pointer'
    },
    removeIcon: {
        marginLeft: 20,
        cursor: 'pointer'
    },
    addButton: {
        height: 30,
        width: 80,
        marginLeft: 5,
        fontSize: '0.8em',
        color: palette.background.paper,
    }
}));

export type StateSourceObject = {
    id: number;
    name: string;
    identifier: string;
    objectType: eSystemObjectType;
};

interface SourceObjectsListProps {
    sourceObjects: StateSourceObject[];
    onAdd: () => void;
    onRemove: (id: number) => void;
}

function SourceObjectsList(props: SourceObjectsListProps): React.ReactElement {
    const { sourceObjects, onAdd, onRemove } = props;
    const classes = useStyles();

    return (
        <Box className={classes.container}>
            <Header />
            {!!sourceObjects.length && (
                <Box className={classes.list}>
                    {sourceObjects.map((sourceObject: StateSourceObject, index: number) => <Item key={index} {...sourceObject} onRemove={onRemove} />)}
                </Box>
            )}
            <Button
                className={classes.addButton}
                disableElevation
                color='primary'
                variant='contained'
                onClick={() => onAdd()}
            >
                Add
            </Button>
        </Box>
    );
}

function Header(): React.ReactElement {
    const classes = useStyles();

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='row'
            px={1}
            marginBottom={1}
            width='90%'
        >
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>Source Object(s)</Typography>
            </Box>
            <Box display='flex' flex={2}>
                <Typography className={classes.header}>Identifiers</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>Object Type</Typography>
            </Box>
        </Box>
    );
}

interface ItemProps {
    id: number;
    name: string;
    identifier: string;
    objectType: eSystemObjectType;
    onRemove: (id: number) => void;
}

function Item(props: ItemProps): React.ReactElement {
    const { id, name, identifier, objectType, onRemove } = props;
    const classes = useStyles();

    const remove = () => onRemove(id);

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='row'
            alignItems='center'
            pb='5px'
        >
            <Box display='flex' flex={1}>
                <Typography className={clsx(classes.label, classes.labelUnderline)}>{name}</Typography>
            </Box>
            <Box display='flex' flex={2}>
                <Typography className={classes.label}>{identifier}</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.label}>{getTermForSystemObjectType(objectType)}</Typography>
            </Box>
            <MdRemoveCircleOutline className={classes.removeIcon} onClick={remove} size={25} />
        </Box>
    );
}

export default SourceObjectsList;
