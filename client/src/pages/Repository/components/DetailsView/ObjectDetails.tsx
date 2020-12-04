/**
 * Object Details
 *
 * This component renders object details for the Repository Details UI.
 */
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { NewTabLink } from '../../../../components';
import { palette } from '../../../../theme';
import { RepositoryPath } from '../../../../types/graphql';
import { getDetailsUrlForObject } from '../../../../utils/repository';

const useStyles = makeStyles(({ palette, typography }) => ({
    detail: {
        display: 'flex',
        minHeight: 20,
        width: '100%',
        marginBottom: 8
    },
    label: {
        fontWeight: typography.fontWeightMedium
    },
    value: {
        color: ({ clickable = true }: DetailProps) => clickable ? palette.primary.main : palette.primary.dark,
        textDecoration: ({ clickable = true, value }: DetailProps) => clickable && value ? 'underline' : undefined
    },
}));

interface ObjectDetailsProps {
    name: string,
    unit?: RepositoryPath | null;
    project?: RepositoryPath | null;
    subject?: RepositoryPath | null;
    item?: RepositoryPath | null;
    disabled: boolean;
    publishedState: string;
    retired: boolean;
}

function ObjectDetails(props: ObjectDetailsProps): React.ReactElement {
    const { name, unit, project, subject, item, publishedState, retired, disabled } = props;

    const updateRetired = () => {
        if (disabled) return;
    };

    const retiredValueComponent = (
        <Box style={{ cursor: 'pointer' }}>
            {retired ? <MdCheckBox size={20} color={palette.primary.main} onClick={updateRetired} /> : <MdCheckBoxOutlineBlank size={20} color={palette.primary.dark} onClick={updateRetired} />}
        </Box>
    );

    return (
        <Box display='flex' flex={2} flexDirection='column'>
            <Detail label='Name' value={name} clickable={false} />
            <Detail idSystemObject={unit?.idSystemObject} label='Unit' value={unit?.name} />
            <Detail idSystemObject={project?.idSystemObject} label='Project' value={project?.name} />
            <Detail idSystemObject={subject?.idSystemObject} label='Subject' value={subject?.name} />
            <Detail idSystemObject={item?.idSystemObject} label='Item' value={item?.name} />
            <Detail label='Publication Status' value={publishedState} clickable={false} />
            <Detail label='Retired' valueComponent={retiredValueComponent} />
        </Box>
    );
}

interface DetailProps {
    idSystemObject?: number;
    label: string;
    value?: string;
    valueComponent?: React.ReactNode;
    clickable?: boolean;
}

function Detail(props: DetailProps): React.ReactElement {
    const { idSystemObject, label, value, valueComponent, clickable = true } = props;
    const classes = useStyles(props);

    let content: React.ReactNode = <Typography className={classes.value}>{value || '-'}</Typography>;

    if (clickable && idSystemObject) {
        content = (
            <NewTabLink to={getDetailsUrlForObject(idSystemObject)}>
                {content}
            </NewTabLink>
        );
    }

    return (
        <Box className={classes.detail}>
            <Box display='flex' flex={2}>
                <Typography className={classes.label}>{label}</Typography>
            </Box>
            <Box display='flex' flex={3}>
                {valueComponent || content}
            </Box>
        </Box>
    );
}

export default ObjectDetails;