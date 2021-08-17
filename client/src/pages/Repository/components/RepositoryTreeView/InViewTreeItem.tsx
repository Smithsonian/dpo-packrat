import React from 'react';
import { InView } from 'react-intersection-observer';
import StyledTreeItem from './StyledTreeItem';

interface InViewTreeItemProps {
    nodeId: string;
    triggerOnce: boolean;
    childNodesContent: React.ReactNode;
    icon: React.ReactNode;
    color: string;
    label: React.ReactNode;
    onView: () => Promise<void>;
}

function InViewTreeItem(props: InViewTreeItemProps): React.ReactElement {
    const { nodeId, triggerOnce, childNodesContent, icon, color, label, onView } = props;
    return (
        <InView
            triggerOnce={triggerOnce}
            onChange={inView => {
                if (inView) onView();
            }}
        >
            {({ ref }) => {
                return (
                    <div ref={ref}>
                        <StyledTreeItem nodeId={nodeId} color={color} label={label} icon={icon}>
                            {childNodesContent}
                        </StyledTreeItem>
                    </div>
                );
            }}
        </InView>
    );
}

export default InViewTreeItem;
