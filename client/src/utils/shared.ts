export const actionOnKeyPress = (key: string, actionKey: string, func: () => void): void => {
    if (key === actionKey) {
        func();
    }
};
