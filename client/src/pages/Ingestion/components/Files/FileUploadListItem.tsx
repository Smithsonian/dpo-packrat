import React from 'react';
import { Box, Typography, CircularProgress } from '@material-ui/core';
import { green, red } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { IoIosCloseCircle, IoMdCheckmark } from 'react-icons/io';
import { colorWithOpacity } from '../../../../theme/colors';
import { formatBytes } from '../../../../utils/upload';
import { FileId } from '../../../../context';

const useStyles = makeStyles(({ palette, typography }) => ({
    container: {
        position: 'relative',
        display: 'flex',
        minHeight: 70,
        alignItems: 'center',
        backgroundColor: ({ complete }: FileUploadListItemProps) => complete ? 'transparent' : colorWithOpacity(palette.primary.light, 66),
        marginBottom: 10,
        borderRadius: 5,
        zIndex: 10,
        overflow: 'hidden'
    },
    item: {
        display: 'flex',
        width: '100%',
        zIndex: 'inherit'
    },
    details: {
        display: 'flex',
        flexDirection: 'column',
        flex: 2,
        zIndex: 'inherit',
        padding: '10px 0px',
        marginLeft: 20
    },
    name: {
        fontWeight: typography.fontWeightMedium,
        zIndex: 'inherit'
    },
    status: {
        display: 'flex',
        width: 100,
    },
    caption: {
        color: palette.grey[700],
        zIndex: 'inherit'
    },
    options: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 'inherit',
        marginRight: 20
    },
    progress: {
        position: 'absolute',
        height: '100%',
        width: ({ progress }: FileUploadListItemProps) => `${progress}%`,
        backgroundColor: ({ failed }: FileUploadListItemProps) => failed ? colorWithOpacity(palette.error.light, 66) : colorWithOpacity(palette.success.light, 66),
        zIndex: 5,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transition: 'all 200ms linear'
    }
}));

interface FileUploadListItemProps {
    id: FileId;
    name: string;
    size: number;
    uploading: boolean;
    complete: boolean;
    progress: number;
    failed: boolean;
    onRemove: (id: FileId) => void;
}

function FileUploadListItem(props: FileUploadListItemProps): React.ReactElement {
    const { id, name, size, complete, failed, uploading, onRemove } = props;
    const classes = useStyles(props);

    let options: React.ReactElement = <IoMdCheckmark size={24} color={green[500]} />;

    if (!complete) {
        options = (
            <>
                {
                    uploading ?
                        <CircularProgress color='primary' size={20} />
                        :
                        <IoIosCloseCircle onClick={() => onRemove(id)} size={24} color={red[500]} />
                }
            </>
        );
    }

    const uploadStatus = uploading ? 'Uploading...' : complete ? 'Complete' : failed ? 'Failed' : 'Ready';

    return (
        <Box className={classes.container}>
            <div className={classes.item}>
                <Box className={classes.details}>
                    <Box>
                        <Typography className={classes.name} variant='caption'>{name}</Typography>
                    </Box>
                    <Box display='flex'>
                        <Box className={classes.status}>
                            <Typography className={classes.caption} variant='caption'>{uploadStatus}</Typography>
                        </Box>
                        <Typography className={classes.caption} variant='caption'>{formatBytes(size)}</Typography>
                    </Box>
                </Box>
                <Box className={classes.options}>
                    {options}
                </Box>
            </div>
            <Box className={classes.progress} />
        </Box>
    );
}

export default FileUploadListItem;