import React, { useState, useContext, createContext} from 'react'
import { useMediaQuery } from 'react-responsive';
import Cookies from 'js-cookie'

const menuContext = createContext()

export const useMenu = () => {
    return useContext(menuContext)
}

export const ProvideMenu = ({children}) => {
    const menu = useProvideMenu()

    return <menuContext.Provider value={menu}>
        {children}
    </menuContext.Provider>
}

const useProvideMenu = () => {
    const cookie = getMenuState()
    const isDesktop = useMediaQuery({ minWidth: '1119.97px' })
    const [closed, setClosed] = useState(cookie != null ? cookie : !isDesktop)

    const setMenuState = (state) => {
        Cookies.set('menu-state', state, { expires: 7 })
        setClosed(state)
    }

    return {
        closed,
        setClosed: setMenuState
    }
}

function getMenuState() {
    const state = Cookies.get('menu-state')

    if (state === 'true') return true
    if (state === 'false') return false
    return null
}