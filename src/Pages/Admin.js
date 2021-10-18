import React from 'react';
import { Redirect } from 'react-router'
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API';
import UserService from '../Services/User'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import '../css/Asset.css'

const settings = require('../settings.json')

function AdminPage(props) {
    const { instance, accounts } = useMsal()
    let APILink = `${settings.APIBase}/user/`
    const { loading, data = [] } = useFetch(APILink.concat('all/admin'), null)

    if (!props.isAdmin) return <Redirect to='/' />

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

    const handlePermissionChange = async (e, id) => {
        let formData = { id, isAdmin: e ? 1 : 0 }
        let token = await getTokenSilently()
        let res = await UserService.setAdmin(formData, token)
        if (res.isErrored) {
            if (res.error.status === 401) alert('You cannot remove admin from yourself')
        }
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`}>
            <td>
                <p>{row.name}</p>
            </td>
            <td style={{ display: 'flex', justifyContent: "center" }}>
                <Checkbox
                    id={`${row.id}-isAdmin`}
                    className='isHourly'
                    checked={row.is_admin}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#c9c622'}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#c9c622'} size={36} />}
                    onChange={e => handlePermissionChange(e, row.id)} />
            </td>
        </tr >)
    }


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='7' {...props} />
    else return (
        <>
            <div className='AssetArea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Admin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.users ? data.users.map(m => RenderRow(m)) : <></>}
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='7' {...props} />
        </>
    )
}

export default AdminPage