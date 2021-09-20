/* eslint-disable no-unreachable */
import React from 'react';
import {
  Switch,
  Route,
  BrowserRouter
} from "react-router-dom";
import HomePage from './Pages/Home';
import AssetPage from './Pages/Asset';
import LoginPage from './Pages/Login';
import { useIsAuthenticated } from '@azure/msal-react';
import './App.css';

function App() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/asset" render={props => <AssetPage {...props} />} />
        <Route exact path="/hourly" render={props => <HomePage {...props} />} />
        <Route exact path="/login" render={props => <HomePage {...props} />} />
        <Route exact path="/logout" render={props => <HomePage {...props} />} />
        <Route exact path="/admin" render={props => <HomePage {...props} />} />
        <Route exact path="/importer" render={props => <HomePage {...props} />} />
        <Route exact path="/tools" render={props => <HomePage {...props} />} />
        <Route exact path="/reports" render={props => <HomePage {...props} />} />
        <Route exact path="/daily" render={props => <HomePage {...props} />} />
        <Route exact path="/" render={props => <HomePage {...props} />} />
      </Switch>
    </BrowserRouter>
  )
  else return (
    <LoginPage />
  )
}

export default App;
