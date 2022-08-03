/* eslint-disable no-unreachable */
import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Routes,
  Route,
} from "react-router-dom";

// Import Libraries
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import UserService from './Services/User'
import PageTemplate from './Components/Template';
import Particles from './Components/Particles';

// Import CSS files in main since lazy loading breaks styling otherwise
import './App.css';
import './css/Asset.css';
import './css/Assets.css';
import './css/Guide.css';
import './css/Home.css';
import './css/Hourly.css';
import './css/Importer.css';
import './css/Jobs.css';
import './css/Login.css';
import './css/Models.css';
import './css/ModelSelect.css';
import './css/Page-Template.css';
import './css/PartManagement.css';
import './css/Reports.css';
import './css/SingleAsset.css';
import './css/User.css';


// Import the Pages
// Using lazy loading to avoid loading the pages until they are needed
const AdminPage = lazy(() => import('./Pages/Admin'));
const AssetManagement = lazy(() => import('./Pages/AssetManagement'));
const AssetPage = lazy(() => import('./Pages/Asset'));
const AssetsPage = lazy(() => import('./Pages/AssetPage'));
const HomePage = lazy(() => import('./Pages/Home'));
const HourlyPage = lazy(() => import('./Pages/Hourly'));
const ImporterPage = lazy(() => import('./Pages/Importer'));
const JobPage = lazy(() => import('./Pages/Jobs'));
const LoginPage = lazy(() => import('./Pages/Login'));
const ModelPage = lazy(() => import('./Pages/Models'));
const ReportsPage = lazy(() => import('./Pages/Reports'));
const SingleAssetPage = lazy(() => import('./Pages/SingleAsset'));
const UserPage = lazy(() => import('./Pages/User'));
const GuidePage = lazy(() => import('./Pages/Guide'));
const PartCategoriesPage = lazy(() => import('./Pages/Part Types'));
const PartInventoryPage = lazy(() => import('./Pages/Part Inventory'));
const PartManagementPage = lazy(() => import('./Pages/Part Management'));
const RepairLogPage = lazy(() => import('./Pages/Repair Log'));

// Import App Settings
const settings = require('./settings.json')
require('./backendVersion.json') // Load this so no single lazy split will claim it when they all use it

function App(props) {
  // States and hooks
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal()
  const [isAuthed, setAuthed] = useState(localStorage.getItem('isVerified'))
  const [{ permissions, isAdmin, loading }, setState] = useState({
    permissions: null,
    isAdmin: null,
    loading: true
  })


  // Effects
  useEffect(() => {
    async function getTokenSilently() {
      const SilentRequest = { scopes: ['User.Read', 'TeamsActivity.Send'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
      let res = await instance.acquireTokenSilent(SilentRequest)
        .catch(async er => {
          if (er instanceof InteractionRequiredAuthError) {
            return await instance.acquireTokenPopup(SilentRequest)
          } else {
            console.log('Unable to get token')
          }
        })
      return res.accessToken
    }
    async function loadPermissions() {
      let t = await getTokenSilently()
      const response = await fetch(`${settings.APIBase}/user/permissions`, {
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${t}`,
          'Access-Control-Allow-Origin': '*',
          'X-Version': require('./backendVersion.json').version
        }
      });
      const data = await response.json();
      if (data.message === 'An upgrade is available. Please refresh the page.') alert(data.message)
      setLoginStatus(data.permissions, data.isAdmin ? true : false)
    }

    // If user is authenticated, get the user's permissions and admin status
    if (isAuthenticated) loadPermissions()
  }, [isAuthenticated, accounts, instance])

  // --- Functions --- //

  // Updates the state with user permissions, admin status, and set loading to false
  const setLoginStatus = (perm, admin) => setState({ permissions: perm, isAdmin: admin, loading: false })

  // Gets user's microsoft bearer token and verifies it with C-Track backend.
  async function validateUser() {
    // Get token
    const SilentRequest = { scopes: ['User.Read', 'TeamsActivity.Send'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
    let res = await instance.acquireTokenSilent(SilentRequest)
      .catch(async er => {
        if (er instanceof InteractionRequiredAuthError) {
          return await instance.acquireTokenPopup(SilentRequest)
        } else {
          console.log('Unable to get token')
          return { isErrored: true, err: er }
        }
      })
    if (res.isErrored) return console.log(res.err)

    // Check to see if user exists
    res = await UserService.verify(res.accessToken)
    // If user exists, it wont error
    if (res.isErrored) return console.log(res.err)
    else {
      // Set locastorage to verified, and update Authed state
      localStorage.setItem('isVerified', true)
      setAuthed(true)
    }
  }

  // If user isn't authenticated, validate them
  if (isAuthenticated && !isAuthed) validateUser()

  // If user is authenticated, and data is still loading, give the Routes
  if (isAuthenticated && !loading) return (
    <>
      <Particles {...props} permissions={permissions} color={localStorage.getItem('accentColor') || '#00c6fc'} />
      <PageTemplate {...props} permissions={permissions} isAdmin={isAdmin} />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route exact path="/asset" element={<AssetPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/assets" element={<AssetsPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/models" element={<ModelPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/hourly" element={<HourlyPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/admin" element={<AdminPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/adas" element={<AssetManagement {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/importer" element={<ImporterPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/tools" element={<HomePage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/reports" element={<ReportsPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/jobs" element={<JobPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/users" element={<UserPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/search" element={<SingleAssetPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/guide" element={<GuidePage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/repair" element={<RepairLogPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/inventory" element={<PartInventoryPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/parts" element={<PartManagementPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/parttypes" element={<PartCategoriesPage {...props} permissions={permissions} isAdmin={isAdmin} />} />
          <Route exact path="/" element={<HomePage {...props} permissions={permissions} isAdmin={isAdmin} />} />
        </Routes>
      </Suspense>
    </>
  )

  // If user isn't authenticated, redirect to login page
  if (!isAuthenticated) return (
    <LoginPage />
  )

  // If user is authenticated, but data is still loading, give the loading screen (blank particle screen)
  else return (
    <Particles color={localStorage.getItem('accentColor') || '#00c6fc'} />
  )
}

export default App;
