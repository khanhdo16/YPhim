import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card } from 'primereact/card'
import { ProgressSpinner } from 'primereact/progressspinner'
import './Auth.css'

export const AuthImgur = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [imgurState, setImgurState] = useState((getParams('?') && getParams('?').state === 'success'))

    function getParams(type) {
        const params = {}

        if((type === '#' && location.hash) || (type === '?' && location.search)) {
            let paramString = type === '?' ? location.search : location.hash
            paramString = paramString.replace(type, '')
            paramString = paramString.split('&')

            paramString.forEach(param => {
                const [key, value] = param.split('=')
                params[key] = value
            })

            return params
        }

        return null
    }

    useEffect(() => {
        const success = getParams('?') && getParams('?').state === 'success'

        if(success && getParams('#')) {
            fetch('/api/auth/imgur', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(getParams('#'))
            })
            .then(res => {
                if(res.status !== 200) {
                    setImgurState(null)
                }
            })
        }
        
        setTimeout(() => {
            navigate('/settings')
        }, 3000)
    })

    return (
        <div className='admin-auth-msg-container'>
            <Card>
                <ProgressSpinner strokeWidth="4" fill="#EEEEEE" />
                {imgurState
                    ? <h3>Authenticated successfully</h3>
                    : <h3>Authenticated failed, please try again later</h3>
                }
            </Card>
        </div>
    )
}