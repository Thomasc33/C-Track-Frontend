/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/model/new`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.log(e.data); return { isErrored: true, error: e.data } })
        return res
    },
    edit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/model/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.log(e.response); return { isErrored: true, error: e.data } })
        return res
    }
}