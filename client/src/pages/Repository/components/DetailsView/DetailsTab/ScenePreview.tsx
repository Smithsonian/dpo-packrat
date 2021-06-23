/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */

// This component is responsible for rendering the voyager scene viewer

import * as React from 'react';
import useScript from '../../../hooks/useScript';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'voyager-explorer': any;
        }
    }
}

type ScenePreviewProps = {
    root: string;
    document: string;
    width?: string;
    height?: string;
};

function ScenePreview(props: ScenePreviewProps): React.ReactElement {
    const { root, document, width, height } = props;

    // this is the script required to run voyager-explorer component
    useScript('https://3d-api.si.edu/resources/js/voyager-explorer.min.js');

    return <voyager-explorer root={root} document={document} style={{ width: width || '300px', height: height || '300px', display: 'block', position: 'relative' }} />;
}

export default ScenePreview;
