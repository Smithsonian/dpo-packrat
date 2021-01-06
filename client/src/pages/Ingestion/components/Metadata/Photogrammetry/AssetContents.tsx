/**
 * AssetContents
 *
 * This component renders the folder type selector for contents present in
 * the uploaded assets
 */
import { Box, MenuItem, Select, Typography } from '@material-ui/core';
import { fade, makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { AiFillFolder } from 'react-icons/ai';
import { FieldType } from '../../../../../components';
import { StateFolder, VocabularyOption } from '../../../../../store';
import { palette } from '../../../../../theme';
import { ViewableProps } from '../../../../../types/repository';

export const useStyles = makeStyles(({ palette, typography, breakpoints, spacing }) => ({
    header: {
        display: 'flex',
        flex: 1,
        borderBottom: `1px solid ${palette.primary.contrastText}`,
        paddingBottom: 10
    },
    headerTitle: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: palette.primary.dark
    },
    emptyFolders: {
        margin: '10px 0px',
        color: palette.grey[600],
        textAlign: 'center'
    },
    contentText: {
        color: palette.primary.dark,
        margin: `0px ${spacing(1)}px`,
        wordBreak: 'break-word'
    },
    select: {
        height: 30,
        minWidth: 200,
        maxWidth: 200,
        padding: '0px 10px',
        background: palette.background.paper,
        border: `1px solid ${fade(palette.primary.contrastText, 0.4)}`,
        borderRadius: 5,
        fontFamily: typography.fontFamily,
        [breakpoints.down('lg')]: {
            fontSize: '0.8em',
            minWidth: 180,
            maxWidth: 180,
        }
    },
}));

interface AssetContentsProps extends ViewableProps {
    initialEntry: number | null;
    folders: StateFolder[];
    options: VocabularyOption[];
    onUpdate: (id: number, variantType: number) => void;
}

function AssetContents(props: AssetContentsProps): React.ReactElement {
    const { folders, options, initialEntry, onUpdate, viewMode = false, disabled = false } = props;

    return (
        <FieldType required renderLabel={false} marginTop={1.5} width={viewMode ? 'auto' : undefined}>
            <ContentHeader titles={['Folder Name', 'Variant Type']} />
            <Box display='flex' flex={1} flexDirection='column' mt={1}>
                <EmptyContent label='folders' isEmpty={!folders.length} />
                {folders.map(({ id, name, variantType }: StateFolder, index: number) => {
                    const update = ({ target }) => onUpdate(id, target.value);

                    return (
                        <Content
                            key={index}
                            name={name}
                            disabled={disabled}
                            fieldName='folders'
                            value={variantType}
                            icon={<AiFillFolder color={palette.primary.contrastText} size={24} />}
                            initialEntry={initialEntry}
                            options={options}
                            update={update}
                        />
                    );
                })}
            </Box>
        </FieldType>
    );
}

interface EmptyContentProps {
    isEmpty: boolean;
    label: string;
}

export function EmptyContent(props: EmptyContentProps): React.ReactElement {
    const { isEmpty, label } = props;
    const classes = useStyles();

    if (!isEmpty) {
        return <React.Fragment />;
    }

    return <Typography className={classes.emptyFolders} variant='caption'>No {label} detected</Typography>;
}

interface ContentHeaderProps {
    titles: string[];
}

export function ContentHeader(props: ContentHeaderProps): React.ReactElement {
    const { titles } = props;
    const classes = useStyles();

    return (
        <Box className={classes.header}>
            {titles.map((title: string, index: number) => (
                <Box key={index} className={classes.headerTitle}>
                    <Typography variant='body1'>{title}</Typography>
                </Box>
            ))}
        </Box>
    );
}

interface ContentProps {
    fieldName: string;
    value: number | null;
    name: string;
    icon: React.ReactNode;
    initialEntry: number | null;
    options: VocabularyOption[];
    update: (event: React.ChangeEvent<{
        name?: string | undefined;
        value: unknown;
    }>) => void;
    disabled: boolean;
}

function Content(props: ContentProps): React.ReactElement {
    const { fieldName, value, name, icon, initialEntry, update, options, disabled } = props;
    const classes = useStyles();

    return (
        <Box display='flex' my={1} justifyContent='space-between'>
            <Box display='flex' flex={1} alignItems='center'>
                <Box>
                    {icon}
                </Box>
                <Typography noWrap={false} className={classes.contentText} variant='caption'>{name}</Typography>
            </Box>
            <Box display='flex' alignItems='center' justifyContent='center'>
                <Select
                    disabled={disabled}
                    value={value || initialEntry}
                    className={classes.select}
                    name={fieldName}
                    onChange={update}
                    disableUnderline
                >
                    {options.map(({ idVocabulary, Term }, index) => <MenuItem key={index} value={idVocabulary}>{Term}</MenuItem>)}
                </Select>
            </Box>
        </Box>
    );
}

export default AssetContents;
