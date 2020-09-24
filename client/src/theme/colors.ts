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
    },
    upload: {
        success: '#AFFFA9'
    },
    // Repository tree view colors [Dark variant, Light Variant]
    repository: {
        default: ['#e9f4fe', '#f4fafe'],
        unit: ['#e9f4fe', '#f4fafe'],
        project: ['#f0ebf8', '#f7f5fb'],
        subject: ['#fff9e6', '#fffcf3'],
        item: ['#ffe6de', '#ffeee9'],
        captureData: ['#edf7ed', '#f6fbf6']
    }
};

export enum RepositoryColorVariant {
    Dark,
    Light
}

export function colorWithOpacity(color: string, percentage: number): string {
    return `${color}${percentage}`;
}

export default Colors;
