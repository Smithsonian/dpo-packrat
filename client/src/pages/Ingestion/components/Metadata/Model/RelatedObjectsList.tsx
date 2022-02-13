/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * RelatedObjectsList
 *
 * This component renders the source object list with add capability.
 */
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableRow, TableHead } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { MdRemoveCircleOutline } from 'react-icons/md';
import { NewTabLink } from '../../../../../components';
import { StateRelatedObject } from '../../../../../store';
import { RelatedObjectType } from '../../../../../types/graphql';
import { ViewableProps } from '../../../../../types/repository';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../../utils/repository';
import { sharedButtonProps, sharedLabelProps } from '../../../../../utils/shared';
import { toast } from 'react-toastify';
import { eSystemObjectType } from '@dpo-packrat/common';

const useStyles = makeStyles(({ palette }) => ({
    container: {
        display: 'flex',
        width: (viewMode: boolean) => (viewMode ? undefined : 'calc(100% - 20px)'),
        flexDirection: 'column',
        borderRadius: 5,
        padding: '6px 10px 10px 10px',
        marginTop: '8px',
        backgroundColor: (viewMode: boolean) => (viewMode ? palette.secondary.light : palette.primary.light)
    },
    list: {
        borderRadius: 5,
        backgroundColor: '#ffffe0'
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
        marginTop: 10
    }
}));

interface RelatedObjectsListProps extends ViewableProps {
    relatedObjects: StateRelatedObject[];
    type: RelatedObjectType;
    onAdd: () => void;
    onRemove?: (id: number) => void;
    currentObject?: number;
    onRemoveConnection?: (idSystemObjectMaster: number, objectTypeMaster: eSystemObjectType, idSystemObjectDerived: number, objectTypeDerived: eSystemObjectType) => any;
    objectType?: number;
    relationshipLanguage?: string;
}

function RelatedObjectsList(props: RelatedObjectsListProps): React.ReactElement {
    const { relatedObjects, type, onAdd, onRemove, viewMode = false, disabled = false, currentObject, onRemoveConnection, objectType, relationshipLanguage } = props;
    const classes = useStyles(viewMode);

    const hasRelatedObjects = !!relatedObjects.length;

    const buttonLabel: string = viewMode ? 'Connect' : 'Add';

    return (
        <Box className={classes.container}>
            <TableContainer style={{ width: 'fit-content' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ padding: '2px 3px 4px 6px', width: 'fit-content' }}>
                                <Typography style={{ fontSize: '0.75rem' }}>{relationshipLanguage || type.toString() + ' Object(s)'}</Typography>
                            </TableCell>
                            <TableCell style={{ padding: '2px 3px 4px 3px', textAlign: 'center' }}>
                                <Typography style={{ fontSize: '0.75rem' }}>Object Type</Typography>
                            </TableCell>
                            <TableCell style={{ padding: '2px 3px 4px 3px', textAlign: 'center' }}>
                                <Typography style={{ fontSize: '0.75rem' }}>Identifier</Typography>
                            </TableCell>
                            <TableCell style={{ width: '0px', padding: 0 }}>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    {hasRelatedObjects && (
                        <TableBody>
                            {relatedObjects.map((sourceObject: StateRelatedObject, index: number) => (
                                <Item
                                    type={type}
                                    key={index}
                                    viewMode={viewMode}
                                    sourceObject={sourceObject}
                                    currentObject={currentObject}
                                    onRemove={onRemove}
                                    onRemoveConnection={onRemoveConnection}
                                    systemObjectType={objectType}
                                    index={index}
                                    finalIndex={relatedObjects.length - 1}
                                />
                            ))}
                        </TableBody>
                    )}
                </Table>
            </TableContainer>
            <Button className={classes.addButton} disableElevation color='primary' variant='contained' onClick={() => onAdd()} disabled={disabled}>
                {buttonLabel}
            </Button>
        </Box>
    );
}


interface ItemProps {
    sourceObject: StateRelatedObject;
    onRemove?: (id: number) => void;
    viewMode?: boolean;
    currentObject?: number;
    onRemoveConnection?: (idSystemObjectMaster: number, objectTypeMaster: eSystemObjectType, idSystemObjectDerived: number, objectTypeDerived: eSystemObjectType) => any;
    type?: RelatedObjectType;
    systemObjectType?: number;
    index: number;
    finalIndex: number;
}

function Item(props: ItemProps): React.ReactElement {
    const { sourceObject, onRemove, viewMode = false, currentObject, onRemoveConnection, type, systemObjectType, index, finalIndex } = props;
    const { idSystemObject, name, identifier, objectType } = sourceObject;
    const classes = useStyles(viewMode);
    let remove;
    if (currentObject && onRemoveConnection && type && systemObjectType) {
        remove = async () => {
            const result = window.confirm('Are you sure you wish to remove this relationship?');
            if (!result) return;
            const {
                data: {
                    deleteObjectConnection: { details, success }
                }
            } =
                type.toString() === 'Source'
                    ? await onRemoveConnection(idSystemObject, objectType, currentObject, systemObjectType)
                    : await onRemoveConnection(currentObject, systemObjectType, idSystemObject, objectType);
            if (success) {
                toast.success(details);
            } else {
                toast.error(details);
            }
        };
    } else if (onRemove) {
        remove = () => onRemove?.(idSystemObject);
    }

    return (
        <TableRow style={{ backgroundColor: index % 2 !== 0 ? 'white' : '#ffffe0' }}>
            <TableCell style={{ padding: '1px 0px 1px 8px', borderTopLeftRadius: index === 0 ? '5px' : undefined, borderBottomLeftRadius: finalIndex === index ? '5px' : undefined }}>
                <NewTabLink to={getDetailsUrlForObject(idSystemObject)} className={clsx(classes.label, classes.labelUnderline)} style={{ fontSize: '0.8rem', verticalAlign: 'middle', wordBreak: 'break-word' }}>
                    {name}
                </NewTabLink>
            </TableCell>
            <TableCell style={{ padding: '1px 2px', textAlign: 'center' }}>
                <Typography className={classes.label} style={{ fontSize: '0.8rem' }}>{getTermForSystemObjectType(objectType)}</Typography>
            </TableCell>
            <TableCell style={{ padding: '1px 2px' }}>
                <Typography className={classes.label} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{identifier}</Typography>
            </TableCell>
            <TableCell style={{ padding: '1px 8px 0px 0px', borderTopRightRadius: index === 0 ? '5px' : undefined, borderBottomRightRadius: finalIndex === index ? '5px' : undefined }}>
                {!viewMode && <MdRemoveCircleOutline className={classes.removeIcon} onClick={remove} size={16} style={{ verticalAlign: 'sub' }} />}
            </TableCell>
        </TableRow>
    );
}

export default RelatedObjectsList;
