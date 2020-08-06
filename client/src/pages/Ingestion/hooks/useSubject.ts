import { Subject, AppContext, IngestionDispatchAction, SUBJECT_ACTIONS } from '../../../context';
import { useContext } from 'react';
import lodash from 'lodash';
import { toast } from 'react-toastify';

interface UseSubject {
    addSubject: (subject: Subject) => void;
    removeSubject: (arkId: string) => void;
}

function useSubject(): UseSubject {
    const {
        ingestion: { subject },
        ingestionDispatch
    } = useContext(AppContext);

    const { subjects } = subject;

    const addSubject = (subject: Subject) => {
        const alreadyExists = !!lodash.find(subjects, { arkId: subject.arkId });

        if (!alreadyExists) {
            const addSubjectAction: IngestionDispatchAction = {
                type: SUBJECT_ACTIONS.ADD_SUBJECT,
                subject
            };

            ingestionDispatch(addSubjectAction);
        } else {
            toast.info(`Subject ${subject.name} has already been added`);
        }
    };

    const removeSubject = (arkId: string) => {
        const removeSubjectAction: IngestionDispatchAction = {
            type: SUBJECT_ACTIONS.REMOVE_SUBJECT,
            arkId
        };

        ingestionDispatch(removeSubjectAction);
    };

    return {
        addSubject,
        removeSubject
    };
}

export default useSubject;
