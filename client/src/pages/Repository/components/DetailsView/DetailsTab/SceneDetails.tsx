/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SceneDetails
 *
 * This component renders details tab for Scene specific details used in DetailsTab component.
 */
import { Box, makeStyles, Tooltip } from '@material-ui/core';
import React, { useEffect, useRef } from 'react';
import { Loader } from '../../../../../components';
import { GetSceneDocument } from '../../../../../types/graphql';
import { DetailComponentProps } from './index';
import { apolloClient } from '../../../../../graphql/index';
import { ReadOnlyRow, CheckboxField, InputField, FieldType } from '../../../../../components/index';
import { useDetailTabStore } from '../../../../../store';
import { eSystemObjectType } from '@dpo-packrat/common';
import { isFieldUpdated } from '../../../../../utils/repository';
import { CheckboxNoPadding } from '../../../../../components/controls/CheckboxField';
import { getUpdatedCheckboxProps } from '../../../../../utils/repository';
import { withDefaultValueBoolean } from '../../../../../utils/shared';
import { HelpOutline } from '@material-ui/icons';

export const useStyles = makeStyles(({ palette }) => ({
    value: {
        fontSize: '0.8em',
        color: palette.primary.dark
    },
    container: {
        marginBottom: 10,
        width: '20%',
        minWidth: 'fit-content',
        '& > *': {
            minHeight: '22px',
            height: 'fit-content',
            '&:not(:last-child)': {
                borderBottom: '1px solid #D8E5EE'
            }
        },
        color: palette.primary.dark
    }
}));

