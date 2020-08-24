import * as DBAPI from '../../../db';
import { Stakeholder as StakeholderBase } from '@prisma/client';

export async function createStakeholderTest(base: StakeholderBase): Promise<DBAPI.Stakeholder> {
    const stakeholder: DBAPI.Stakeholder = new DBAPI.Stakeholder(base);
    const created: boolean = await stakeholder.create();
    expect(created).toBeTruthy();
    expect(stakeholder.idStakeholder).toBeGreaterThan(0);
    return stakeholder;
}