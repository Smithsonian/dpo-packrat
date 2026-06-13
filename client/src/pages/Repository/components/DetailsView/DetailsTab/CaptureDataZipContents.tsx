/**
 * CaptureDataZipContents
 *
 * Self-contained wrapper that resolves the latest ZIP AssetVersion attached
 * to a CaptureData SystemObject (via /api/capture-data/:idSystemObject/latest-zip)
 * and renders <ZipContentsView idAssetVersion={...} />. Renders nothing when
 * the CaptureData has no ZIP attached — typical for photogrammetry, expected
 * for brand-new records, and a no-op for any non-ZIP capture.
 *
 * Intended embed: directly under the Assets table on the CaptureData details
 * page so the user can browse a CT / MRI archive without leaving the page.
 */
import React, { useEffect, useState } from 'react';
import { Box } from '@material-ui/core';
import API from '../../../../../api';
import { ZipContentsView } from './ZipContentsView';

interface Props {
    idSystemObject: number;
}

export function CaptureDataZipContents({ idSystemObject }: Props): JSX.Element | null {
    const [idAssetVersion, setIdAssetVersion] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load(): Promise<void> {
            const result = await API.getCaptureDataLatestZip(idSystemObject);
            if (cancelled) return;
            if (result.success && result.data) {
                const data = result.data as { idAssetVersion: number | null };
                setIdAssetVersion(data.idAssetVersion);
            } else {
                setIdAssetVersion(null);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [idSystemObject]);

    if (idAssetVersion === null) return null;

    return (
        <Box mt={2}>
            <ZipContentsView idAssetVersion={idAssetVersion} />
        </Box>
    );
}

export default CaptureDataZipContents;
