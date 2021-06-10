import React, { useCallback, useEffect, useState } from 'react'
import HttpApi from '../http/HttpApi'
import { RenderEngine } from '../tools/RenderEngine'

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
let allPages = []
const scale_value = 0.94
export default function TestPageNew() {
  const [ticketValue, setTicketValue] = useState({})

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
  const init = useCallback(async (id, print_num, print_card) => {
    console.log('init参数 id, print_num, print_card:', { id, print_num, print_card })
    print_num = parseInt(print_num)
    let user_list = await HttpApi.getAllUserlist()
    if (user_list.length > 0) {
      userList = user_list
    }
    let res = await HttpApi.getJBTRecord({ id })
    let res2 = await HttpApi.getJBTApplyRecord({ id })
    let is_sub = 0;///是否为措施票
    if (res2) {
      is_sub = res2.is_sub
    }
    // console.log('is_sub:', is_sub)
    if (res) {
      res.pages = JSON.parse(res.pages)
      res.pages = removeAllDisabled(res.pages)
      if (res.checkcard) {
        try {
          res.checkcard = JSON.parse(res.checkcard)
        } catch (error) {
          console.log('检查卡json格式有问题')
        }
      }
      let mainPages = []
      let mainPage = []
      let extraPages = []
      res.pages.forEach(page => {
        if (page.is_extra) {
          extraPages.push([page])
        } else {
          mainPage.push(page)
        }
      })
      mainPages.push(mainPage)
      allPages = mainPages.concat(extraPages)
      if (String(print_card) === 'true' && res.checkcard && res.checkcard.length > 0 && is_sub) { ///措施票 是否打印检查卡
        res.checkcard.forEach((item_card) => {
          allPages.push([item_card])
        })
      }
      // return;
      if (window.electron) {
        ///后续监听
        window.electron.ipcRenderer.on('message', (_, arg) => {
          if (arg === 'printSuccess') { ///接受到壳发来的printSuccess 说明上一个打印成功 接着打印下一个
            if (allPages.length > 0) {
              let newTicketValue = { ...res }
              newTicketValue.pages = allPages.shift()
              setTicketValue(newTicketValue)
              setTimeout(() => {
                ///默认A4竖版
                let message = {
                  content: 'print',
                  landscape: false,
                  copies: print_num || newTicketValue.print_num,
                  pageSize: 'A4'
                }
                if (newTicketValue.pages.length > 1 && is_sub === 0) {///主票 pages.length>1 主票的extra都是单一元素的数组。所以不会到这里
                  message.landscape = true
                  message.copies = print_num || newTicketValue.print_num
                  message.pageSize = 'A3'
                }
                console.log('后续打印返回给壳的message:', message)
                if (window.electron) window.electron.ipcRenderer.send('message', message)
              }, 1500)
            } else {
              setTimeout(() => {
                if (window.electron) window.electron.ipcRenderer.send('message', { content: 'printEnd' })
              }, 1500)
            }
          }
        })
      }
      ///第一次执行 壳请求print项目部署的地址。带参数
      let ticketValue = { ...res }
      ticketValue.pages = allPages.shift()
      setTicketValue(ticketValue)
      setTimeout(() => {
        ///默认A4竖版
        let message = {
          content: 'print',
          landscape: false,
          copies: print_num || ticketValue.print_num,
          pageSize: 'A4'
        }
        if (ticketValue.pages.length > 1 && is_sub === 0) {///如果当前记录是主票 那么就要判断pages.length>1 主票的extra都是单一元素的数组。所以不会到这里
          message.landscape = true
          message.copies = print_num || ticketValue.print_num
          message.pageSize = 'A3'
        }
        console.log('首次打印返回给壳的message:', message) ///{content: "print", landscape: true, copies: 1, pageSize: "A3"}
        if (window.electron) window.electron.ipcRenderer.send('message', message) ///打印成功再向壳返还发送 message
      }, 1500)
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
      // console.log('scalObj:', scalObj);
      return ticketValue.pages.map((_, index) => {
        return (
          <div style={ticketValue.scal ? {} : { width: 840 * scale_value, height: 1188 * scale_value }}>
            <div style={{ transform: `scale(${scale_value})` }}>
              <RenderEngine jsonlist={ticketValue} page={index} scaleNum={scalObj.scaleNum || 1} bgscaleNum={scalObj.bgscaleNum || 1} />
            </div>
          </div>
        )
      })
    }
  }, [ticketValue])

  useEffect(() => {
    console.log('useEffect')
    const query = window.location.search.substring(1)
    const params = query.split('&')
    let id = null
    let print_num = 1;
    let print_card = true;
    for (var i = 0; i < params.length; i++) {
      const param = params[i].split('=')
      if (param[0] === 'id') id = param[1]
      if (param[0] === 'print_num') print_num = param[1]
      if (param[0] === 'print_card') print_card = param[1]
    }
    if (id) init(id, print_num, print_card)///获取壳发来的参数
    // init(24, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <div style={{ ...styles.root, marginTop: ticketValue.scal ? 0 : -40 }}>{getRenderViewByList()}</div>
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
