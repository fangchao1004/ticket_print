import React, { useCallback, useEffect, useState } from 'react'
import HttpApi from '../http/HttpApi'
import { RenderEngine } from '../tools/RenderEngine'

var userList = [];
const scale_value = 1
export default function TestPage() {
    const [ticketValue, setTicketValue] = useState({})
    const removeAllDisabled = useCallback((pagelist) => {
        // console.log('移除所有disable');
        pagelist.forEach((page) => {
            const cpts = page.components;
            cpts.forEach((cpt) => {
                cpt.attribute.disabled = false
                if (cpt.type === 'select') {
                    cpt.attribute.value = getUserNameById(cpt.attribute.value)///人员选择器 id => name
                }
            })
        })
        return pagelist
    }, [])
    const init = useCallback(async (id) => {
        let user_list = await HttpApi.getAllUserlist();
        if (user_list.length > 0) {
            userList = user_list
        }
        let res = await HttpApi.getJBTRecord({ id })
        if (res) {
            res.pages = JSON.parse(res.pages)
            res.pages = removeAllDisabled(res.pages)
            setTicketValue(res)
        }
        setTimeout(() => {
            window.print()
        }, 1000);
    }, [removeAllDisabled])
    const getRenderViewByList = useCallback(() => {
        ///暂时只支持，将两页横放，形成A3纸张尺寸。后期考虑大于2也的主票情况。要往下排列！！！！
        if (ticketValue.pages) {
            // let scalObj = {}
            // if (ticketValue.scal) {
            //     scalObj = JSON.parse(ticketValue.scal)
            // }
            // console.log('scalObj:', scalObj);
            return ticketValue.pages.map((_, index) => {
                return <div style={{ width: 840 * scale_value, height: 1188 * scale_value }}>
                    <div style={{ transform: `scale(${scale_value})` }}>
                        <RenderEngine
                            jsonlist={ticketValue}
                            page={index}
                        />
                    </div>
                </div>
            })
        }
    }, [ticketValue])
    useEffect(() => {
        console.log('useEffect');
        const query = window.location.search.substring(1)
        const params = query.split('&')
        let id = null
        for (var i = 0; i < params.length; i++) {
            const param = params[i].split('=')
            if (param[0] === 'id') id = param[1]
        }
        if (id) init(id)
        // init(96)///测试
        // init(95)///sub
    }, [init])
    return (
        <div style={styles.root}>
            {getRenderViewByList()}
        </div>
    )
}

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        height: 1188 * scale_value,
        marginTop: -40,
    },
}

function getUserNameById(userId) {
    let username = ''
    userList.forEach((item) => {
        if (item.id === parseInt(userId)) {
            username = item.name
        }
    })
    return username
}
