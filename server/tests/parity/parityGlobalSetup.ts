import globalSetup from '../globalSetup';
import { BLESS_MODE, writeParityProvenance, checkParityProvenance } from './parityHarness';

// Global setup for the parity lane. Runs the shared suite setup (database preflight,
// assertion-gate reset) and then handles the provenance sidecar: a bless records
// where/from-what the baselines were captured; an assert verifies the current run is
// comparing like-for-like (code held constant) before any surface is diffed.
export default async function parityGlobalSetup(): Promise<void> {
    await globalSetup();
    if (BLESS_MODE)
        writeParityProvenance();
    else
        checkParityProvenance();
}
