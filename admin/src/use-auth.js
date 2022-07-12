import React, { useState, useContext, createContext } from "react"
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { AES, enc } from 'crypto-js'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const auth = useProvideAuth()

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    )

}

function useProvideAuth() {
    const myCookies = useCookies()
    const [user, setUser] = useState(myCookies.get())
    const navigate = useNavigate()


    const logout = () => {
        fetch('/api/logout').then(res => {
            if (res.status === 200) {
                myCookies.remove()
                setUser(null)
                navigate('/')
            }
        })
    }

    const getStatus = () => {
        fetch('/api/auth', { credentials: 'include' })
        .then(res => {
            if (res.status === 200) {
                res.json()
                .then(data => {
                    myCookies.set(data)
                    setUser(data)
                })
            }
            else {
                myCookies.remove()
                setUser(null)
            }
        })
    }

    return {
        user,
        getStatus,
        logout
    }
}

function useCookies() {
    const encryptKey = 'hM8^7nmAmjWV4HwSjU6!';

    return {
        set: (data) => {
            const encrypted = AES.encrypt(JSON.stringify(data), encryptKey)
            Cookies.set('user', encrypted, { expires: data.expires ? new Date(data.expires) : undefined })
        },
        get: () => {
            const encrypted = Cookies.get('user')

            if (encrypted) {
                const decrypted = AES.decrypt(encrypted, encryptKey).toString(enc.Utf8)
                return JSON.parse(decrypted)
            }

            return null
        },
        remove: () => {
            Cookies.remove('user')
            Cookies.remove('menu-state')
        }
    }
}