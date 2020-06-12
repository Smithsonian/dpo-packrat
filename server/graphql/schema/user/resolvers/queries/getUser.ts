import { User, GetUserResult, GetUserInput } from '../../../../../types/graphql';

type Args = { input: GetUserInput };

export default function getUser(_: unknown, args: Args): GetUserResult {
    const { input: { id } } = args;
    const user: User = {
        id,
        name: 'Packrat user',
        emailAddress: 'email@packrat.com',
        securityId: 'securityId',
        active: false,
        dateActivated: new Date(),
    };

    return { user };
}