/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */

// This component is responsible for rendering the voyager scene viewer

import * as React from 'react';
import Config from '../../../../../config';
import useScript from '../../../hooks/useScript';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'voyager-explorer': any;
        }
    }
}

type VoyagerExplorerProps = {
    root: string;
    document: string;
    width?: string;
    height?: string;
    id?: string;
};

function VoyagerExplorer(props: VoyagerExplorerProps): React.ReactElement {
    const { root, document, width, height } = props;

    // this is the script required to run voyager-explorer component
    useScript(Config.voyager.explorerJS);

    return <voyager-explorer id='Voyager-Explorer' root={root} document={document} style={{ width: width || '300px', height: height || '300px', display: 'block', position: 'relative' }} />;
}

export default VoyagerExplorer;
