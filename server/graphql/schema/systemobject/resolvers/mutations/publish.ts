import { PublishResult, MutationPublishArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface';
import { Authorization, AUTH_ERROR } from '../../../../../auth/Authorization';

export default async function publish(_: Parent, args: MutationPublishArgs): Promise<PublishResult> {
    const {
        input: { idSystemObject, eState }
    } = args;

    // Authorization: check access to the target SystemObject (fail-closed)
    const ctx = Authorization.getContext();
    if (!ctx || !await Authorization.canAccessSystemObject(ctx, idSystemObject))
        return { success: false, message: AUTH_ERROR.ACCESS_DENIED };

    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    const success: boolean = await ICol.publish(idSystemObject, eState);
    if (success)
        return { success, eState };
    return { success, message: 'Error encountered during publishing' };
}
