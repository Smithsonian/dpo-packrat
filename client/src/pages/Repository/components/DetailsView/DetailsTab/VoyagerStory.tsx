/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */

// This component is responsible for rendering the voyager story editor

import * as React from 'react';
import useScript from '../../../hooks/useScript';
import '../../../../../global/quill.snow.css';
import useVoyagerStyling from '../../../hooks/useVoyagerStoryStyling';
import Config from '../../../../../config';

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
    id?: string;
};

function VoyagerStory(props: VoyagerStoryProps): React.ReactElement {
    const { root, document, width, height, mode } = props;


    useVoyagerStyling();
    // Note: This script is used to fetch styling. In future versions of voyager this script may not be necessary
    useScript(Config.voyager.quill);

    // Note that this script is in a location maintained by Andrew Gunther ...
    // Our non-prod builds should use a location that is accessible and updatable by our DEV team
    useScript(Config.voyager.story);

    // NOTE:  root and document are *not* properties of voyager-story
    // Instead, they need to be present as arguments to the URL for the page
    // hosting this control
    return (
        <voyager-story
            id='Voyager-Story'
            root={root}
            document={document}
            mode={mode}
            style={{ width: width || '300px', height: height || '300px', display: 'block', position: 'relative' }}
        />
    );
}

export default VoyagerStory;
