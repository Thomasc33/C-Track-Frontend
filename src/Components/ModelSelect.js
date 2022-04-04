import React, { useEffect, useState } from 'react'
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import '../css/ModelSelect.css'
const settings = require('../settings.json')

const ModelSelect = props => {
    const { instance, accounts } = useMsal()
    const [models, setModels] = useState([])
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
    useEffect(() => {
        async function getModels() {
            if (models.length > 0) return
            let t = await getTokenSilently()
            const response = await fetch(`${settings.APIBase}/model/all`, {
                mode: 'cors',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Authorization': `Bearer ${t}`,
                    'X-Version': require('../backendVersion.json').version
                }
            });
            const data = await response.json();
            let model = []
            for (let i of data.models) {
                model.push({ name: i.name, value: i.model_number })
            }
            setModels(model)
        }
        getModels()
    }, [])
    return <div className='SelectContainer'><SelectSearch
        options={models}
        search
        placeholder="Model Number"
        filterOptions={fuzzySearch}
        className='model_select'
        autoComplete='on'
        id='model_select'
        onChange={e => props.setModelSelect(e)}
    /></div>
}

export default ModelSelect