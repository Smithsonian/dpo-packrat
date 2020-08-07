import { Subject, AppContext, IngestionDispatchAction, SUBJECT_ACTIONS, Item, Project } from '../../../context';
import { useContext } from 'react';
import lodash from 'lodash';
import { toast } from 'react-toastify';
import useItem from './useItem';
import useProject from './useProject';

interface UseSubject {
    addSubject: (subject: Subject) => void;
    removeSubject: (arkId: string) => void;
}

function useSubject(): UseSubject {
    const {
        ingestion: { subjects },
        ingestionDispatch
    } = useContext(AppContext);

    const { addItems } = useItem();
    const { addProjects } = useProject();

    const addSubject = (subject: Subject) => {
        const alreadyExists = !!lodash.find(subjects, { arkId: subject.arkId });

        if (!alreadyExists) {
            const addSubjectAction: IngestionDispatchAction = {
                type: SUBJECT_ACTIONS.ADD_SUBJECT,
                subject
            };

            ingestionDispatch(addSubjectAction);

            // TODO: fetch item for subject here
            const mockItem: Item = {
                id: String(1),
                name: 'Geonimo 238 Thorax',
                selected: false,
                fullSubject: false
            };

            addItems([mockItem]);

            // TODO: fetch project for subject here

            const mockProject: Project = {
                id: 1,
                name: 'Mammoth (NMNH)',
                selected: true
            };

            addProjects([mockProject]);
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
