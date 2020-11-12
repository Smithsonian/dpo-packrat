/**
 * DetailsThumbnail
 *
 * This component renders details thumbnail for the Repository Details UI.
 */
import { Box } from '@material-ui/core';
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import DefaultThumbnail from '../../../../assets/images/default-thumbnail.png';

const useStyles = makeStyles(() => ({
    thumbnail: {
        height: 200,
        width: 200,
        marginTop: 50,
        borderRadius: 10
    }
}));

interface DetailsThumbnailProps {
    thumbnail?: string;
}

function DetailsThumbnail(props: DetailsThumbnailProps): React.ReactElement {
    const { thumbnail = DefaultThumbnail } = props;
    const classes = useStyles();

    return (
        <Box display='flex' flex={1} flexDirection='column' alignItems='center'>
            <img className={classes.thumbnail} src={thumbnail} loading='lazy' />
        </Box>
    );
}

export default DetailsThumbnail;