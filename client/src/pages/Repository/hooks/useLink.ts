// This hook is used for running additional link (e.g. voyager) and
// cleans up the link when unmounting the component

import { useEffect } from 'react';

type useLinkProps = {
    rel: string;
    href: string;
};

function useLink(props: useLinkProps): void {
    const { rel, href } = props;
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;

        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, [rel, href]);
}

export default useLink;