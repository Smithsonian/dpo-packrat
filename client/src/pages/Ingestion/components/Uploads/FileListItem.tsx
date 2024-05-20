/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * FileListItem
 *
 * This component renders file list item used in FileListItem component.
 */
import { Box, MenuItem, Select, Typography } from '@material-ui/core';
import { green, grey, red, yellow } from '@material-ui/core/colors';
import { fade, makeStyles, createStyles } from '@material-ui/core/styles';
import { motion } from 'framer-motion';
import React from 'react';
import { FaCheckCircle, FaRedo, FaRegCircle } from 'react-icons/fa';
import { IoIosCloseCircle } from 'react-icons/io';
import { MdFileUpload } from 'react-icons/md';
import { Progress } from '../../../../components';
import { FileId, VocabularyOption } from '../../../../store';
import { palette } from '../../../../theme';
import Colors from '../../../../theme/colors';
import { formatBytes } from '../../../../utils/upload';
import { eIngestionMode } from '../../../../constants';
import { UploadReferences } from '../../../../store';
import { toast } from 'react-toastify';

const useStyles = makeStyles(({ palette, breakpoints }) => createStyles({
    container: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: palette.background.paper,
        marginTop: 10,
        borderRadius: 1,
        border: `1px solid ${fade(palette.primary.main, 0.3)}`,
        boxSizing: 'border-box',
        width: '100%',
        zIndex: 10,
        [breakpoints.down('lg')]: {
            marginTop: 5
        },
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
        fontWeight: 500,
        color: 'black',
        zIndex: 'inherit',
        wordBreak: 'break-all',
    },
    updateContext: {
        fontWeight: 300,
        fontStyle: 'italic',
        color: 'black',
        zIndex: 'inherit',
        wordBreak: 'break-all',
        display: 'flex',
    },
    status: {
        display: 'flex',
        width: 80
    },
    caption: {
        fontWeight: 400,
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
        fontWeight: 400,
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
        borderRadius: 5,
        fontSize: '0.8rem',
        border: `1px solid ${fade(palette.primary.main, 0.3)}`,
        [breakpoints.down('lg')]: {
            maxWidth: 130,
            minWidth: 130
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
    idSystemObject?: number;
    references?: UploadReferences;
    idAsset?: number;
    idSOAttachment?: number;
    uploadPendingList: boolean | undefined;
    updateContext: string | undefined;
    onSelect: (id: FileId, selected: boolean) => void;
    onUpload: (id: FileId) => void;
    onCancel: (id: FileId) => void;
    onCancelSpecial: (uploadType: eIngestionMode, idSO: number) => void;
    onRetry: (id: FileId) => void;
    onRetrySpecial: (uploadType: eIngestionMode, idSO: number) => void;
    onRemove: (id: FileId) => void;
    onRemoveSpecial: (uploadType: eIngestionMode, idSO: number) => void;
    onChangeType: (id: FileId, type: number) => void;
}

function FileListItem(props: FileListItemProps): React.ReactElement {
    const {
        id,
        name,
        size,
        type,
        typeOptions,
        status,
        complete,
        progress,
        selected,
        failed,
        uploading,
        references,
        idAsset,
        idSOAttachment,
        idSystemObject,
        updateContext,
        onChangeType,
        onUpload,
        onCancel,
        onCancelSpecial,
        onRemove,
        onRemoveSpecial,
        onRetry,
        onRetrySpecial,
        onSelect
    } = props;
    const classes = useStyles(props);
    const upload = () => {
        onUpload(id);
        toast.info('Do not leave this page! Upload in Progress.');
    };

    const remove = () => {
        const isUpdate = references?.idAsset;
        const isAttachment = references?.idSOAttachment;
        const isSpecialUpload = isUpdate || isAttachment;
        if (uploading && isSpecialUpload) return isUpdate ? onCancelSpecial(eIngestionMode.eUpdate, idSystemObject as number) : onCancelSpecial(eIngestionMode.eAttach, idSystemObject as number);
        if (!uploading && isSpecialUpload && idSystemObject) return isUpdate ? onRemoveSpecial(eIngestionMode.eUpdate, idSystemObject) : onRemoveSpecial(eIngestionMode.eAttach, idSystemObject);
        if (uploading && !isSpecialUpload) return onCancel(id);
        if (!uploading && !isSpecialUpload) return onRemove(id);
    };
    const retry = () => {
        const isUpdate = references?.idAsset;
        const isAttachment = references?.idSOAttachment;
        return isUpdate ? onRetrySpecial(eIngestionMode.eUpdate, idSystemObject as number) : isAttachment ? onRetrySpecial(eIngestionMode.eAttach, idSystemObject as number) : onRetry(id);
    };
    const select = () => (complete ? onSelect(id, !selected) : null);
    let options: React.ReactNode = null;
    if (!complete) {
        {/*Uploaded Items State*/}
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

    let content;

    // CASE: pending list mode (upload) || CASE: completed list mode (ingestion)
    // When performing an upload, a FileListItem may have a "references" object
    // The "references" object indicates whether a file is an update (idAsset + idSOAttachment) or an attachment (idSOAttachment)
    // Lack of "references" indicates fresh upload

    // When starting the ingestion process, the FileListItem can supply idAsset, idSOAttachment, both, or none
    // idAsset + idSOAttachment indicates an update, idSOAttachment indicates an attachment, and none indicates a normal ingestion
    if ((references && references.idAsset && references.idSOAttachment) || (idAsset && idSOAttachment)) {
        content =  (
            <Select value={type} disabled className={classes.typeSelect} disableUnderline SelectDisplayProps={{ style: { paddingLeft: '5px', borderRadius: '5px' } }}>
                <MenuItem value={type}>Update</MenuItem>
            </Select>
        );
    } else if (idSOAttachment || (references && references.idSOAttachment)) {
        content = (
            <Select value={type} disabled className={classes.typeSelect} disableUnderline SelectDisplayProps={{ style: { paddingLeft: '5px', borderRadius: '5px' } }}>
                <MenuItem value={type}>Attachment</MenuItem>
            </Select>
        );
    } else {
        content = (
            <Select
                value={type}
                disabled={complete || uploading}
                className={classes.typeSelect}
                onChange={({ target: { value } }) => onChangeType(id, value as number)}
                disableUnderline
                SelectDisplayProps={{ style: { paddingLeft: '5px', borderRadius: '5px' } }}
            >
                {typeOptions.map(function (option: VocabularyOption, index) {
                    // Silence unsupported types:
                    switch (option.Term.toLowerCase()) {
                        case 'capture data set: diconde':
                        case 'capture data set: dicom':
                        case 'capture data set: laser line':
                        case 'capture data set: spherical laser':
                        case 'capture data set: structured light':
                        case 'capture data set: other':
                        case 'capture data file':
                        case 'model geometry file':
                        case 'model uv map file':
                        case 'intermediary file':
                        case 'attachment':
                            return null;
                    }
                    return (
                        <MenuItem key={index} value={option.idVocabulary}>
                            {option.Term}
                        </MenuItem>
                    );
                }
                )}
            </Select>
        );
    }

    return (
        <motion.div className={classes.container} variants={variants} initial='hidden' animate='visible' whileTap={{ scale: complete ? 0.98 : 1 }}>
            <Box className={classes.item} onClick={select}>
                <Box className={classes.details}>
                    <Box>
                        <Typography className={classes.name} variant='caption'>
                            {name}
                        </Typography>
                    </Box>
                    {(updateContext &&
                        <Box>
                            <Typography className={classes.updateContext} variant='caption'>
                                {updateContext}
                            </Typography>
                        </Box>
                    )}
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
                    {content}
                </Box>
                <Box className={classes.options}>{options}</Box>
            </Box>
            <Box className={classes.progress} />
        </motion.div>
    );
}

export default FileListItem;
