/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async FormData => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/new`, FormData)
            .catch(e => { return { isErrored: true, error: e } })
        return res
    },
    edit: async FormData => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/edit`, FormData)
            .catch(e => { return { isErrored: true, error: e } })
        return res
    }
}