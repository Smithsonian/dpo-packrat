/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable no-case-declarations */

/**
 * RepositoryFilterView
 *
 * This component renders repository filter view for the Repository UI.
 */
import { Box, Chip, Typography } from '@material-ui/core';
import { fade, makeStyles, withStyles, createStyles } from '@material-ui/core/styles';
import React, { memo, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiLink2 } from 'react-icons/fi';
import { IoIosRemoveCircle } from 'react-icons/io';
import { toast } from 'react-toastify';
import { Loader } from '../../../../components';
import { useRepositoryStore, useVocabularyStore } from '../../../../store';
import { Colors, palette } from '../../../../theme';
import { useGetFilterViewDataQuery } from '../../../../types/graphql';
import { eSystemObjectType, eVocabularySetID } from '@dpo-packrat/common';
import { getDetailsUrlForObject, getTermForSystemObjectType } from '../../../../utils/repository';
import FilterDate from './FilterDate';
import FilterSelect from './FilterSelect';
import { ChipOption, getRepositoryFilterOptions, eRepositoryChipFilterType, getTermForRepositoryFilterType } from './RepositoryFilterOptions';
import { extractISOMonthDateYear } from '../../../../constants';
import { HOME_ROUTES } from '../../../../constants';

const useStyles = makeStyles(({ palette, breakpoints }) => createStyles({
    container: {
        display: 'flex',
        background: palette.primary.light,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        transition: '250ms height ease',
        height: 'fit-content',
        maxWidth: 'fit-content',
        minWidth: 900
    },
    content: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    defaultFilter: {
        color: palette.primary.dark,
        fontWeight: 400
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
        fontWeight: 300
    },
    textArea: {
        width: 280,
        padding: '5px 8px',
        borderRadius: 5,
        color: palette.primary.dark,
        backgroundColor: Colors.defaults.white,
        border: `0.5px solid ${palette.primary.contrastText}`,
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
        alignItems: (isExpanded: boolean) => (isExpanded ? 'flex-end' : 'center'),
        justifyContent: 'center',
        paddingBottom: (isExpanded: boolean) => (isExpanded ? 10 : 0),
    },
    chipsContainer: {
        display: 'flex',
        alignItems: 'center',
        height: 'fit-content',
        flexWrap: 'wrap'
    }
}));

const StyledChip = withStyles(({ palette }) => ({
    outlined: {
        height: 30,
        fontSize: '0.75em',
        border: `0.5px solid ${palette.primary.contrastText}`,
        backgroundColor: '#FDF1AA'
    }
}))(Chip);

