import React, { useState } from 'react';
import { InView } from 'react-intersection-observer';
import StyledTreeItem from './StyledTreeItem';
import { TreeLabelEllipsis, TreeLabelLoading } from './TreeLabel';

interface InViewTreeItemProps {
    nodeId: string;
    triggerOnce: boolean;
    childNodesContent: React.ReactNode;
    icon: React.ReactNode;
    color: string;
    label: React.ReactNode;
    onView: () => Promise<void>;
    id: string;
}

function InViewTreeItem(props: InViewTreeItemProps): React.ReactElement {
    const { nodeId, triggerOnce, childNodesContent, icon, color, label, onView, id } = props;
    const [loading, setLoading] = useState(false);
    return (
        <InView
            triggerOnce={triggerOnce}
            onChange={async inView => {
                if (inView) {
                    setLoading(true);
                    await onView();
                    setLoading(false);
                }
            }}
        >
            {({ ref }) => {
                return (
                    <div ref={ref}>
                        <StyledTreeItem
                            id={id}
                            nodeId={nodeId}
                            color={color}
                            label={label}
                            icon={icon}
                        >
                            {childNodesContent}
                        </StyledTreeItem>
                        {loading ? <TreeLabelLoading /> : <TreeLabelEllipsis />}
                    </div>
                );
            }}
        </InView>
    );
}

export default InViewTreeItem;
