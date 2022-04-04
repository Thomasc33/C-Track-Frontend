import React, { useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
const settings = require('../settings.json')

function RepairLogPage(props) {
    // MSAL stuff
    const { instance, accounts } = useMsal()
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
    // Permission Check
    if (!props.permissions.use_importer && !props.isAdmin) return <Redirect to='/' />

    // States

    // Event Handlers

    // Renderers

    // Base JSX
    return (
        <>
            <h1>Page under construction</h1>
            <PageTemplate highLight='8' disableSearch {...props} />
        </>
    )
}

export default RepairLogPage
