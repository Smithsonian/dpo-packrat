import License from './types/License';
import LicenseAssignment from './types/LicenseAssignment';
import getLicense from './queries/getLicense';
import getLicenseList from './queries/getLicenseList';
import updateLicense from './mutations/updateLicense';
import createLicense from './mutations/createLicense';

const resolvers = {
    Query: {
        getLicense,
        getLicenseList
    },
    Mutation: {
        updateLicense,
        createLicense
    },
    License,
    LicenseAssignment
};

export default resolvers;
