import React from 'react';
import { Box, Checkbox, Typography } from '@material-ui/core';


interface SceneGenerateWorkflowControlProps {
    disabled: boolean;
    selected: boolean;
    setCheckboxField: ({ target }: { target: EventTarget }) => void;
}

function SceneGenerateWorkflowControl(props: SceneGenerateWorkflowControlProps): React.ReactElement {
    const { disabled, selected, setCheckboxField } = props;
    return (
        <Box style={{ display: 'flex', alignItems: 'center', width: 'fit-content', borderRadius: 5, backgroundColor: '#FFFCD1', outline: '1px solid rgba(141, 171, 196, 0.4)', paddingRight: '9px' }}>
            <Checkbox
                disabled={disabled}
                checked={!selected}
                onChange={setCheckboxField}
                title='skipSceneGenerate-input'
                size='small'
                color='primary'
                name='skipSceneGenerate'
            />
            <span>
                <Typography style={{ fontSize: '0.8rem' }}>Generate Voyager Scene</Typography>
                <em style={{ fontSize: '0.7rem', fontWeight: 300 }}>(X) To enable, <b>Units</b> must be set to mm, cm, m, in, ft, or yd, <b>Purpose</b> must be set to Master, and <b>Model File Type</b> must be set to obj, ply, stl, x3d, wrl, dae, or fbx</em>
            </span>
        </Box>
    );
}

export default SceneGenerateWorkflowControl;