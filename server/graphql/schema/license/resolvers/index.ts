import License from './types/License';
import LicenseAssignment from './types/LicenseAssignment';
import getLicense from './queries/getLicense';

const resolvers = {
    Query: {
        getLicense
    },
    License,
    LicenseAssignment
};

export default resolvers;
