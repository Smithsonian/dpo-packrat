import { Box, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { RepositoryFilter } from '../../index';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { FiLink2 } from 'react-icons/fi';
import { palette } from '../../../../theme';
import { toast } from 'react-toastify';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: ({ isExpanded }: RepositoryFilterViewProps) => isExpanded ? 150 : 30,
        background: palette.primary.light,
        borderRadius: 5,
        padding: 20,
        marginBottom: 10,
        transition: '250ms height ease',
        [breakpoints.down('lg')]: {
            padding: 10,
        }
    },
    content: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
    },
    defaultFilter: {
        color: palette.primary.dark,
        fontWeight: typography.fontWeightRegular
    },
    anchor: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 30,
        padding: '0px 10px',
        borderRadius: 10,
        marginLeft: 5,
        transition: 'all 250ms linear',
        [breakpoints.down('lg')]: {
            padding: '0px 5px',
        },
        '&:hover': {
            cursor: 'pointer',
            backgroundColor: fade(palette.primary.light, 0.2)
        },
    },
    options: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
    }
}));

interface RepositoryFilterViewProps {
    filter: RepositoryFilter;
    onChange: (field: string, value: string | boolean) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

function RepositoryFilterView(props: RepositoryFilterViewProps): React.ReactElement {
    const { isExpanded, onToggle } = props;
    const classes = useStyles(props);

    const onCopyLink = (): void => {
        if ('clipboard' in navigator) {
            navigator.clipboard.writeText('');
            toast.success('Link has been copied to your clipboard');
        }
    };

    let content: React.ReactNode = (
        <Typography className={classes.defaultFilter} variant='body1'>
            Filter
        </Typography>
    );

    if (isExpanded) {
        content = (
            <React.Fragment>

            </React.Fragment>
        );
    }

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>
                {content}
            </Box>
            <Box className={classes.options}>
                <Box display='flex' >
                    <FiLink2 className={classes.anchor} color={palette.primary.main} size={18} onClick={onCopyLink} />
                    {isExpanded ?
                        <FaChevronUp
                            className={classes.anchor}
                            size={15}
                            color={palette.primary.main}
                            onClick={onToggle}
                        /> :
                        <FaChevronDown
                            className={classes.anchor}
                            size={15}
                            color={palette.primary.main}
                            onClick={onToggle}
                        />}
                </Box>
            </Box>
        </Box>
    );
}

export default RepositoryFilterView;
