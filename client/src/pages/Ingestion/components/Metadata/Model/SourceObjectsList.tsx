/**
 * SourceObjectsList
 *
 * This component renders the source object list with add capability.
 */
import { Box, Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { NewTabLink } from '../../../../../components';
import { StateSourceObject } from '../../../../../store';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../../utils/repository';
import { sharedButtonProps, sharedLabelProps } from '../../../../../utils/shared';

export const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        width: '52vw',
        flexDirection: 'column',
        borderRadius: 5,
        padding: 10,
        marginTop: (viewMode: boolean) => viewMode ? 10 : 0,
        backgroundColor: (viewMode: boolean) => viewMode ? palette.secondary.light : palette.primary.light
    },
    list: {
        paddingTop: 10,
        paddingLeft: (viewMode: boolean) => viewMode ? 0: 10,
        borderRadius: 5,
        backgroundColor: palette.secondary.light,
    },
    header: {
        ...sharedLabelProps
    },
    label: sharedLabelProps,
    labelUnderline: {
        textDecoration: 'underline',
        cursor: 'pointer'
    },
    removeIcon: {
        marginLeft: 20,
        cursor: 'pointer'
    },
    addButton: {
        ...sharedButtonProps,
        marginTop: 5
    }
}));

interface SourceObjectsListProps {
    sourceObjects: StateSourceObject[];
    onAdd: () => void;
    onRemove?: (id: number) => void;
    viewMode?: boolean;
    disabled?: boolean;
}

function SourceObjectsList(props: SourceObjectsListProps): React.ReactElement {
    const { sourceObjects, onAdd, onRemove, viewMode = false, disabled = false } = props;
    const classes = useStyles(viewMode);

    const titles = ['Source Object(s)', 'Identifiers', 'Object Type'];
    const hasSourceObjects = !!sourceObjects.length;

    const buttonLabel: string = viewMode ? 'Connect' : 'Add';

    return (
        <Box className={classes.container}>
            <Header titles={titles} />
            {hasSourceObjects && (
                <Box className={classes.list}>
                    {sourceObjects.map((sourceObject: StateSourceObject, index: number) => (
                        <Item
                            key={index}
                            viewMode={viewMode}
                            sourceObject={sourceObject}
                            onRemove={onRemove}
                        />
                    ))}
                </Box>
            )}
            <Button
                className={classes.addButton}
                disableElevation
                color='primary'
                variant='contained'
                onClick={() => onAdd()}
                disabled={disabled}
            >
                {buttonLabel}
            </Button>
        </Box>
    );
}

interface ObjectHeader {
    titles: string[];
}

export function Header(props: ObjectHeader): React.ReactElement {
    const { titles } = props;
    const classes = useStyles(false);
    const [title1, title2, title3] = titles;

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='row'
            marginBottom={1}
            width='92%'
        >
            <Box display='flex' flex={2}>
                <Typography className={classes.header}>{title1}</Typography>
            </Box>
            <Box display='flex' flex={3}>
                <Typography className={classes.header}>{title2}</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.header}>{title3}</Typography>
            </Box>
        </Box>
    );
}

interface ItemProps {
    sourceObject: StateSourceObject;
    onRemove?: (id: number) => void;
    viewMode?: boolean;
}

function Item(props: ItemProps): React.ReactElement {
    const { sourceObject, onRemove, viewMode = false } = props;
    const { idSystemObject, name, identifier, objectType } = sourceObject;
    const classes = useStyles(viewMode);

    const remove = () => onRemove?.(idSystemObject);

    return (
        <Box
            display='flex'
            flex={1}
            flexDirection='row'
            alignItems='center'
            pb='10px'
        >
            <Box display='flex' flex={2}>
                <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>
                    <Typography className={clsx(classes.label, classes.labelUnderline)}>{name}</Typography>
                </NewTabLink>
            </Box>
            <Box display='flex' flex={3}>
                <Typography className={classes.label}>{identifier}</Typography>
            </Box>
            <Box display='flex' flex={1}>
                <Typography className={classes.label}>{getTermForSystemObjectType(objectType)}</Typography>
            </Box>
            <Box width='50px'>
                {!viewMode && <MdRemoveCircleOutline className={classes.removeIcon} onClick={remove} size={24} />}
            </Box>
        </Box>
    );
}

export default SourceObjectsList;
