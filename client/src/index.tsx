/**
 * Packrat Client
 *
 * This is the root component of the client where we mount apollo, theme provider and
 * router.
 */
 import { ApolloProvider } from '@apollo/client';
 import { ThemeProvider } from '@material-ui/core';
 import React, { useCallback, useEffect, useState } from 'react';
 import { AliveScope } from 'react-activation';
 import ReactDOM from 'react-dom';
 import { Helmet } from 'react-helmet';
 import { BrowserRouter as Router, Routes } from 'react-router-dom';
 import { Slide, toast, ToastContainer } from 'react-toastify';
 import 'react-toastify/dist/ReactToastify.css';
 import { EnvBanner, ErrorBoundary, Loader, PrivateRoute, PublicRoute } from './components';
 import { ROUTES } from './constants';
 import './global/root.css';
 import { apolloClient } from './graphql';
 import { Home, Login } from './pages';
 import * as serviceWorker from './serviceWorker';
 import { useUserStore, useVocabularyStore, useLicenseStore, useUsersStore, useObjectMetadataStore } from './store';
 import theme from './theme';
 import { eVocabularySetID } from '@dpo-packrat/common';
 
 function AppRouter(): React.ReactElement {
     const [loading, setLoading] = useState(true);
     const initialize = useUserStore(state => state.initialize);
     const [updateVocabularyEntries, getEntries] = useVocabularyStore(state => [state.updateVocabularyEntries, state.getEntries]);
     const updateLicenseEntries = useLicenseStore(state => state.updateLicenseEntries);
     const updateUsersEntries = useUsersStore(state => state.updateUsersEntries);
     const initializeMdmEntries = useObjectMetadataStore(state => state.initializeMdmEntries);
 
     const initializeUser = useCallback(async () => {
         try {
             await initialize();
             await updateVocabularyEntries();
             await updateLicenseEntries();
             await updateUsersEntries();
             await initializeMdmEntries(getEntries(eVocabularySetID.eEdanMDMFields).map(entry => entry.Term));
             setLoading(false);
         } catch {
             toast.error('Cannot connect to the server, please try again later');
         }
     }, [initialize, updateVocabularyEntries, updateLicenseEntries, updateUsersEntries, initializeMdmEntries, getEntries]);
 
     useEffect(() => {
         initializeUser();
     }, [initializeUser]);
 
     let content: React.ReactNode = <Loader size={40} />;
 
     if (!loading) {
         content = (
             <ErrorBoundary>
                 <Routes>
                     <PublicRoute restricted path={ROUTES.LOGIN} component={Login} />
                     <PrivateRoute path={ROUTES.HOME}>
                         <AliveScope>
                             <Home />
                         </AliveScope>
                     </PrivateRoute>
                 </Routes>
             </ErrorBoundary>
         );
     }
 
     return <Router>{content}</Router>;
 }
 
 function App(): React.ReactElement {
     return (
         <ApolloProvider client={apolloClient}>
             <ThemeProvider theme={theme}>
                 <Helmet>
                     <title>Packrat</title>
                 </Helmet>
                 <AppRouter />
                 <ToastContainer
                     transition={Slide}
                     position='bottom-right'
                     autoClose={5000}
                     closeOnClick
                     pauseOnFocusLoss
                     draggable
                     pauseOnHover
                 />
                 <EnvBanner renderFor={['development']} />
             </ThemeProvider>
         </ApolloProvider>
     );
 }
 
 serviceWorker.unregister();
 ReactDOM.render(<App />, document.getElementById('root'));
 