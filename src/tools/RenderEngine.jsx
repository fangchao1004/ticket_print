import React, { useCallback, useEffect, useState } from 'react'
import { Checkbox } from 'antd';
import moment from 'moment'
const testuri = 'http://60.174.196.158:12345/'///图片地址--暂时放60服务器
/**
 * datepicker => input 时 在引擎端手动加了3的top。因为在PC端填写时，为了页面布局用了datepicker组件。
 * 两者组件不一致。所以存在位置有部分偏移的情况。
 * 此种情况，目前只针对【热控】票的布局。后期适配其他表时，根据情况修改
 * */
export function RenderEngine({ jsonlist, page, scaleNum = 1, bgscaleNum = 1 }) {
    const [list, setList] = useState(jsonlist);
    const [currentPageIndex, setCurentPageIndex] = useState(page)///当前页面索引 0 为第一页
    const componentsRender = useCallback((item, index) => {
        if (!item) { return null }
        switch (item.type) {
            case 'input':
                return <input key={index} {...item.attribute} />
            case 'textarea':
                return <textarea key={index} {...item.attribute} />
            case 'daterange':
            case 'daterange1':
                if (!item.attribute.value) return null
                return <input key={index} {...item.attribute} style={{ ...item.attribute.style, height: 24, borderStyle: 'none', borderBottomStyle: 'solid', borderBottomWidth: 2, borderBlockColor: '#555555', backgroundColor: '#ffffff' }} value={item.attribute.value ? '从  ' + moment(item.attribute.value[0]).format('YYYY年MM月DD日 HH时mm分') + '  至  ' + moment(item.attribute.value[1]).format('YYYY年MM月DD日 HH时mm分') : ''} />
            case 'datepicker':
                if (!item.attribute.value) return null
                return <input key={index} {...item.attribute} style={{ ...item.attribute.style, borderStyle: 'none', borderBottomStyle: 'solid', borderBottomWidth: 2, borderBlockColor: '#555555', backgroundColor: '#ffffff', height: 18, top: item.attribute.style.top + 3 }} value={item.attribute.value ? moment(item.attribute.value).format('YYYY年MM月DD日 HH时mm分') : ''} />
            case 'datepicker1':
                if (!item.attribute.value) return null
                return <input key={index} {...item.attribute} style={{ ...item.attribute.style, borderStyle: 'none', backgroundColor: '#ffffff', height: 18, top: item.attribute.style.top + 3 }} value={item.attribute.value ? moment(item.attribute.value).format('YYYY年MM月DD日 HH时mm分') : ''} />
            case 'checkbox':
                if (!item.attribute.value) return null
                return <Checkbox key={index} {...item.attribute} checked={item.attribute.value}
                />
            case 'checkboxgroup':
                return <Checkbox.Group key={index} {...item.attribute} />
            case 'select':
                return <input key={index} {...item.attribute} style={{ ...item.attribute.style, borderStyle: 'none' }} />
            default:
                return null
        }
    }, [])
    const init = useCallback(async () => {
        setList(jsonlist)
        setCurentPageIndex(page)
    }, [jsonlist, page])
    useEffect(() => {
        init();
    }, [init])
    return <div
        style={{
            display: 'flex',
            alignItems: "center",
            justifyContent: 'center',
            backgroundColor: '#F1F2F5',
            flexDirection: 'column'
        }}>
        <div style={{
            height: 1188 * bgscaleNum,
            width: 840 * bgscaleNum,
            position: "relative",
            // backgroundColor: 'blue',
        }}>
            <img
                src={list.pages ? testuri + list.pages[currentPageIndex].background : ''}
                style={{
                    height: 1188 * bgscaleNum,
                    width: 840 * bgscaleNum,
                }}
                alt=''
            />
            {list.pages && list.pages[currentPageIndex].components ? list.pages[currentPageIndex].components.map((item, index) => {
                return componentsRender(item, index)
            }) : null}
        </div>
    </div>

}