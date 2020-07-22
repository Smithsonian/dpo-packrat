import { User } from '../../types/graphql';

type VerifiedUser = {
    user: User | null;
    error: string | null;
};

interface Auth {
    verifyUser: (email: string, password: string) => Promise<VerifiedUser>;
}

export { Auth, VerifiedUser };
