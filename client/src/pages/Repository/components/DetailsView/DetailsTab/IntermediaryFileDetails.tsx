/**
 * IntermediaryFileDetails
 *
 * This component renders details tab for IntermediaryFile specific details used in DetailsTab component.
 */
import React from 'react';
import { Loader } from '../../../../../components';
import { DetailComponentProps } from './index';

function IntermediaryFileDetails(props: DetailComponentProps): React.ReactElement {
    const { data, loading } = props;

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    return <div />;
}

export default IntermediaryFileDetails;