import { Box, Chip, Typography } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiLink2 } from 'react-icons/fi';
import { IoIosRemoveCircle } from 'react-icons/io';
import { toast } from 'react-toastify';
import { useRepositoryStore } from '../../../../store';
import { Colors, palette } from '../../../../theme';
import FilterDate from './FilterDate';
import FilterSelect from './FilterSelect';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: (isExpanded: boolean) => isExpanded ? 250 : 35,
        background: palette.primary.light,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        transition: '250ms height ease',
        [breakpoints.down('lg')]: {
            height: (isExpanded: boolean) => isExpanded ? 230 : 20,
        }
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    defaultFilter: {
        color: palette.primary.dark,
        fontWeight: typography.fontWeightRegular
    },
    anchor: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 35,
        padding: '0px 10px',
        borderRadius: 10,
        marginLeft: 5,
        transition: 'all 250ms linear',
        [breakpoints.down('lg')]: {
            height: 20,
            padding: '0px 5px',
        },
        '&:hover': {
            cursor: 'pointer',
            backgroundColor: fade(palette.primary.light, 0.2)
        },
    },
    caption: {
        marginTop: 4,
        marginLeft: 4,
        fontSize: '0.75em',
        color: palette.primary.dark,
        fontStyle: 'italic',
        fontWeight: typography.fontWeightLight
    },
    textArea: {
        width: 280,
        padding: '5px 8px',
        borderRadius: 5,
        backgroundColor: Colors.defaults.white,
        fontSize: '0.8em',
        cursor: 'pointer'
    },
    chip: {
        marginLeft: 10,
        color: palette.primary.dark
    },
    selectContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginRight: 20
    },
    options: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
    }
}));

const StyledChip = withStyles(({ palette }) => ({
    outlined: {
        height: 30,
        fontSize: '0.8em',
        border: `0.5px solid ${palette.primary.contrastText}`
    }
}))(Chip);

function RepositoryFilterView(): React.ReactElement {
    const [isExpanded, toggleFilter] = useRepositoryStore(state => [state.isExpanded, state.toggleFilter]);
    const classes = useStyles(isExpanded);
    const [chips] = useState([
        {
            type: 'Unit',
            name: 'NMNH'
        },
        {
            type: 'Project',
            name: 'Seashell'
        }
    ]);

    const onCopyLink = (): void => {
        if ('clipboard' in navigator) {
            navigator.clipboard.writeText('');
            toast.success('Link has been copied to your clipboard');
        }
    };

    let content: React.ReactNode = null;

    if (isExpanded) {
        content = (
            <React.Fragment>
                <Box display='flex'>
                    <Box display='flex' flexDirection='column'>
                        <Box className={classes.textArea}>
                            <Typography variant='body1'>Unit: All</Typography>
                        </Box>
                        <Typography className={classes.caption} variant='caption'>click to select</Typography>
                    </Box>

                    {chips.map((chip, index: number) => {
                        const { type, name } = chip;
                        const handleDelete = () => null;
                        const label = `${type}: ${name}`;

                        return (
                            <StyledChip
                                key={index}
                                label={label}
                                size='small'
                                deleteIcon={<IoIosRemoveCircle color={palette.primary.contrastText} />}
                                className={classes.chip}
                                onDelete={handleDelete}
                                variant='outlined'
                            />
                        );
                    })}
                </Box>

                <Box display='flex' flex={1} mt={1}>
                    <Box className={classes.selectContainer} width={300}>
                        <FilterSelect label='Repository Root Tree' name='repositoryRootTree' />
                        <FilterSelect label='Objects To Display' name='objectsToDisplay' />
                        <FilterSelect label='Metadata To Display' name='metadataToDisplay' />
                    </Box>

                    <Box className={classes.selectContainer} width={225}>
                        <FilterSelect label='Units' name='units' />
                        <FilterSelect label='Projects' name='projects' />
                        <FilterSelect label='Has' name='has' />
                        <FilterSelect label='Missing' name='missing' />
                    </Box>

                    <Box>
                        <Box className={classes.selectContainer} width={280}>
                            <FilterSelect label='Capture Method' name='captureMethod' />
                            <FilterSelect label='Variant Type' name='variantType' />
                            <FilterSelect label='Model Purpose' name='modelPurpose' />
                            <FilterSelect label='Model File Type' name='modelFile Type' />
                        </Box>
                        <FilterDate label='Date Created' name='dateCreated' />
                    </Box>
                </Box>
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
                    <FiLink2 className={classes.anchor} color={palette.primary.main} size={20} onClick={onCopyLink} />
                    {isExpanded ?
                        <FaChevronUp
                            className={classes.anchor}
                            size={15}
                            color={palette.primary.main}
                            onClick={toggleFilter}
                        /> :
                        <FaChevronDown
                            className={classes.anchor}
                            size={15}
                            color={palette.primary.main}
                            onClick={toggleFilter}
                        />}
                </Box>
            </Box>
        </Box>
    );
}

export default RepositoryFilterView;
