/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * FileListItem
 *
 * This component renders file list item used in FileListItem component.
 */
import { Box, MenuItem, Select, Typography } from '@material-ui/core';
import { green, grey, red, yellow } from '@material-ui/core/colors';
import { fade, makeStyles } from '@material-ui/core/styles';
import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { FaCheckCircle, FaRedo, FaRegCircle } from 'react-icons/fa';
import { IoIosCloseCircle } from 'react-icons/io';
import { MdFileUpload } from 'react-icons/md';
import { Progress } from '../../../../components';
import { FileId, VocabularyOption, useUploadStore } from '../../../../store';
import { palette } from '../../../../theme';
import Colors from '../../../../theme/colors';
import { formatBytes } from '../../../../utils/upload';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        position: 'relative',
        display: 'flex',
        minHeight: 60,
        alignItems: 'center',
        backgroundColor: palette.background.paper,
        marginTop: 10,
        borderRadius: 5,
        width: '100%',
        zIndex: 10,
        overflow: 'hidden',
        [breakpoints.down('lg')]: {
            minHeight: 50,
            marginTop: 5
        }
    },
    item: {
        display: 'flex',
        width: '100%',
        zIndex: 'inherit',
        cursor: ({ complete }: FileListItemProps) => (complete ? 'pointer' : 'default')
    },
    details: {
        display: 'flex',
        flexDirection: 'column',
        zIndex: 'inherit',
        paddingRight: 10,
        marginLeft: 15,
        flex: 5,
        [breakpoints.down('md')]: {
            flex: 4
        }
    },
    name: {
        fontWeight: typography.fontWeightMedium,
        zIndex: 'inherit',
        wordBreak: 'break-all'
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
        padding: '0px 10px'
    },
    sizeText: {
        fontWeight: typography.fontWeightRegular,
        color: palette.primary.main,
        zIndex: 'inherit'
    },
    type: {
        display: 'flex',
        padding: '0px 10px',
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    typeSelect: {
        maxWidth: 250,
        minWidth: 250,
        padding: '0px 10px',
        borderRadius: 5,
        fontSize: '0.8rem',
        border: `1px solid ${fade(palette.primary.main, 0.3)}`,
        [breakpoints.down('lg')]: {
            maxWidth: 130,
            minWidth: 130,
            fontSize: '0.6rem'
        }
    },
    options: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 'inherit',
        [breakpoints.down('lg')]: {
            flex: 1
        }
    },
    option: {
        cursor: 'pointer',
        marginRight: 15
    },
    progress: {
        position: 'absolute',
        height: '100%',
        width: ({ progress }: FileListItemProps) => `${progress}%`,
        backgroundColor: ({ complete, failed }: FileListItemProps) =>
            failed ? fade(palette.error.light, 0.3) : complete ? fade(Colors.upload.success, 0.4) : palette.secondary.light,
        zIndex: 5,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        transition: 'all 200ms linear'
    }
}));

interface FileListItemProps {
    id: FileId;
    size: number;
    name: string;
    selected: boolean;
    typeOptions: VocabularyOption[];
    uploading: boolean;
    complete: boolean;
    progress: number;
    failed: boolean;
    cancelled: boolean;
    type: number;
    status: string;
    onSelect: (id: FileId, selected: boolean) => void;
    onUpload: (id: FileId) => void;
    onCancel: (id: FileId) => void;
    onRetry: (id: FileId) => void;
    onRemove: (id: FileId) => void;
    onChangeType: (id: FileId, type: number) => void;
}

function FileListItem(props: FileListItemProps): React.ReactElement {
    const { id, name, size, type, typeOptions, status, complete, progress, selected, failed, uploading, onChangeType, onUpload, onCancel, onRemove, onRetry, onSelect } = props;
    const classes = useStyles(props);
    const [updateMode, updateWorkflowFileType] = useUploadStore(state => [state.updateMode, state.updateWorkflowFileType]);
    const upload = () => onUpload(id);
    const remove = () => (uploading ? onCancel(id) : onRemove(id));
    const retry = () => onRetry(id);
    const select = () => (complete ? onSelect(id, !selected) : null);

    let options: React.ReactNode = null;

    useEffect(() => {
        if (updateWorkflowFileType) onChangeType(id, updateWorkflowFileType);
    }, [updateWorkflowFileType]);

    if (!complete) {
        options = (
            <React.Fragment>
                {!uploading && !failed && <MdFileUpload className={classes.option} onClick={upload} size={22} color={green[500]} />}
                {uploading && !failed && <Progress className={classes.option} size={16} />}
                {failed && <FaRedo className={classes.option} onClick={retry} size={20} color={yellow[600]} />}
                <IoIosCloseCircle className={classes.option} onClick={remove} size={20} color={red[500]} />
            </React.Fragment>
        );
    }

    if (complete) {
        options = (
            <React.Fragment>
                {!selected && <FaRegCircle className={classes.option} size={18} color={grey[400]} />}
                {selected && <FaCheckCircle className={classes.option} size={18} color={palette.primary.main} />}
            </React.Fragment>
        );
    }

    const uploadStatus = status.charAt(0) + status.slice(1).toLowerCase();

    const variants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0.5 }
    };

    return (
        <motion.div className={classes.container} variants={variants} initial='hidden' animate='visible' whileTap={{ scale: complete ? 0.98 : 1 }}>
            <Box className={classes.item} onClick={select}>
                <Box className={classes.details}>
                    <Box>
                        <Typography className={classes.name} variant='caption'>
                            {name}
                        </Typography>
                    </Box>
                    <Box display='flex'>
                        <Box className={classes.status}>
                            <Typography className={classes.caption} variant='caption'>
                                {uploadStatus}
                            </Typography>
                        </Box>
                        {(uploading || failed) && (
                            <Box className={classes.status}>
                                <Typography className={classes.caption} variant='caption'>
                                    {progress}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <Box className={classes.size}>
                    <Typography className={classes.sizeText} variant='caption'>
                        {formatBytes(size)}
                    </Typography>
                </Box>
                <Box className={classes.type}>
                    {updateMode ? (
                        <Select value={updateWorkflowFileType || type} disabled className={classes.typeSelect} disableUnderline>
                            <MenuItem value={updateWorkflowFileType || type}>Update</MenuItem>
                        </Select>
                    ) : (
                        <Select
                            value={type}
                            disabled={complete || uploading}
                            className={classes.typeSelect}
                            onChange={({ target: { value } }) => onChangeType(id, value as number)}
                            disableUnderline
                        >
                            {typeOptions.map((option: VocabularyOption, index) => (
                                <MenuItem key={index} value={option.idVocabulary}>
                                    {option.Term}
                                </MenuItem>
                            ))}
                        </Select>
                    )}
                </Box>
                <Box className={classes.options}>{options}</Box>
            </Box>
            <Box className={classes.progress} />
        </motion.div>
    );
}

export default FileListItem;
