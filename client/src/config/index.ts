/**
 * Config
 *
 * Organize and export client config here by extending from .env
 */
const Config = {
    contact: {
        email: 'blundellj@si.edu'
    },
    voyager: {
        story: '', //TODO: set to appropriate link based on env
        explorer: '', //TODO: set to appropriate link based on env
        quill: '' //TODO: set to appropriate link based on env
    }
};

export default Config;
export * from './Selectors';
