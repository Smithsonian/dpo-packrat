/**
 * ToolTip
 *
 * This custom component is used in the MUI Tooltip component to allow for greater customization, such as line breaks.
 */
import React from 'react';

export interface ToolTipProps {
    text: string;
}

export function ToolTip(props: ToolTipProps): React.ReactElement {
    const { text } = props;
    const lines = text.split('\n');
    const content = lines.map((line, index) => {
        return (
            <span key={index} style={{ display: 'block' }}>
                {line}
            </span>
        );
    });
    return (
        <>
            {content}
        </>
    );
}
