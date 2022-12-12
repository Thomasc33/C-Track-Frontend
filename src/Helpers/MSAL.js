import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';

const useMSAL = () => {
    // MSAL stuff
    const { instance, accounts } = useMsal()
    async function getTokenSilently(forceRefresh = false) {
        const SilentRequest = { scopes: ['User.Read', 'TeamsActivity.Send', 'email'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh }
        let res = await instance.acquireTokenSilent(SilentRequest)
            .catch(async er => {
                if (er instanceof InteractionRequiredAuthError) {
                    return await instance.acquireTokenPopup(SilentRequest)
                } else {
                    console.log('Unable to get token')
                }
            })
        setResponse(res)
        if (!res || !res.accessToken) {
            if (forceRefresh) return null
            return getTokenSilently(true)
        }
        return res.accessToken
    }

    // States
    const [response, setResponse] = useState(null)
    const [token, setToken] = useState(null)
    const [tokenLoading, setLoading] = useState(true)

    // Effects
    useEffect(() => {
        // Get token initially
        getTokenSilently().then(t => { setToken(t); setLoading(false) })

        // Refresh token every minute
        let timeout = setInterval(() => getTokenSilently(true).then(t => { setToken(t); setLoading(false) }), 60000)
        return () => clearInterval(timeout)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Set token to refresh after the new token expires
    useEffect(() => {
        if (!response) return

        let expires = new Date(response.expiresOn)
        // execute getTokenSilently 5 minutes before the token expires
        let timeout = setTimeout(() => getTokenSilently(true).then(t => { setToken(t); setLoading(false) }), expires - new Date() - 300000)

        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response])

    return { token, instance, accounts, getTokenSilently, tokenLoading }
}

export { useMSAL }