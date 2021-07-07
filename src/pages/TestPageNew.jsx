import React, { useCallback, useEffect, useState } from 'react'
import HttpApi from '../http/HttpApi'
import { RenderEngine } from '../tools/RenderEngine'
import { replaceSpecialChar2NChar } from '../tools/Tool'

/***
1，主票和包含的附页情况
[
    [{主page1},{主page2}],/// 主票页A3【数量2】
    [{附页page1}],/// 附页都是A4【数量X】
    [{附页page2}],
    [{附页page3}],
]
2，措施票和包含的检查卡情况
[
    [{措施page1},{措施page2}],/// 措施票页A4【数量1～2】
    [{检查卡page1}],/// 检查卡A4【数量X】
    [{检查卡page2}],
    [{检查卡page3}],
]
 * 
 * 
 * 
 */

var userList = []
const scale_value = 0.94
const scale_value2 = 0.75
export default function TestPageNew() {
  const [ticketValue, setTicketValue] = useState({})
  const [isA3, setIsA3] = useState(false)///是否A3样式 横版排布

  const removeAllDisabled = useCallback(pagelist => {
    // console.log('移除所有disable');
    pagelist.forEach(page => {
      const cpts = page.components
      cpts.forEach(cpt => {
        cpt.attribute.disabled = false
        if (cpt.type === 'select') {
          cpt.attribute.value = getUserNameById(cpt.attribute.value) ///人员选择器 id => name
        }
      })
    })
    return pagelist
  }, [])
  const init = useCallback(async ({ id, is_extra, is_checkcard }) => {
    // console.log('init参数  id, is_a3 :', { id, is_sub, is_extra })
    let user_list = await HttpApi.getAllUserlist()
    if (user_list.length > 0) {
      userList = user_list
    }
    let res = await HttpApi.getJBTRecord({ id })
    // let res2 = await HttpApi.getJBTApplyRecord({ id })
    if (res) {
      res.pages = JSON.parse(res.pages)
      res.pages = removeAllDisabled(res.pages)
      res.pages = replaceSpecialChar2NChar(res.pages)
      if (res.checkcard) {
        try {
          res.checkcard = JSON.parse(res.checkcard)
        } catch (error) {
          console.log('检查卡json格式有问题')
        }
      }
      let mainPage = []
      let extraPages = []
      res.pages.forEach(page => {
        if (page.is_extra) {
          extraPages.push(page)
        } else {
          mainPage.push(page)
        }
      })
      // console.log('mainPage:', mainPage)
      // console.log('extraPages:', extraPages);
      let ticketValue = { ...res }
      if (is_extra) {
        ticketValue.pages = extraPages
      } else if (is_checkcard) {
        ticketValue.pages = res.checkcard
      } else {
        ticketValue.pages = mainPage
      }
      // console.log('ticketValue:', ticketValue)
      // console.log('ticketValue:', ticketValue);
      setTicketValue(ticketValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const getRenderViewByList = useCallback(() => {
    ///暂时只支持，将两页横放，形成A3纸张尺寸。后期考虑大于2也的主票情况。要往下排列！！！！
    if (ticketValue.pages) {
      let scalObj = {}
      if (ticketValue.scal) {
        scalObj = JSON.parse(ticketValue.scal)
      }
      // console.log('缩放属性:', scalObj);
      return ticketValue.pages.map((_, index) => {
        // console.log('840 * scale_value:', 840 * scale_value)
        return (
          <div style={{ width: 840 * scale_value, height: 1188 * scale_value }}>
            <div style={{ transform: `scale(${ticketValue.scal ? scale_value2 : scale_value})` }}>
              <RenderEngine jsonlist={ticketValue} page={index} scaleNum={scalObj.scaleNum || 1} bgscaleNum={scalObj.bgscaleNum || 1} />
            </div>
          </div>
        )
      })
    }
  }, [ticketValue])

  useEffect(() => {
    const query = window.location.search.substring(1)
    const params = query.split('&')
    let id = null
    let is_sub = 0; ///是否为措施票
    let is_extra = 0; ///是否为附页
    let is_checkcard = 0; ///是否为检查卡
    for (var i = 0; i < params.length; i++) {
      const param = params[i].split('=')
      // console.log('param:', param);
      if (param[0] === 'id') id = parseInt(param[1])
      if (param[0] === 'is_sub') is_sub = parseInt(param[1])
      if (param[0] === 'is_extra') is_extra = parseInt(param[1])
      if (param[0] === 'is_checkcard') is_checkcard = parseInt(param[1])
    }
    let is_a3 = false;
    if (!is_sub && !is_extra) { is_a3 = true }
    // console.log('is_a3:', is_a3);
    setIsA3(is_a3)
    if (id) init({ id, is_sub, is_extra, is_checkcard })///获取壳发来的参数
    setTimeout(() => {
      window.print()
    }, 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <div style={{ ...styles.root, flexDirection: isA3 ? 'row' : 'column', marginTop: ticketValue.scal ? -190 : -40, }}>
    {getRenderViewByList()}
  </div>
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 1188 * scale_value
  }
}

function getUserNameById(userId) {
  let username = ''
  userList.forEach(item => {
    if (item.id === parseInt(userId)) {
      username = item.name
    }
  })
  return username
}
