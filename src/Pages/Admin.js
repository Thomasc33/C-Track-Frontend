import React from 'react';
import { Navigate } from 'react-router-dom'
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

    if (!props.isAdmin) return <Navigate to='/' />

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

    const handlePermissionChange = async (e, id, className) => {
        let token = await getTokenSilently()
        let formData = { id, val: e ? 1 : 0 }
        let res
        switch (className) {
            case 'isAdmin':
                res = await UserService.setAdmin(formData, token)
                break;
            case 'isArchived':
                res = await UserService.setArchived(formData, token)
                break;
            default:
                return console.warn('hit default statement on admin page')
        }
        if (res.isErrored) {
            if (res.error.status === 401) alert('You cannot remove admin from or archive yourself')
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
            <td>
                <Checkbox
                    id={`${row.id}-isAdmin`}
                    className='isAdmin'
                    checked={row.is_admin}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={36} />}
                    onChange={e => handlePermissionChange(e, row.id, 'isAdmin')} />
            </td>
            <td>
                <Checkbox
                    id={`${row.id}-isArchived`}
                    className='isArchived'
                    checked={row.is_archived}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={36} />}
                    onChange={e => handlePermissionChange(e, row.id, 'isArchived')} />
            </td>
        </tr >)
    }


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='admin' {...props} />
    else return (
        <>
            <div className='AssetArea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Admin</th>
                            <th>Archive</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.users ? data.users.map(m => RenderRow(m)) : <></>}
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='admin' {...props} />
        </>
    )
}

export default AdminPage