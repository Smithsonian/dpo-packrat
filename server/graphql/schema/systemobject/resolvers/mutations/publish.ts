import { PublishResult, MutationPublishArgs } from '../../../../../types/graphql';
import { Parent } from '../../../../../types/resolvers';
import * as COL from '../../../../../collections/interface';

export default async function publish(_: Parent, args: MutationPublishArgs): Promise<PublishResult> {
    const {
        input: { idSystemObject, eState }
    } = args;

    const ICol: COL.ICollection = COL.CollectionFactory.getInstance();
    const success: boolean = await ICol.publish(idSystemObject, eState);
    return { success, message: success ? '' : 'Error encountered during publishing' };
}
