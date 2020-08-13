import { loader } from 'graphql.macro';

const QUERY_GET_CURRENT_USER = loader('./getCurrentUser.graphql');
const QUERY_GET_UPLOADED_ASSET_VERSION = loader('./getUploadedAssetVersion.graphql');
const QUERY_GET_INGESTION_ITEMS_FOR_SUBJECT = loader('./getIngestionItemsForSubjects.graphql');
const QUERY_GET_INGESTION_PROJECTS_FOR_SUBJECT = loader('./getIngestionProjectsForSubjects.graphql');
const QUERY_SEARCH_INGESTION_SUBJECTS = loader('./searchIngestionSubjects.graphql');
const QUERY_GET_VOCABULARY_ENTRIES = loader('./getVocabularyEntries.graphql');

export {
    QUERY_GET_CURRENT_USER,
    QUERY_GET_UPLOADED_ASSET_VERSION,
    QUERY_GET_INGESTION_ITEMS_FOR_SUBJECT,
    QUERY_GET_INGESTION_PROJECTS_FOR_SUBJECT,
    QUERY_SEARCH_INGESTION_SUBJECTS,
    QUERY_GET_VOCABULARY_ENTRIES
};
