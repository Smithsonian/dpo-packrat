// This hook is used for running additional scripts (e.g. voyager) and
// cleans up the script when unmounting the component

import { useEffect } from 'react';

function useScript(url: string): void {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [url]);
}

export default useScript;