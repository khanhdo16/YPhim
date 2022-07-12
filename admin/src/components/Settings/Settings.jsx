import React, { useState, useEffect, useRef } from 'react'
import { InputText } from 'primereact/inputtext'
import { Panel } from 'primereact/panel'
import { Toast } from 'primereact/toast'
import { Button } from 'primereact/button'
import './Settings.css'
import { useAuth } from '../../use-auth'

export const AdminSettings = () => {
    const auth = useAuth();
    const [imgur, setImgur] = useState(auth.user.imgur);
    const [announcement, setAnnouncement] = useState('');
    const [facebook, setFacebook] = useState('');
    const toast = useRef();
    
    const authorizeImgur = () => {
        const data = new URLSearchParams({
            client_id: 'ec2d1ae1fe186d6',
            response_type: 'token',
            state: 'success'
        })

        const url = new URL('https://api.imgur.com/oauth2/authorize')
        url.search = data

        window.open(url, '_blank')
    }

    const getSavedAnnouncement = async () => {
        const res = await fetch('/api/settings/announcement');
        const { announcement } = res.status === 200 ? await res.json() : {}

        setAnnouncement(announcement || '');
    }

    const saveAnnouncement = () => {
        fetch('/api/settings/announcement', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({announcement: announcement})
        })
        .then(res => {
            if(res.status === 200) {
                toast.current.show({severity: 'success', summary: 'Thành công', detail: 'Cập nhật biểu ngữ thành công!'})
            }
            if(res.status === 400) {
                toast.current.show({severity: 'error', summary: 'Lỗi', detail: 'Cập nhật biểu ngữ không thành công!'})
            }
        })
    }

    const getSavedFacebook = async () => {
        const res = await fetch('/api/settings/facebook');
        const { facebook } = res.status === 200 ? await res.json() : {}

        setFacebook(facebook || '');
    }

    const saveFacebook = () => {
        fetch('/api/settings/facebook', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({facebook: facebook})
        })
        .then(res => {
            if(res.status === 200) {
                toast.current.show({severity: 'success', summary: 'Thành công', detail: 'Cập nhật thành công!'})
            }
            if(res.status === 400) {
                toast.current.show({severity: 'error', summary: 'Lỗi', detail: 'Cập nhật không thành công!'})
            }
        })
    }

    useEffect(() => {
        auth.getStatus()
        getSavedAnnouncement()
        getSavedFacebook()
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        setImgur(auth.user.imgur) // eslint-disable-next-line
    }, [auth.user])

    return (
        <>
        <Toast ref={toast} />
        <h1>Cài đặt</h1>
        <div className='admin-settings'>
            <Panel className='admin-imgur-panel' header='Imgur'>
                <div className='formgrid grid'>
                    <Field label='Access token' value={!imgur ? undefined : imgur.access_token} />
                    <Field label='Expires in' value={!imgur ? undefined : imgur.expires_in} />
                    <Field label='Refresh token' value={!imgur ? undefined : imgur.refresh_token} />
                    <Field label='Account username' value={!imgur ? undefined : imgur.account_username} />
                    <Field label='Account ID' value={!imgur ? undefined : imgur.account_id} />

                </div>
                <Button label='Lấy token' onClick={authorizeImgur} />
            </Panel>
            <Panel className='admin-announcement-panel' header='Biểu ngữ'>
                <div className='formgrid grid'>
                    <Field placeholder='Nội dung biểu ngữ' value={announcement} disabled={false}
                        onChange={e => setAnnouncement(e.target.value)} 
                    />
                </div>
                <Button label='Lưu' onClick={saveAnnouncement} />
            </Panel>
            <Panel className='admin-facebook-panel' header='Bài viết Facebook'>
                <div className='formgrid grid'>
                    <Field placeholder='https://www.facebook.com/yugeii/posts/125315349995535' value={facebook} disabled={false}
                        onChange={e => setFacebook(e.target.value)} 
                    />
                </div>
                <Button label='Lưu' onClick={saveFacebook} />
            </Panel>
        </div>
        </>
    )
}

function Field(props) {
    let { label, placeholder, disabled, ...textProps } = props;

    if(!placeholder) placeholder = '••••••••';
    if(disabled === undefined) disabled = true;

    return (
        <div className='field col'>
            {label ? <label className='block mb-2'>{label}</label> : undefined}
            <InputText className='block w-full' placeholder={placeholder} disabled={disabled} {...textProps} />
        </div>
    )
}