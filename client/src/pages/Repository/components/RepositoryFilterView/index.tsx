import { Box, Chip, Typography } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiLink2 } from 'react-icons/fi';
import { IoIosRemoveCircle } from 'react-icons/io';
import { toast } from 'react-toastify';
import { useRepositoryStore } from '../../../../store';
import { Colors, palette } from '../../../../theme';
import { eSystemObjectType } from '../../../../types/server';
import FilterDate from './FilterDate';
import FilterSelect from './FilterSelect';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: (isExpanded: boolean) => isExpanded ? 235 : 35,
        background: palette.primary.light,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        transition: '250ms height ease',
        [breakpoints.down('lg')]: {
            height: (isExpanded: boolean) => isExpanded ? 215 : 30
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
        color: palette.primary.dark,
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
        alignItems: (isExpanded: boolean) => isExpanded ? 'flex-end' : 'center',
        justifyContent: 'center'
    }
}));

const StyledChip = withStyles(({ palette }) => ({
    outlined: {
        height: 30,
        fontSize: '0.75em',
        border: `0.5px solid ${palette.primary.contrastText}`
    }
}))(Chip);

const mockOptions: number[] = [0, 1, 2, 3];
const repositoryRootTypes: eSystemObjectType[] = [eSystemObjectType.eUnit, eSystemObjectType.eProject];

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

    let content: React.ReactNode = (
        <Box display='flex' alignItems='center'>
            <Box className={classes.textArea}>
                <Typography variant='body1'>Unit: All</Typography>
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
    );

    let expandIcon: React.ReactNode = (
        <FaChevronDown
            className={classes.anchor}
            size={15}
            color={palette.primary.main}
            onClick={toggleFilter}
        />
    );

    if (isExpanded) {
        content = (
            <React.Fragment>
                {content}
                <Box display='flex' flex={1} mt={2}>
                    <Box className={classes.selectContainer} width={300}>
                        <FilterSelect multiple label='Repository Root Type' name='repositoryRootType' options={repositoryRootTypes} />
                        <FilterSelect multiple label='Objects To Display' name='objectsToDisplay' options={mockOptions} />
                        <FilterSelect multiple label='Metadata To Display' name='metadataToDisplay' options={mockOptions} />
                    </Box>

                    <Box className={classes.selectContainer} width={225}>
                        <FilterSelect multiple label='Units' name='units' options={mockOptions} />
                        <FilterSelect multiple label='Projects' name='projects' options={mockOptions} />
                        <FilterSelect label='Has' name='has' options={mockOptions} />
                        <FilterSelect label='Missing' name='missing' options={mockOptions} />
                    </Box>

                    <Box>
                        <Box className={classes.selectContainer} width={280}>
                            <FilterSelect label='Capture Method' name='captureMethod' options={mockOptions} />
                            <FilterSelect label='Variant Type' name='variantType' options={mockOptions} />
                            <FilterSelect label='Model Purpose' name='modelPurpose' options={mockOptions} />
                            <FilterSelect label='Model File Type' name='modelFileType' options={mockOptions} />
                        </Box>
                        <FilterDate label='Date Created' name='dateCreated' />
                    </Box>
                </Box>
            </React.Fragment>
        );

        expandIcon = (
            <FaChevronUp
                className={classes.anchor}
                size={15}
                color={palette.primary.main}
                onClick={toggleFilter}
            />
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
                    {expandIcon}
                </Box>
            </Box>
        </Box>
    );
}

export default RepositoryFilterView;
