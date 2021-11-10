/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */

// This component is responsible for rendering the voyager story editor

import * as React from 'react';
import useScript from '../../../hooks/useScript';
import '../../../../../global/voyager-story.min.css';
import '../../../../../global/quill.snow.css';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'voyager-story': any;
        }
    }
}

type VoyagerStoryProps = {
    root: string;
    document: string;
    width?: string;
    height?: string;
    mode?: string;
};

function VoyagerStory(props: VoyagerStoryProps): React.ReactElement {
    const { root, document, width, height, mode } = props;

    useScript('https://code.jquery.com/pep/0.4.3/pep.min.js');
    useScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/104/three.min.js');
    useScript('https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.js');

    // this is the script required to run voyager-story component
    // useScript('https://3d-api.si.edu/resources/js/voyager-story.min.js');

    // Note that this script is in a location maintained by Andrew Gunther ...
    // Our non-prod builds should use a location that is accessible and updatable by our DEV team
    useScript('https://3d-api.si.edu/resources/js/voyager-story.dev.js');

    // NOTE:  root and document are *not* properties of voyager-story
    // Instead, they need to be present as arguments to the URL for the page
    // hosting this control
    return <voyager-story root={root} document={document} mode={mode} style={{ width: width || '300px', height: height || '300px', display: 'block', position: 'relative' }} />;
}

export default VoyagerStory;
