import React from 'react';
import { Box, Typography } from '@material-ui/core';
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
        overflow: 'hidden',
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
        justifyContent: 'flex-end',
        color: ({ complete }: FileUploadListItemProps) => complete ? palette.success.main : palette.error.main,
        zIndex: 'inherit',
        marginRight: 20
    },
    progress: {
        position: 'absolute',
        width: ({ uploading, progress }: FileUploadListItemProps) => uploading ? `${progress}%` : 0,
        height: 50,
        backgroundColor: colorWithOpacity(palette.success.light, 66),
        zIndex: 5,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transition: 'width 200ms linear'
    }
}));

interface FileUploadListItemProps {
    name: string;
    size: number;
    uploading: boolean;
    complete: boolean;
    progress: number;
}

function FileUploadListItem(props: FileUploadListItemProps): React.ReactElement {
    const { name, size, complete } = props;
    const classes = useStyles(props);

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
                    {complete ?
                        <IoMdCheckmark size={20} />
                        :
                        <IoIosCloseCircle onClick={() => alert('TODO: not implemented yet')} size={20} />
                    }
                </Box>
            </div>
            <Box className={classes.progress} />
        </Box>
    );
}

export default FileUploadListItem;