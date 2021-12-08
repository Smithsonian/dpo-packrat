import { PublishResult, MutationPublishArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface';

export default async function publish(_: Parent, args: MutationPublishArgs): Promise<PublishResult> {
    const {
        input: { idSystemObject, eState }
    } = args;

    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    const success: boolean = await ICol.publish(idSystemObject, eState);
    if (success)
        return { success, eState };
    return { success, message: 'Error encountered during publishing' };
}
