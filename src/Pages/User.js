import React from 'react';
import { Redirect } from 'react-router'
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API';
import Select from 'react-select';
import UserService from '../Services/User'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import '../css/Asset.css'
import '../css/User.css'
const settings = require('../settings.json')

function UserPage(props) {
    const { instance, accounts } = useMsal()
    let APILink = `${settings.APIBase}/user/`
    const { loading, data = [] } = useFetch(APILink.concat('all'), null)

    if (!props.permissions.view_users && !props.isAdmin) return <Redirect to='/' />

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

    const multiSelectOptions = []
    for (let i of Object.keys(props.permissions)) {
        if (i === 'id') continue
        multiSelectOptions.push({ value: i, label: i })
    }

    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({
            ...styles,
            backgroundColor: 'transparent',
            width
        }),
        menu: (provided, state) => ({
            ...provided,
            width: state.selectProps.width,
        }),
        noOptionsMessage: (styles) => ({
            ...styles,
            backgroundColor: '#1b1b1b'
        }),
        menuList: (styles) => ({
            ...styles,
            backgroundColor: '#1b1b1b'
        }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
            return {
                ...styles,
                backgroundColor: '#1b1b1b',
                color: 'white',
                ':active': {
                    ...styles[':active'],
                    backgroundColor: "purple",
                },
                ':hover': {
                    ...styles[':hover'],
                    backgroundColor: 'purple'
                }
            };
        },
        multiValue: (styles, { data }) => {
            return {
                ...styles,
                backgroundColor: 'purple',
            };
        },
        multiValueLabel: (styles, { data }) => ({
            ...styles,
            color: data.color,
        }),
        multiValueRemove: (styles, { data }) => ({
            ...styles,
            color: 'white',
            ':hover': {
                color: 'red',
            },
        }),

    }

    const handlePermissionChange = async (e, id) => {
        if (document.getElementById(`${id}-permselect`).classList.contains('invalid')) document.getElementById(`${id}-permselect`).classList.remove('invalid')
        let perms = []
        e.forEach(p => perms.push(p.value))
        let formData = { id, perms }
        let token = await getTokenSilently()
        let res = await UserService.updatePermissions(formData, token)
        if (res.isErrored) document.getElementById(`${id}-permselect`).classList.add('invalid')
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        let defaultOptions = []
        if (props.isAdmin || props.permissions.edit_users)
            for (let i of multiSelectOptions)
                if (row[i.value]) defaultOptions.push(i)
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`}>
            <td>
                <p>{row.name}</p>
            </td>
            <td>
                <p>{row.email}</p>
            </td>
            <td>
                <p>{row.title}</p>
            </td>
            {(props.isAdmin || props.permissions.edit_users) ?
                <td>
                    <div className='SelectWrapper' id={`${row.id}-permselect`}>
                        <Select
                            options={multiSelectOptions}
                            isMulti
                            width='33vw'
                            closeMenuOnSelect={false}
                            styles={selectStyles}
                            defaultValue={defaultOptions}
                            isSearchable
                            onChange={e => handlePermissionChange(e, row.id)}
                        />
                    </div>
                </td>
                : <></>}
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
                            <th>Email</th>
                            <th>Title</th>
                            {(props.isAdmin || props.permissions.edit_users) ? <th>Permissions</th> : <></>}
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

export default UserPage