/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DetailsTab
 *
 * This component renders details tab for the DetailsView component.
 */
import { Box, Tab, TabProps, Tabs } from '@material-ui/core';
import { fade, makeStyles, withStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { StateAssetDetail, StateRelatedObject } from '../../../../store';
import { RelatedObjectType } from '../../../../types/graphql';
import RelatedObjectsList from '../../../Ingestion/components/Metadata/Model/RelatedObjectsList';
import AssetDetailsTable from './AssetDetailsTable';

const useStyles = makeStyles(({ palette }) => ({
    tab: {
        backgroundColor: fade(palette.primary.main, 0.25)
    },
    tabpanel: {
        backgroundColor: fade(palette.primary.main, 0.25)
    }
}));

type DetailsTabParams = {
    disabled: boolean;
    assetDetails: StateAssetDetail[];
    sourceObjects: StateRelatedObject[];
    derivedObjects: StateRelatedObject[];
    onAddSourceObject: () => void;
    onAddDerivedObject: () => void;
};

function DetailsTab(props: DetailsTabParams): React.ReactElement {
    const { disabled, assetDetails, sourceObjects, derivedObjects, onAddSourceObject, onAddDerivedObject } = props;
    const [tab, setTab] = useState(0);
    const classes = useStyles();
    const handleTabChange = (_, nextTab: number) => {
        setTab(nextTab);
    };

    return (
        <Box display='flex' flex={1} flexDirection='column' mt={2}>
            <Tabs
                value={tab}
                classes={{ root: classes.tab }}
                indicatorColor='primary'
                textColor='primary'
                onChange={handleTabChange}
            >
                <StyledTab label='Asset' />
                <StyledTab label='Details' />
                <StyledTab label='Related' />
            </Tabs>
            <TabPanel value={tab} index={0}>
                <AssetDetailsTable assetDetails={assetDetails} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
                Details
            </TabPanel>
            <TabPanel value={tab} index={2}>
                <RelatedObjectsList
                    viewMode
                    disabled={disabled}
                    type={RelatedObjectType.Source}
                    relatedObjects={sourceObjects}
                    onAdd={onAddSourceObject}
                />
                <RelatedObjectsList
                    viewMode
                    disabled={disabled}
                    type={RelatedObjectType.Derived}
                    relatedObjects={derivedObjects}
                    onAdd={onAddDerivedObject}
                />
            </TabPanel>
        </Box>
    );
}

function TabPanel(props: any): React.ReactElement {
    const { children, value, index, ...rest } = props;
    const classes = useStyles();

    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            aria-labelledby={`tab-${index}`}
            {...rest}
        >
            {value === index && (
                <Box p={1} className={classes.tabpanel} minHeight='20vh' width='50vw'>
                    {children}
                </Box>
            )}
        </div>
    );
}

const StyledTab = withStyles(({ palette }) => ({
    root: {
        color: palette.background.paper,
        '&:focus': {
            opacity: 1
        },
    },
}))((props: TabProps) => <Tab disableRipple {...props} />);

export default DetailsTab;