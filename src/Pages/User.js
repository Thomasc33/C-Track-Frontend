import React from 'react';
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API';
import Multiselect from 'multiselect-react-dropdown';
import '../css/Asset.css'
const settings = require('../settings.json')

function UserPage(props) {
    let APILink = `${settings.APIBase}/user/`
    const { loading, data = [] } = useFetch(APILink.concat('all'), null)
    const multiSelectOptions = []
    for (let i of Object.keys(props.permissions)) {
        multiSelectOptions.push({ name: i, id: i })
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        console.log(row)
        return (<tr id={`${row.id}-row`}>
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
                    <Multiselect
                        options={multiSelectOptions}
                        showCheckbox
                        placeholder='Permissions:'
                        displayValue='name'
                        style={{
                            multiselectContainer: {
                                borderColor: 'transparent'
                            }
                        }}
                        />
                </td>
                : <></>}
        </tr >)
    }
    console.log(props.permissions)


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='4' {...props} />
    else return (
        <>
            <div className='assetarea'>
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
            <PageTemplate highLight='4' {...props} />
        </>
    )
}

export default UserPage

/**
 * 
 * @param {Date} date 
 * @returns 
 */
function getDate(date) {
    date = new Date(date)
    return date.toISOString().split('T')[0]
}