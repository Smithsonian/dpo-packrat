type RequiredFieldValidator = {
    isValid: boolean;
    invalidField: string | null;
};

export function requiredFieldsValidator(fields: { [key: string]: string | number }): RequiredFieldValidator {
    let isValid: boolean = true;
    let invalidField: string | null = null;

    for (const field in fields) {
        if (!fields[field] || fields[field] === '') {
            isValid = false;
            invalidField = field;
            break;
        }
    }

    return {
        isValid,
        invalidField
    };
}