function RepositoryFilterView(): React.ReactElement {
    const { data, loading } = useGetFilterViewDataQuery();
    const [units, projects, has, missing, captureMethod, variantType, modelPurpose, modelFileType, dateCreatedFrom, dateCreatedTo, isExpanded, repositoryBrowserRootObjectType, repositoryBrowserRootName, repositoryRootType] = useRepositoryStore(state => [state.units, state.projects, state.has, state.missing, state.captureMethod, state.variantType, state.modelPurpose, state.modelFileType, state.dateCreatedFrom, state.dateCreatedTo, state.isExpanded, state.repositoryBrowserRootObjectType, state.repositoryBrowserRootName, state.repositoryRootType]);
    const [toggleFilter, removeChipOption, initializeFilterPosition] = useRepositoryStore(state => [state.toggleFilter, state.removeChipOption, state.initializeFilterPosition]);
    const [getEntries, getVocabularyTerm] = useVocabularyStore(state => [state.getEntries, state.getVocabularyTerm]);
    const classes = useStyles(isExpanded);
    const { href: url } = window.location;
    let isModal: boolean = false;
    if (url.includes('details') || url.includes(HOME_ROUTES.INGESTION))
        isModal = true;

    useEffect(() => {
        initializeFilterPosition();
    }, [initializeFilterPosition]);

    const convertToChipState = (filterName: eRepositoryChipFilterType, selected: eSystemObjectType[] | number[]): ChipOption[] => {
        switch (filterName) {
            case eRepositoryChipFilterType.eHas:
                const selectedHas = selected as eSystemObjectType[];
                return selectedHas.map((option: eSystemObjectType) => ({ name: getTermForSystemObjectType(option), id: option, type: eRepositoryChipFilterType.eHas }));
            case eRepositoryChipFilterType.eMissing:
                const selectedMissing = selected as eSystemObjectType[];
                return selectedMissing.map((option: eSystemObjectType) => ({ name: getTermForSystemObjectType(option), id: option, type: eRepositoryChipFilterType.eMissing }));
            case eRepositoryChipFilterType.eCaptureMethod:
                const selectedCaptureMethod = selected as number[];
                return selectedCaptureMethod.map((option: number) => ({ name: getVocabularyTerm(eVocabularySetID.eCaptureDataCaptureMethod, option) as string, id: option, type: eRepositoryChipFilterType.eCaptureMethod }));
            case eRepositoryChipFilterType.eVariantType:
                const selectedVariantType = selected as number[];
                return selectedVariantType.map((option: number) => ({ name: getVocabularyTerm(eVocabularySetID.eCaptureDataFileVariantType, option) as string, id: option, type: eRepositoryChipFilterType.eVariantType }));
            case eRepositoryChipFilterType.eModelPurpose:
                const selectedModelPurpose = selected as number[];
                return selectedModelPurpose.map((option: number) => ({ name: getVocabularyTerm(eVocabularySetID.eModelPurpose, option) as string, id: option, type: eRepositoryChipFilterType.eModelPurpose }));
            case eRepositoryChipFilterType.eModelFileType:
                const selectedModelFileType = selected as number[];
                return selectedModelFileType.map((option: number) => ({ name: getVocabularyTerm(eVocabularySetID.eModelFileType, option) as string, id: option, type: eRepositoryChipFilterType.eModelFileType }));
            default:
                return [];
        }
    };

    const hasChips = convertToChipState(eRepositoryChipFilterType.eHas, has);
    const missingChips = convertToChipState(eRepositoryChipFilterType.eMissing, missing);
    const captureMethodChips = convertToChipState(eRepositoryChipFilterType.eCaptureMethod, captureMethod);
    const variantTypeChips = convertToChipState(eRepositoryChipFilterType.eVariantType, variantType);
    const modelPurposeChips = convertToChipState(eRepositoryChipFilterType.eModelPurpose, modelPurpose);
    const modelFileTypeChips = convertToChipState(eRepositoryChipFilterType.eModelFileType, modelFileType);
    const dateFromChip = { name: extractISOMonthDateYear(dateCreatedFrom) as string, id: 0, type: eRepositoryChipFilterType.eDateCreatedFrom };
    const dateToChip = { name: extractISOMonthDateYear(dateCreatedTo) as string, id: 0, type: eRepositoryChipFilterType.eDateCreatedTo };


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

    const activeChips = [...chipsOptions, ...hasChips, ...missingChips, ...captureMethodChips, ...variantTypeChips, ...modelPurposeChips, ...modelFileTypeChips];
    if (dateCreatedFrom)
        activeChips.push(dateFromChip);
    if (dateCreatedTo)
        activeChips.push(dateToChip);

    let content: React.ReactNode = (
        <Box display='flex' alignItems='center'>
            <Box className={classes.textArea}>
                <Typography variant='body1'>{typeName}</Typography>
            </Box>

            <Box className={classes.chipsContainer}>
                {activeChips.map((chip: ChipOption, index: number) => {
                    const { id, type, name } = chip;
                    const label: string = `${getTermForRepositoryFilterType(type)}: ${name}`;

                    const onClick = () => {
                        window.open(getDetailsUrlForObject(id), '_blank');
                    };

                    // if it's not a project or unit (i.e. no idSystemObject), we don't want the link to work
                    return (type === eRepositoryChipFilterType.eProject || type === eRepositoryChipFilterType.eUnit) ? (
                        <StyledChip
                            key={index}
                            label={label}
                            size='small'
                            deleteIcon={<IoIosRemoveCircle color={palette.primary.contrastText} />}
                            className={classes.chip}
                            onClick={onClick}
                            onDelete={() => removeChipOption(id, type, isModal)}
                            variant='outlined'
                        />
                    ) : (
                        <StyledChip
                            key={index}
                            label={label}
                            size='small'
                            deleteIcon={<IoIosRemoveCircle color={palette.primary.contrastText} />}
                            className={classes.chip}
                            onDelete={() => removeChipOption(id, type, isModal)}
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

                    <Box width={345}>
                        <Box className={classes.selectContainer} width={280}>
                            <FilterSelect multiple label='Capture Method' name='captureMethod' options={captureMethodOptions} />
                            <FilterSelect multiple label='Variant Type' name='variantType' options={variantTypeOptions} />
                            <FilterSelect multiple label='Model Purpose' name='modelPurpose' options={modelPurposeOptions} />
                            <FilterSelect multiple label='Model File Type' name='modelFileType' options={fileTypeOptions} />
                        </Box>
                        <FilterDate label='Date Created' name='dateCreated' />
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
            <Box className={classes.options}>
                <Box display='flex'>
                    <FiLink2 className={classes.anchor} color={palette.primary.main} size={20} onClick={onCopyLink} />
                    {expandIcon}
                </Box>
            </Box>
        </Box>
    );
}

export default memo(RepositoryFilterView);