const Colors = {
    defaults: {
        white: '#FFFFFF'
    },
    sidebarOptions: {
        dashboard: '#EEAF00',
        repository: '#AB7DF6',
        ingestion: '#FACA00',
        workflow: '#0093EE',
        reporting: '#81C926',
        admin: '#FD7B1F'
    }
};

export function colorWithOpacity(color: string, percentage: number): string {
    return `${color}${percentage}`;
}

export default Colors;
