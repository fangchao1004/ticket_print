import React, { useCallback, useEffect, useState } from 'react'
import HttpApi from '../http/HttpApi'
import { RenderEngine } from '../tools/RenderEngine'

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
  const init = useCallback(async id => {
    let user_list = await HttpApi.getAllUserlist()
    if (user_list.length > 0) {
      userList = user_list
    }
    let res = await HttpApi.getJBTRecord({ id })
    if (res) {
      res.pages = JSON.parse(res.pages)
      res.pages = removeAllDisabled(res.pages)
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

      if (window.electron) {
        window.electron.ipcRenderer.on('message', (_, arg) => {
          if (arg === 'printSuccess') {
            if (allPages.length > 0) {
              let newTicketValue = { ...res }
              newTicketValue.pages = allPages.shift()
              setTicketValue(newTicketValue)
              setTimeout(() => {
                let message = {
                  content: 'print',
                  landscape: false,
                  copies: newTicketValue.print_num || 1,
                  pageSize: 'A4'
                }

                if (newTicketValue.pages.length > 1) {
                  message.landscape = true
                  message.copies = newTicketValue.print_num || 1
                  message.pageSize = 'A4'
                }

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

      let ticketValue = { ...res }
      ticketValue.pages = allPages.shift()

      setTicketValue(ticketValue)
      setTimeout(() => {
        let message = {
          content: 'print',
          landscape: false,
          copies: ticketValue.print_num || 1,
          pageSize: 'A4'
        }

        if (ticketValue.pages.length > 1) {
          message.landscape = true
          message.copies = ticketValue.print_num || 1
          message.pageSize = 'A4'
        }

        if (window.electron) window.electron.ipcRenderer.send('message', message)
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
    for (var i = 0; i < params.length; i++) {
      const param = params[i].split('=')
      if (param[0] === 'id') id = param[1]
    }
    if (id) init(id)
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
