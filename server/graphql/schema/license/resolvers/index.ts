import License from './types/License';
import LicenseAssignment from './types/LicenseAssignment';
import getLicense from './queries/getLicense';
import getLicenseList from './queries/getLicenseList';
import updateLicense from './mutations/updateLicense';
import createLicense from './mutations/createLicense';
import clearLicenseAssignment from './mutations/clearLicenseAssignment';
import assignLicense from './mutations/assignLicense';

const resolvers = {
    Query: {
        getLicense,
        getLicenseList
    },
    Mutation: {
        updateLicense,
        createLicense,
        clearLicenseAssignment,
        assignLicense
    },
    License,
    LicenseAssignment
};

export default resolvers;
