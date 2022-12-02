import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';

const useMSAL = () => {
    // MSAL stuff
    const { instance, accounts } = useMsal()
    async function getTokenSilently() {
        const SilentRequest = { scopes: ['User.Read', 'TeamsActivity.Send'], account: instance.getAccountByLocalId(accounts[0].localAccountId) }//, forceRefresh: false }
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

    // States
    const [token, setToken] = useState(null)
    const [tokenLoading, setLoading] = useState(true)

    // Effects
    useEffect(() => {
        getTokenSilently().then(t => { setToken(t); setLoading(false) })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { token, instance, accounts, getTokenSilently, tokenLoading }
}

export { useMSAL }