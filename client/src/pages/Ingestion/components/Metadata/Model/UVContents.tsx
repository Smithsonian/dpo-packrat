/**
 * UVContents
 *
 * This component renders the uv map type selector for contents present in
 * the uploaded assets
 */
import { Box, MenuItem, Select, Typography } from '@material-ui/core';
import React from 'react';
import { AiFillFileImage } from 'react-icons/ai';
import { FieldType } from '../../../../../components';
import { StateUVMap, VocabularyOption } from '../../../../../store';
import { palette } from '../../../../../theme';
import { ViewableProps } from '../../../../../types/repository';
import { ContentHeader, EmptyContent, useStyles } from '../Photogrammetry/AssetContents';

interface UVContentsProps extends ViewableProps {
    initialEntry: number | null;
    uvMaps: StateUVMap[];
    options: VocabularyOption[];
    onUpdate: (id: number, mapType: number) => void;
}

function UVContents(props: UVContentsProps): React.ReactElement {
    const { uvMaps, options, initialEntry, onUpdate, viewMode = false, disabled = false } = props;

    return (
        <FieldType required renderLabel={false} marginTop={1.5} width={viewMode ? 'auto' : undefined}>
            <ContentHeader titles={['UV Map Name', 'Edge Length', 'UV Map Type']} />
            <Box display='flex' flex={1} flexDirection='column' mt={1}>
                <EmptyContent label='uv maps' isEmpty={!uvMaps.length} />
                {uvMaps.map(({ id, name, edgeLength, mapType }: StateUVMap, index: number) => {
                    const update = ({ target }) => onUpdate(id, target.value);

                    return (
                        <Content
                            key={index}
                            name={name}
                            disabled={disabled}
                            fieldName='uvMaps'
                            edgeLength={edgeLength}
                            value={mapType}
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

interface ContentProps {
    fieldName: string;
    value: number | null;
    name: string;
    edgeLength: number;
    initialEntry: number | null;
    options: VocabularyOption[];
    update: (event: React.ChangeEvent<{
        name?: string | undefined;
        value: unknown;
    }>) => void;
    disabled: boolean;
}

export function Content(props: ContentProps): React.ReactElement {
    const { fieldName, value, name, edgeLength, initialEntry, update, options, disabled } = props;
    const classes = useStyles();

    return (
        <Box display='flex' my={1} justifyContent='space-between'>
            <Box display='flex' flex={3} alignItems='center'>
                <Box>
                    <AiFillFileImage color={palette.primary.contrastText} size={24} />
                </Box>
                <Typography noWrap={false} className={classes.contentText} variant='caption'>{name}</Typography>
            </Box>
            <Box display='flex' flex={1} alignItems='center' justifyContent='flex-start'>
                <Typography className={classes.contentText} variant='caption'>{edgeLength}</Typography>
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

export default UVContents;
