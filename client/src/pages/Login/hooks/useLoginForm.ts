/**
 * Login Form Hook
 *
 * This hook provides easy validation and initial values for login form.
 */
import * as Yup from 'yup';

export interface ILoginForm {
    email: string;
    password: string;
}

const loginValidationSchema = () =>
    Yup.object({
        email: Yup.string().required('Required'),
        password: Yup.string().required('Required')
    });

const initialValues = {
    email: '',
    password: ''
};

interface UseLoginForm {
    initialValues: ILoginForm;
    loginValidationSchema: typeof loginValidationSchema;
}

function useLoginForm(): UseLoginForm {
    return {
        initialValues,
        loginValidationSchema
    };
}

export default useLoginForm;
