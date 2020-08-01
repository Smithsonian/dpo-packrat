import React from 'react';
import { Box, Typography, Select, MenuItem } from '@material-ui/core';
import { green, red, yellow } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { IoIosCloseCircle, IoMdCheckmark } from 'react-icons/io';
import { FaRedo } from 'react-icons/fa';
import { colorWithOpacity } from '../../../../theme/colors';
import { formatBytes } from '../../../../utils/upload';
import { FileId, AssetType } from '../../../../context';
import { motion } from 'framer-motion';

const useStyles = makeStyles(({ palette, typography }) => ({
    container: {
        position: 'relative',
        display: 'flex',
        minHeight: 70,
        alignItems: 'center',
        backgroundColor: ({ complete }: FileUploadListItemProps) => complete ? colorWithOpacity(palette.success.light, 66) : palette.background.paper,
        marginTop: 10,
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
        fontWeight: typography.fontWeightRegular,
        color: palette.primary.main,
        zIndex: 'inherit'
    },
    size: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0px 10px',
    },
    sizeText: {
        fontWeight: typography.fontWeightRegular,
        color: palette.primary.main,
        zIndex: 'inherit'
    },
    type: {
        display: 'flex',
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center'
    },
    typeSelect: {
        width: '80%',
        padding: '0px 10px',
        borderRadius: 5,
        border: `1px solid ${colorWithOpacity(palette.primary.main, 66)}`
    },
    options: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 'inherit',
    },
    option: {
        cursor: 'pointer',
        marginRight: 10,
    },
    progress: {
        position: 'absolute',
        height: '100%',
        width: ({ progress }: FileUploadListItemProps) => `${progress}%`,
        backgroundColor: ({ complete, failed }: FileUploadListItemProps) => failed ? colorWithOpacity(palette.error.light, 66) : complete ? 'transparent' : colorWithOpacity(palette.secondary.light, 66),
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
    type: AssetType;
    onChangeType: (id: FileId, type: AssetType) => void;
    onRetry: (id: FileId) => void;
    onRemove: (id: FileId) => void;
}

function FileUploadListItem(props: FileUploadListItemProps): React.ReactElement {
    const { id, name, size, type, complete, progress, failed, uploading, onChangeType, onRemove } = props;
    const classes = useStyles(props);

    let options: React.ReactElement = <IoMdCheckmark className={classes.option} size={24} color={green[500]} />;

    if (!complete) {
        options = (
            <>
                {failed && <FaRedo className={classes.option} onClick={() => onRemove(id)} size={20} color={yellow[600]} />}
                <IoIosCloseCircle className={classes.option} onClick={() => onRemove(id)} size={24} color={red[500]} />
            </>
        );
    }

    const uploadStatus = uploading ? 'Uploading...' : complete ? 'Complete' : failed ? 'Failed' : 'Ready';

    const variants = {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0.25, y: 20 },
    };

    return (
        <motion.div
            className={classes.container}
            variants={variants}
            initial='hidden'
            animate='visible'
        >
            <Box className={classes.item}>
                <Box className={classes.details}>
                    <Box>
                        <Typography className={classes.name} variant='caption'>{name}</Typography>
                    </Box>
                    <Box display='flex'>
                        <Box className={classes.status}>
                            <Typography className={classes.caption} variant='caption'>{uploadStatus}</Typography>
                        </Box>
                        {(uploading || failed) && (
                            <Box className={classes.status}>
                                <Typography className={classes.caption} variant='caption'>{progress}%</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <Box className={classes.size}>
                    <Typography className={classes.sizeText} variant='body1'>{formatBytes(size)}</Typography>
                </Box>
                <Box className={classes.type}>
                    <Select
                        value={type}
                        className={classes.typeSelect}
                        disabled={uploading || complete}
                        onChange={({ target: { value } }) => onChangeType(id, value as AssetType)}
                        disableUnderline
                    >
                        {Object.keys(AssetType).map((type, index) => <MenuItem key={index} value={type}>{type}</MenuItem>)}
                    </Select>
                </Box>
                <Box className={classes.options}>
                    {options}
                </Box>
            </Box>
            <Box className={classes.progress} />
        </motion.div>
    );
}

export default FileUploadListItem;