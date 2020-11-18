/**
 * UVContents
 *
 * This component renders the uv map type selector for contents present in
 * the uploaded assets
 */
import { Box } from '@material-ui/core';
import React from 'react';
import { AiFillFileImage } from 'react-icons/ai';
import { FieldType } from '../../../../../components';
import { StateUVMap, VocabularyOption } from '../../../../../store';
import { palette } from '../../../../../theme';
import { Content, ContentHeader, EmptyContent } from '../Photogrammetry/AssetContents';

interface UVContentsProps {
    initialEntry: number | null;
    uvMaps: StateUVMap[];
    options: VocabularyOption[];
    onUpdate: (id: number, mapType: number) => void;
}

function UVContents(props: UVContentsProps): React.ReactElement {
    const { uvMaps, options, initialEntry, onUpdate } = props;

    return (
        <FieldType required renderLabel={false} marginTop={1.5}>
            <ContentHeader titles={['UV Map Name', 'UV Map Type']} />
            <Box display='flex' flex={1} flexDirection='column' mt={1}>
                <EmptyContent label='uv maps' isEmpty={!uvMaps.length} />
                {uvMaps.map(({ id, name, mapType }: StateUVMap, index: number) => {
                    const update = ({ target }) => onUpdate(id, target.value);

                    return (
                        <Content
                            key={index}
                            name={name}
                            fieldName='folders'
                            value={mapType}
                            icon={<AiFillFileImage color={palette.primary.contrastText} size={24} />}
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

export default UVContents;
