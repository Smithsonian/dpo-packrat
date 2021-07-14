/**
 * License Store
 *
 * This store manages state for licenses used in Admin view and Repository details view.
 */

import create, { GetState, SetState } from 'zustand';
import { apolloClient } from '../graphql';
import { GetLicenseListDocument, License } from '../types/graphql';

type LicenseStore = {
    licenses: Map<number, License>;
    updateLicenseEntries: () => Promise<void>;
    getEntries: () => License[];
    getInitialEntry: () => License | null;
    getLiceneEntry: (idLicense: number) => License | null;
};

export const useLicenseStore = create<LicenseStore>((set: SetState<LicenseStore>, get: GetState<LicenseStore>) => ({
    licenses: new Map<number, License>(),
    updateLicenseEntries: async (): Promise<void> => {
        const { data } = await apolloClient.query({
            query: GetLicenseListDocument,
            variables: {
                input: {
                    search: ''
                }
            }
        });
        const {
            getLicenseList: { Licenses }
        } = data;
        const licenseMap = new Map();
        Licenses.forEach(license => {
            licenseMap.set(license.idLicense, license);
        });
        set({ licenses: licenseMap });
        return;
    },
    getEntries: (): License[] => {
        const { licenses } = get();
        return Array.from(licenses.values());
    },
    getInitialEntry: (): License | null => {
        const { getEntries } = get();

        return getEntries()[0] || null;
    },
    getLiceneEntry: (idLicense: number): License | null => {
        const { licenses } = get();
        return licenses.get(idLicense) || null;
    }
}));
