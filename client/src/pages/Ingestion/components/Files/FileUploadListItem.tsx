import React from 'react';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { green, red } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { IoIosCloseCircle, IoMdCheckmark } from 'react-icons/io';
import { colorWithOpacity } from '../../../../theme/colors';
import { formatBytes } from '../../../../utils/upload';

const useStyles = makeStyles(({ palette }) => ({
    item: {
        position: 'relative',
        display: 'flex',
        minHeight: 50,
        alignItems: 'center',
        backgroundColor: ({ complete }: FileUploadListItemProps) => complete ? colorWithOpacity(palette.success.light, 66) : colorWithOpacity(palette.primary.light, 66),
        marginBottom: 10,
        borderRadius: 5,
        zIndex: 10,
        overflow: 'hidden'
    },
    itemName: {
        display: 'flex',
        flex: 2,
        zIndex: 'inherit',
        marginLeft: 20
    },
    itemSize: {
        display: 'flex',
        flex: 1,
        color: palette.grey[600],
        zIndex: 'inherit'
    },
    itemOptions: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 'inherit',
        marginRight: 20
    },
    progress: {
        position: 'absolute',
        display: ({ complete }: FileUploadListItemProps) => complete ? 'none' : 'flex',
        width: ({ progress }: FileUploadListItemProps) => `${progress}%`,
        height: 50,
        backgroundColor: ({ failure }: FileUploadListItemProps) => failure ? colorWithOpacity(palette.error.light, 66) : colorWithOpacity(palette.success.light, 66),
        zIndex: 5,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transition: 'all 200ms linear'
    }
}));

interface FileUploadListItemProps {
    name: string;
    size: number;
    uploading: boolean;
    complete: boolean;
    progress: number;
    failure: boolean;
    onRemove: (id: number) => void;
}

function FileUploadListItem(props: FileUploadListItemProps): React.ReactElement {
    const { name, size, complete, uploading, onRemove } = props;
    const classes = useStyles(props);

    let options: React.ReactElement = <IoMdCheckmark size={20} color={green[500]} />;

    if (!complete) {
        options = (
            <>
                {
                    uploading ?
                        <CircularProgress color='primary' size={16} />
                        :
                        <IoIosCloseCircle onClick={() => onRemove(size)} size={20} color={red[500]} />
                }
            </>
        );
    }

    return (
        <Box className={classes.item}>
            <div style={{ display: 'flex', width: '100%', zIndex: 'inherit' }}>
                <Box className={classes.itemName}>
                    <Typography variant='caption'>{name}</Typography>
                </Box>
                <Box className={classes.itemSize}>
                    <Typography variant='caption'>{formatBytes(size)}</Typography>
                </Box>
                <Box className={classes.itemOptions}>
                    {options}
                </Box>
            </div>
            <Box className={classes.progress} />
        </Box>
    );
}

export default FileUploadListItem;