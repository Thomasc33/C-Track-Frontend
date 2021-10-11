import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';

const useFetch = (url, timeout = 5000) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { instance, accounts } = useMsal()
    async function getTokenSilently() {
        const SilentRequest = { scopes: ['User.Read'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
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

    useEffect(() => {
        async function callFetch() {
            let t = await getTokenSilently()
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${t}`,
                    'Access-Control-Allow-Origin': '*'
                }
            }).catch(er => {
                return { isErrored: true, error: er.response }
            })
            if (response.isErrored) return console.log(response.error)
            const data = await response.json();
            setData(data);
            setLoading(false);
        }
        callFetch()
        if (timeout) setInterval(callFetch, timeout)
    }, [url, timeout])

    return { data, loading, setData, setLoading }
}

export {
    useFetch
}