function SceneDetails(props: DetailComponentProps): React.ReactElement {
    const classes = useStyles();
    const isMounted = useRef(false);
    const { data, loading, onUpdateDetail, objectType, subtitle, onSubtitleUpdate, originalSubtitle, publishedState } = props;
    const [SceneDetails, updateDetailField] = useDetailTabStore(state => [state.SceneDetails, state.updateDetailField]);
    const sceneData = data?.getDetailsTabDataForObject.Scene;

    useEffect(() => {
        const retrieveSceneData = async () => {
            if (data && !loading) {
                const { Scene } = data.getDetailsTabDataForObject;
                const {
                    data: { getScene }
                } = await apolloClient.query({
                    query: GetSceneDocument,
                    variables: {
                        input: {
                            idScene: Scene?.idScene
                        }
                    },
                    fetchPolicy: 'no-cache'
                });
                
                updateDetailField(eSystemObjectType.eScene, 'ModelSceneXref', getScene?.Scene?.ModelSceneXref);
                updateDetailField(eSystemObjectType.eScene, 'CountScene', getScene?.Scene?.CountScene);
                updateDetailField(eSystemObjectType.eScene, 'CountNode', getScene?.Scene?.CountNode);
                updateDetailField(eSystemObjectType.eScene, 'CountCamera', getScene?.Scene?.CountCamera);
                updateDetailField(eSystemObjectType.eScene, 'CountLight', getScene?.Scene?.CountLight);
                updateDetailField(eSystemObjectType.eScene, 'CountModel', getScene?.Scene?.CountModel);
                updateDetailField(eSystemObjectType.eScene, 'CountMeta', getScene?.Scene?.CountMeta);
                updateDetailField(eSystemObjectType.eScene, 'CountSetup', getScene?.Scene?.CountSetup);
                updateDetailField(eSystemObjectType.eScene, 'CountTour', getScene?.Scene?.CountTour);
                updateDetailField(eSystemObjectType.eScene, 'EdanUUID', getScene?.Scene?.EdanUUID);
                updateDetailField(eSystemObjectType.eScene, 'Links', getScene?.Scene?.Links);
                isMounted.current = true;
            }
        };

        retrieveSceneData();
        console.log(data,props,publishedState);
    }, []);

    useEffect(() => {
        if (isMounted.current) onUpdateDetail(objectType, SceneDetails);
    }, [SceneDetails]);

    if (!data || loading) {
        return <Loader minHeight='15vh' />;
    }

    const setCheckboxField = ({ target }): void => {
        const { name, checked } = target;
        updateDetailField(eSystemObjectType.eScene, name, checked);
    };

    const getLinkURL = (linkType: string): string | null => {
        const links: string[] = sceneData?.Links ?? [];
        if(links.length===0 || publishedState.toLowerCase()==='not published')
            return null;

        // get our urls that are of the desired type
        const url = links
            .map(item => {
                const [type, url] = item.split("|", 2);
                return { type, url };
            })
            .filter(entry => entry.type === 'scene_'+linkType)
            .map(entry => entry.url);

        return url[0] ?? null;
    };

    const readOnlyContainerProps: React.CSSProperties = {
        height: 22,
        alignItems: 'center'
    };
    const publishedUrl = getLinkURL('published');

    return (
        <Box display='flex' flexDirection='row'>
            <Box display='flex' flexDirection='column' className={classes.container}>
                <InputField
                    value={subtitle}
                    onChange={onSubtitleUpdate}
                    label='Subtitle'
                    name='Subtitle'
                    required
                    padding='3px 10px 1px 10px'
                    containerStyle={{ borderTopLeftRadius: '5px', borderTopRightRadius: '5px', paddingTop: '4px' }}
                    updated={subtitle !== originalSubtitle}
                />
                <CheckboxField
                    label='Approved for Publication'
                    name='ApprovedForPublication'
                    value={SceneDetails.ApprovedForPublication}
                    onChange={setCheckboxField}
                    required
                    padding='1px 10px'
                    containerStyle={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                    updated={isFieldUpdated(SceneDetails, sceneData,'ApprovedForPublication')}
                />
                <FieldType
                    required
                    label="Posed and QC'd"
                    direction='row'
                    containerProps={{ alignItems: 'center', justifyContent: 'space-between', style: { borderRadius: 0 } }}
                    padding='1px 10px'
                >
                    <div style={{ display: 'flex' }}>
                        <Tooltip title='When checked, downloads will be generated if this scene has a master model as a parent, as well as every time the scene is re-posed. This item is disabled if the scene is missing thumbnails (either in the svx.json or among its ingested assets)' placement='left'>
                            <HelpOutline
                                style={{ alignSelf: 'center', cursor: 'pointer', fontSize: '18px' }}
                            />
                        </Tooltip>
                        <CheckboxNoPadding
                            name='PosedAndQCd'
                            disabled={!SceneDetails.CanBeQCd}
                            checked={withDefaultValueBoolean(SceneDetails.PosedAndQCd, false)}
                            onChange={setCheckboxField}
                            {...getUpdatedCheckboxProps(isFieldUpdated(SceneDetails, sceneData,'PosedAndQCd'))}
                            size='small'
                        />
                    </div>
                </FieldType>
                <ReadOnlyRow
                    label='EDAN UUID'
                    value={SceneDetails.EdanUUID}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Scene Count'
                    value={SceneDetails.CountScene}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Node Count'
                    value={SceneDetails.CountNode}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Camera Count'
                    value={SceneDetails.CountCamera}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Light Count'
                    value={SceneDetails.CountLight}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Model Count'
                    value={SceneDetails.CountModel}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Meta Count'
                    value={SceneDetails.CountMeta}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Setup Count'
                    value={SceneDetails.CountSetup}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
                <ReadOnlyRow
                    label='Tour Count'
                    value={SceneDetails.CountTour}
                    paddingString='1px 10px'
                    padding={10}
                    containerStyle={{ borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px', paddingBottom: '5px', ...readOnlyContainerProps }}
                />
            </Box>
            <Box display='flex' flexDirection='column' className={classes.container} style={{ marginLeft: '5rem' }}>
                <ReadOnlyRow
                    label='Published URL'
                    {...(publishedUrl
                        ? { linkLabel: publishedUrl, value: publishedUrl }
                        : { value: 'None' }
                    )}
                    padding={10}
                    paddingString='1px 10px'
                    containerStyle={readOnlyContainerProps}
                />
            </Box>
        </Box>
    );
}

export default SceneDetails;
