/**
 * Object Details
 *
 * This component renders object details for the Repository Details UI.
 */
import { Box, Checkbox, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { NewTabLink } from '../../../../components';
import { GetSystemObjectDetailsResult, RepositoryPath } from '../../../../types/graphql';
import { getDetailsUrlForObject, getUpdatedCheckboxProps, isFieldUpdated } from '../../../../utils/repository';
import { withDefaultValueBoolean } from '../../../../utils/shared';

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
    unit?: RepositoryPath | null;
    project?: RepositoryPath | null;
    subject?: RepositoryPath | null;
    item?: RepositoryPath | null;
    disabled: boolean;
    publishedState: string;
    retired: boolean;
    originalFields: GetSystemObjectDetailsResult;
    onRetiredUpdate: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
}

function ObjectDetails(props: ObjectDetailsProps): React.ReactElement {
    const { unit, project, subject, item, publishedState, retired, disabled, originalFields, onRetiredUpdate } = props;

    const isRetiredUpdated: boolean = isFieldUpdated({ retired }, originalFields, 'retired');

    return (
        <Box display='flex' flex={2} flexDirection='column'>
            <Detail idSystemObject={unit?.idSystemObject} label='Unit' value={unit?.name} />
            <Detail idSystemObject={project?.idSystemObject} label='Project' value={project?.name} />
            <Detail idSystemObject={subject?.idSystemObject} label='Subject' value={subject?.name} />
            <Detail idSystemObject={item?.idSystemObject} label='Item' value={item?.name} />
            <Detail label='Publication Status' value={publishedState} clickable={false} />
            <Detail label='Retired' valueComponent={
                <Checkbox
                    name='retired'
                    disabled={disabled}
                    checked={withDefaultValueBoolean(retired, false)}
                    onChange={onRetiredUpdate}
                    {...getUpdatedCheckboxProps(isRetiredUpdated)}
                />}
            />

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