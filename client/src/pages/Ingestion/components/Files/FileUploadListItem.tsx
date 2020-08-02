import React from 'react';
import { Box, Typography, Select, MenuItem, CircularProgress } from '@material-ui/core';
import { green, red, yellow } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { IoIosCloseCircle, IoMdCheckmark } from 'react-icons/io';
import { FaRedo } from 'react-icons/fa';
import { MdFileUpload } from 'react-icons/md';
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
        backgroundColor: palette.background.paper,
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
        width: 80
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
        width: '8vw',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 'inherit',
    },
    option: {
        cursor: 'pointer',
        marginRight: 15,
    },
    progress: {
        position: 'absolute',
        height: '100%',
        width: ({ progress }: FileUploadListItemProps) => `${progress}%`,
        backgroundColor: ({ complete, failed }: FileUploadListItemProps) => failed ? colorWithOpacity(palette.error.light, 66) : complete ? colorWithOpacity(palette.success.light, 66) : palette.secondary.light,
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
    file: File,
    uploading: boolean;
    complete: boolean;
    progress: number;
    failed: boolean;
    cancelled: boolean;
    type: AssetType;
    status: string;
    onUpload: (id: FileId) => void;
    onCancel: (id: FileId) => void;
    onRetry: (id: FileId) => void;
    onRemove: (id: FileId) => void;
    onChangeType: (id: FileId, type: AssetType) => void;
}

function FileUploadListItem(props: FileUploadListItemProps): React.ReactElement {
    const { id, file, type, status, complete, progress, failed, uploading, onChangeType, onUpload, onCancel, onRemove, onRetry } = props;
    const { name, size } = file;
    const classes = useStyles(props);

    let options: React.ReactElement = <IoMdCheckmark className={classes.option} size={24} color={green[500]} />;

    const upload = () => onUpload(id);
    const remove = () => uploading ? onCancel(id) : onRemove(id);
    const retry = () => onRetry(id);

    if (!complete) {
        options = (
            <>
                {!uploading && !complete && !failed && <MdFileUpload className={classes.option} onClick={upload} size={26} color={green[500]} />}
                {uploading && !complete && !failed && <CircularProgress className={classes.option} size={20} color='primary' />}
                {failed && <FaRedo className={classes.option} onClick={retry} size={20} color={yellow[600]} />}
                <IoIosCloseCircle className={classes.option} onClick={remove} size={24} color={red[500]} />
            </>
        );
    }

    const uploadStatus = status.charAt(0) + status.slice(1).toLowerCase();

    const variants = {
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0.5, y: 20 },
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
                    <Typography className={classes.sizeText} variant='caption'>{formatBytes(size)}</Typography>
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