import React from 'react';
import { Navigate } from 'react-router-dom'
import { useFetch } from '../Helpers/API';
import { useMSAL } from '../Helpers/MSAL';
import Select from 'react-select';
import UserService from '../Services/User'

const settings = require('../settings.json')

function UserPage(props) {
    // Hooks and Constants
    const { token, tokenLoading } = useMSAL()
    const APILink = `${settings.APIBase}/user/`
    const { loading, data = [] } = useFetch(APILink.concat('all'), null)

    // Return to home page if user cannot access this page
    if (!props.permissions.view_users && !props.isAdmin) return <Navigate to='/' />

    // Gets an array of all permissions available
    const multiSelectOptions = []
    for (let i of Object.keys(props.permissions)) {
        if (i === 'id') continue
        multiSelectOptions.push({ value: i, label: i })
    }

    // Select Style for multi-select
    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({ ...styles, backgroundColor: 'transparent', width }),
        menu: (provided, state) => ({ ...provided, width: state.selectProps.width, }),
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        menuList: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => { return { ...styles, backgroundColor: '#1b1b1b', color: 'white', ':active': { ...styles[':active'], backgroundColor: localStorage.getItem('accentColor') || '#003994', }, ':hover': { ...styles[':hover'], backgroundColor: localStorage.getItem('accentColor') || '#003994' } }; },
        multiValue: (styles, { data }) => { return { ...styles, backgroundColor: localStorage.getItem('accentColor') || '#003994', }; },
        multiValueLabel: (styles, { data }) => ({ ...styles, color: data.color, }),
        multiValueRemove: (styles, { data }) => ({ ...styles, color: 'white', ':hover': { color: 'red', }, }),
    }

    // Handles the update of the user's permissions
    const handlePermissionChange = async (e, id) => {
        if (document.getElementById(`${id}-permselect`).classList.contains('invalid')) document.getElementById(`${id}-permselect`).classList.remove('invalid')
        let perms = []
        e.forEach(p => perms.push(p.value))
        let formData = { id, perms }
        let res = await UserService.updatePermissions(formData, token)
        if (res.isErrored) document.getElementById(`${id}-permselect`).classList.add('invalid')
    }

    // Handles the update of the user's title
    const handleTitleChange = async (e, id) => {
        if (!e.target || !e.target.value || e.target.value.length >= 50) return
        if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        let res = await UserService.setTitle({ id, title: e.target.value }, token)
        if (res.isErrored) e.target.classList.add('invalid')
    }

    // --- Render --- //
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
                {(props.isAdmin || props.permissions.edit_users) ? <input
                    defaultValue={row.title}
                    style={{ width: '11vw' }}
                    onBlur={e => { if (e.target.value !== row.title) handleTitleChange(e, row.id) }}
                /> : <p>{row.title}</p>}
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
                            menuPlacement='auto'
                        />
                    </div>
                </td>
                : <></>}
        </tr >)
    }


    // Returns blank page if data is loading
    if (loading || tokenLoading || !data) return <></>
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
        </>
    )
}

export default UserPage