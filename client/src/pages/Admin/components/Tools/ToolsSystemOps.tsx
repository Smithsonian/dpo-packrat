import API, { RequestResponse } from '../../../../api';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@material-ui/core';
import { toast } from 'react-toastify';
import { useStyles as useToolsStyles } from '../shared/DataTypesStyles';

const ToolsSystemOps = (): React.ReactElement => {
    const classes = useToolsStyles();
    const [isIndexing, setIsIndexing] = useState<boolean>(false);

    const onSolrReindex = async () => {
        setIsIndexing(true);
        try {
            const response: RequestResponse = await API.solrReindex();
            if (response.success) {
                toast.success('Solr (Re)Index completed successfully.');
            } else {
                toast.error(`Solr (Re)Index failed. ${response.message ?? ''}`);
            }
        } catch (error) {
            console.error(`[Packrat:ERROR] Unexpected error during Solr reindex: ${error}`);
            toast.error('Solr (Re)Index failed due to an unexpected error.');
        } finally {
            setIsIndexing(false);
        }
    };

    return (
        <>
            <Box style={{ paddingLeft: '1rem' }}>
                <Typography variant='body2' gutterBottom>
                    System-level operations for managing Packrat services.
                </Typography>

                <Box style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <Button
                        className={isIndexing ? classes.btnDisabled : classes.btn}
                        onClick={onSolrReindex}
                        disableElevation
                        disabled={isIndexing}
                        style={{ width: 180, paddingLeft: '15px', paddingRight: '15px', textTransform: 'none' }}
                    >
                        {isIndexing ? 'Indexing...' : 'Solr (Re)Index'}
                    </Button>
                    <Typography variant='body2'>
                        Triggers a full Solr reindex of all Packrat objects. This process runs in the background and may take several minutes.
                    </Typography>
                </Box>
            </Box>
        </>
    );
};

export default ToolsSystemOps;
