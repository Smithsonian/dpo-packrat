/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */

/**
 * This component is responsible for rendering the voyager story editor
 * It cannot be used on the same page as voyager explorer. (deprecated)
**/

import * as React from 'react';
import useScript from '../../../hooks/useScript';
import useLink from '../../../hooks/useLink';
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

    useLink({ rel: 'stylesheet', href: Config.voyager.storyCSS });

    // Note that this script is in a location maintained by Andrew Gunther ...
    // Our non-prod builds should use a location that is accessible and updatable by our DEV team
    useScript(Config.voyager.storyJS);

    // NOTE:  root and document are *not* properties of voyager-story
    // Instead, they need to be present as arguments to the URL for the page
    // hosting this control
    return (
        <voyager-story
            id='Voyager-Story'
            root={root}
            document={encodeURIComponent(document)}
            mode={mode}
            style={{ width: width || '300px', height: height || '300px', display: 'block', position: 'relative' }}
        />
    );
}

export default VoyagerStory;
