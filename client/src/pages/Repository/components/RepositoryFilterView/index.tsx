/* eslint-disable react/jsx-max-props-per-line */

/**
 * RepositoryFilterView
 *
 * This component renders repository filter view for the Repository UI.
 */
import { Box, Chip, Typography } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import React, { memo } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiLink2 } from 'react-icons/fi';
import { IoIosRemoveCircle } from 'react-icons/io';
import { toast } from 'react-toastify';
import { Loader } from '../../../../components';
import { useRepositoryStore, useVocabularyStore } from '../../../../store';
import { Colors, palette } from '../../../../theme';
import { useGetFilterViewDataQuery } from '../../../../types/graphql';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../utils/repository';
import FilterDate from './FilterDate';
import FilterSelect from './FilterSelect';
import { ChipOption, getRepositoryFilterOptions } from './RepositoryFilterOptions';

const useStyles = makeStyles(({ palette, typography, breakpoints }) => ({
    container: {
        display: 'flex',
        height: (isExpanded: boolean) => (isExpanded ? 235 : 35),
        background: palette.primary.light,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        transition: '250ms height ease',
        [breakpoints.down('lg')]: {
            height: (isExpanded: boolean) => (isExpanded ? 215 : 30)
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
            padding: '0px 5px'
        },
        '&:hover': {
            cursor: 'pointer',
            backgroundColor: fade(palette.primary.light, 0.2)
        }
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
        border: `0.5px solid ${palette.primary.contrastText}`,
        fontSize: '0.8em',
        cursor: 'pointer',
        gridColumn: '1 / 2'
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
        alignItems: (isExpanded: boolean) => (isExpanded ? 'flex-end' : 'center'),
        justifyContent: 'center',
        paddingBottom: 10
    },
    chipsContainer: {
        display: 'flex',
        alignItems: 'center',
        height: 30,
        padding: 1.5,
        overflow: 'hidden',
        width: '100%'
    },
    filterTypeAndChipsContainer: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        width: '100%',
        alignItems: 'center'
    }
}));

const StyledChip = withStyles(({ palette }) => ({
    outlined: {
        height: 30,
        fontSize: '0.75em',
        border: `0.5px solid ${palette.primary.contrastText}`
    }
}))(Chip);

function RepositoryFilterView(): React.ReactElement {
    const { data, loading } = useGetFilterViewDataQuery();
    const [units, projects, isExpanded, repositoryBrowserRootObjectType, repositoryBrowserRootName, repositoryRootType] = useRepositoryStore(state => [state.units, state.projects, state.isExpanded, state.repositoryBrowserRootObjectType, state.repositoryBrowserRootName, state.repositoryRootType]);
    const [toggleFilter, removeUnitsOrProjects] = useRepositoryStore(state => [state.toggleFilter, state.removeUnitsOrProjects]);
    const getEntries = useVocabularyStore(state => state.getEntries);
    const classes = useStyles(isExpanded);

    const {
        chipsOptions,
        unitsOptions,
        projectsOptions,
        repositoryRootTypesOptions,
        objectToDisplayOptions,
        metadataToDisplayOptions,
        captureMethodOptions,
        variantTypeOptions,
        modelPurposeOptions,
        fileTypeOptions,
        hasOptions,
        missingOptions
    } = getRepositoryFilterOptions({ data, units, projects, getEntries });

    const onCopyLink = (): void => {
        if ('clipboard' in navigator) {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link has been copied to your clipboard');
        }
    };

    let unrootedRepositoryType: string;
    if (!repositoryRootType.length) {
        unrootedRepositoryType = 'Unit';
    } else if (repositoryRootType.length === 1) {
        unrootedRepositoryType = getTermForSystemObjectType(repositoryRootType[0]);
    } else {
        unrootedRepositoryType = 'Multiple';
    }
    const typeName = repositoryBrowserRootObjectType ? `${repositoryBrowserRootObjectType}: ${repositoryBrowserRootName}` : `${unrootedRepositoryType}: All`;

    let content: React.ReactNode = (
        <Box className={classes.filterTypeAndChipsContainer}>
            <Box className={classes.textArea}>
                <Typography variant='body1'>{typeName}</Typography>
            </Box>

            <Box className={classes.chipsContainer}>
                {chipsOptions.map((chip: ChipOption, index: number) => {
                    const { id, type, name } = chip;
                    const label: string = `${getTermForSystemObjectType(type)}: ${name}`;

                    const onClick = () => {
                        window.open(getDetailsUrlForObject(id), '_blank');
                    };

                    return (
                        <StyledChip
                            key={index}
                            label={label}
                            size='small'
                            deleteIcon={<IoIosRemoveCircle color={palette.primary.contrastText} />}
                            className={classes.chip}
                            onClick={onClick}
                            onDelete={() => removeUnitsOrProjects(id, type)}
                            variant='outlined'
                        />
                    );
                })}
            </Box>
        </Box>
    );

    let expandIcon: React.ReactNode = <FaChevronDown className={classes.anchor} size={15} color={palette.primary.main} onClick={toggleFilter} />;

    if (isExpanded) {
        content = (
            <React.Fragment>
                {content}
                <Box display='flex' flexDirection='row' justifyContent='space-between'>
                    <Box display='flex' flex={1} mt={2}>
                        <Box className={classes.selectContainer} width={300}>
                            <FilterSelect multiple label='Top-Level Objects' name='repositoryRootType' options={repositoryRootTypesOptions} />
                            <FilterSelect multiple label='Children Objects' name='objectsToDisplay' options={objectToDisplayOptions} />
                            <FilterSelect multiple label='Metadata To Display' name='metadataToDisplay' options={metadataToDisplayOptions} />
                        </Box>

                        <Box className={classes.selectContainer} width={225}>
                            <FilterSelect multiple label='Units' name='units' options={unitsOptions} />
                            <FilterSelect multiple label='Projects' name='projects' options={projectsOptions} />
                            <FilterSelect multiple label='Has' name='has' options={hasOptions} />
                            <FilterSelect multiple label='Missing' name='missing' options={missingOptions} />
                        </Box>

                        <Box>
                            <Box className={classes.selectContainer} width={280}>
                                <FilterSelect multiple label='Capture Method' name='captureMethod' options={captureMethodOptions} />
                                <FilterSelect multiple label='Variant Type' name='variantType' options={variantTypeOptions} />
                                <FilterSelect multiple label='Model Purpose' name='modelPurpose' options={modelPurposeOptions} />
                                <FilterSelect multiple label='Model File Type' name='modelFileType' options={fileTypeOptions} />
                            </Box>
                            <FilterDate label='Date Created' name='dateCreated' />
                        </Box>
                    </Box>
                    <Box className={classes.selectContainer} style={{ alignSelf: 'end' }}>
                        <Box className={classes.options}>
                            <Box display='flex'>
                                <FiLink2 className={classes.anchor} color={palette.primary.main} size={20} onClick={onCopyLink} />
                                {expandIcon}
                            </Box>
                        </Box>
                    </Box>
                </Box>

            </React.Fragment>
        );

        expandIcon = <FaChevronUp className={classes.anchor} size={15} color={palette.primary.main} onClick={toggleFilter} />;
    }

    if (!data || loading) {
        content = <Loader maxWidth='100%' size={20} />;
    }

    return (
        <Box className={classes.container}>
            <Box className={classes.content}>{content}</Box>
        </Box>
    );
}

export default memo(RepositoryFilterView);
