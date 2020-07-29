import React, { useContext } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { colorWithOpacity } from '../../../../theme/colors';
import { AppContext } from '../../../../context';
import FileUploadListItem from './FileUploadListItem';

const useStyles = makeStyles(({ palette, breakpoints }) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 20,
        flex: 1,
        maxHeight: '40vh',
        width: '40vw',
        overflow: 'scroll',
        [breakpoints.up('lg')]: {
            maxHeight: '50vh',
        }
    },
    item: {
        display: 'flex',
        padding: '0px 20px',
        minHeight: 50,
        alignItems: 'center',
        backgroundColor: colorWithOpacity(palette.primary.light, 66),
        marginBottom: 10,
        borderRadius: 5,
    },
    itemName: {
        display: 'flex',
        flex: 2,
    },
    itemSize: {
        display: 'flex',
        flex: 1,
        color: palette.grey[600]
    },
    itemOptions: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end',
        color: palette.error.main
    },
}));

function FileUploadList(): React.ReactElement {
    const classes = useStyles();
    const { ingestion } = useContext(AppContext);
    const { transfer } = ingestion;
    const { files, next, uploaded, progress } = transfer;

    return (
        <Box className={classes.container}>
            {files.map(({ id, file: { name, size } }, index) => {
                const uploading = next?.id === id ?? false;
                const complete = !!uploaded[id];

                return (
                    <FileUploadListItem
                        key={index}
                        name={name}
                        size={size}
                        uploading={uploading}
                        complete={complete}
                        progress={progress}
                    />
                );
            })}
        </Box>
    );
}

export default FileUploadList;