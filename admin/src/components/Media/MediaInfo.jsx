import './MediaInfo.css';
import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../use-auth'
import { Skeleton } from 'primereact/skeleton';
import placeholder from './music_placeholder.png'

function DeleteButton({type, id, info}) {
    const auth = useAuth()
    const navigate = useNavigate()
    
    function deleteMedia() {
        fetch(`/api/media/${type}/${id}`, {
            method: 'DELETE'
        })
        .then(res => {
            if(res.status === 200)
                navigate(`/media/${type}`, {
                    state: {
                        deleted: id
                    }
                })
        })
    }

    async function deleteImage() {
        try {
            const res = await fetch(`https://api.imgur.com/3/image/${info.imgurId}`,
                {
                    method: 'DELETE',
                    headers: {'Authorization': `Bearer ${auth.user.imgur.access_token}`}
                }
            )
            
            return res.status
        }
        catch (err) {
            console.log(err)
            return 400
        }
    }

    async function handleDelete() {
        if(type === 'image') {
            const status = await deleteImage()

            if (status === 200) deleteMedia()
        }
        else deleteMedia()
    }

    return <Button className="p-button-danger" label='Xoá' onClick={handleDelete} />
}

function InfoField({label, children}) {
    return (
        <div className='media-info-detail-field'>
            <label className='media-info-detail-label' htmlFor='name'>{label}</label>
            {children}
        </div>
    )
}

function Info({info, type}) {
    const imageType = !info.url ? null : info.url.match(/(\.\w{3,4}$)/g);
    const imageThumbnail = !info ? null : `https://i.imgur.com/${info.imgurId}l${imageType}`;
    const size = !info ? null : `${(info.size / (1024*1024)).toFixed(2)} MB`
    const date = !info ? null : new Date(info.date).toLocaleDateString('vi-VN')
    const url = (info.url && type === 'image') ? info.url : `${window.location.origin}/${info.url}`
    
    
    return (
        <div className="grid media-info-container">
            <div className="media-info-preview col-8">
                {info.url ? <img src={type === 'image' ? imageThumbnail : placeholder} alt={info.name} /> : <Skeleton height='100%' />}
            </div>
            <div className="media-info-detail col-4">
                <InfoField label='Tên file'>
                    {info.name ?
                        <InputText id='name' className='media-info-detail-text' value={info.name} disabled /> 
                        : <Skeleton />
                    }
                </InfoField>
                <InfoField label='URL'>
                    {info.url ?
                        <div className="p-inputgroup">
                            <InputText className='media-info-detail-text' value={url} />
                            <Button icon="pi pi-copy" onClick={e => {navigator.clipboard.writeText(url)}} />
                        </div>
                        : <Skeleton />
                    }
                </InfoField>
                <InfoField label='Kích thước file'>
                    {info.size ? 
                        <InputText className='media-info-detail-text' value={size} disabled />
                        : <Skeleton />
                    }
                </InfoField>
                <InfoField label='Loại file'>
                    {info.type ?
                        <InputText className='media-info-detail-text' value={info.type} disabled />
                        : <Skeleton />
                    }
                </InfoField>
                <InfoField label='Ngày tải lên'>
                    {info.date ?
                        <InputText className='media-info-detail-text' value={date} disabled />
                        : <Skeleton />
                    }
                </InfoField>
            </div>
        </div>
    )
}

export const AdminMediaInfo = () => {
    const isMobile = useMediaQuery({maxWidth: '768px'})
    const navigate = useNavigate()
    const [info, setInfo] = useState({})
    const { type, id } = useParams()

    useEffect(() => {
        fetch(`/api/media/${type}/${id}`)
        .then(res => {
            if(res.status === 200) {
                res.json()
                .then(info => {
                    setInfo(info)
                })
            }
        })
        // eslint-disable-next-line
    }, [type, id])

    return (
        <Dialog className='media-info-panel' visible draggable={false} blockScroll
            onHide={e => navigate(`/media/${type}`)} header='Thông tin file' maximized={isMobile}
            footer={<DeleteButton type={type} id={id} info={info} />}
        >
            <Info info={info} type={type} />
        </Dialog>
    )
}