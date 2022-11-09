import React from 'react';
import { Navigate } from 'react-router-dom'
import { useFetch } from '../Helpers/API';
import { useMSAL } from '../Helpers/MSAL';
import UserService from '../Services/User'
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';

const settings = require('../settings.json')

function AdminPage(props) {
    // States and MSAL
    const { token } = useMSAL()
    let APILink = `${settings.APIBase}/user/`

    // My old way of getting API data, basically just a wrapper for useEffect and fetch
    const { loading, data = [] } = useFetch(APILink.concat('all/admin'), null)

    // Return to home page if the user cannot access this page
    if (!props.isAdmin) return <Navigate to='/' />

    // Functions
    const handlePermissionChange = async (e, id, className) => {
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


    // Renderers
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
                    borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={36} />}
                    onChange={e => handlePermissionChange(e, row.id, 'isAdmin')} />
            </td>
            <td>
                <Checkbox
                    id={`${row.id}-isArchived`}
                    className='isArchived'
                    checked={row.is_archived}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={36} />}
                    onChange={e => handlePermissionChange(e, row.id, 'isArchived')} />
            </td>
        </tr >)
    }


    // Returns blank page if data is loading, otherwise show page
    if (loading || !data || !token) return <></>
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
        </>
    )
}

export default AdminPage