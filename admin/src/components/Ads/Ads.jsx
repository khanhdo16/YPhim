import React, { useState, useRef, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { Panel } from 'primereact/panel'
import { Toast } from 'primereact/toast'
import { Button } from 'primereact/button'
import './Ads.css'

export const AdminAds = () => {
    const adTemplate = {
        banner1: {
            image: '',
            url: ''
        },
        banner2: {
            image: '',
            url: ''
        },
        popup: {
            image: '',
            url: ''
        },
        aads1: '',
        aads2: '',
        aads3: '',
        other1: '',
        other2: '',
        other3: '',
    }
    const [ads, setAds] = useState(adTemplate);
    const toast = useRef()

    const bannerChange = (e) => {
        const { name: namefield, value } = e.target
        const [name, field] = namefield.split('.');

        setAds(prev => {
            return {
                ...prev,
                [name]: {
                    ...prev[name],
                    [field]: value
                }
            }
        })
    }

    const adsChange = (e) => {
        const { name, value } = e.target

        setAds(prev => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    const getSavedAds = async () => {
        const res = await fetch('/api/settings/ads');
        const ads = await res.json()

        setAds(ads || adTemplate);
    }

    const saveAds = () => {
        fetch('/api/settings/ads', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(ads)
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
        getSavedAds();
        // eslint-disable-next-line
    }, [])

    return (
        <>
        <Toast ref={toast} />
        <h1>Quảng cáo</h1>
        <h2>Banner & Popup</h2>
        <div className='admin-ads grid'>
            <AdsInput half name='banner1' value={ads.banner1} header='Banner 1' onChange={bannerChange} />
            <AdsInput half name='banner2' value={ads.banner2} header='Banner 2' onChange={bannerChange} />
            <AdsInput name='popup' value={ads.popup} header='Popup' onChange={bannerChange} />
        </div>
        <Button className='admin-ads-save mb-2' label='Lưu' onClick={saveAds} />
        <h2>A-ads & khác</h2>
        <div className='admin-ads grid'>
            <AdsInputArea name='aads1' value={ads.aads1} header='A-ads 1' onChange={adsChange} />
            <AdsInputArea name='aads2' value={ads.aads2} header='A-ads 2' onChange={adsChange} />
            <AdsInputArea name='aads3' value={ads.aads3} header='A-ads 3' onChange={adsChange} />
            <AdsInputArea name='other1' value={ads.other1} header='Khác 1' onChange={adsChange} />
            <AdsInputArea name='other2' value={ads.other2} header='Khác 2' onChange={adsChange} />
            <AdsInputArea name='other3' value={ads.other3} header='Khác 3' onChange={adsChange} />
        </div>
        <Button className='admin-ads-save mb-2' label='Lưu' onClick={saveAds} />
        </>
    )
}

function AdsInput(props) {
    const {header, half, name, value, ...textProps} = props;

    return (
        <Panel className={`admin-ads-panel ${half ? 'col-6' : 'col-12'}`} header={header}>
            <div className='field w-full'>
                Hình
                <InputText className='block w-full' name={`${name}.image`} value={value.image} {...textProps} />
                <br />
                Link
                <InputText className='block w-full' name={`${name}.url`} value={value.url} {...textProps} />
            </div>
        </Panel>
    )
}

function AdsInputArea(props) {
    const {header, half, ...textProps} = props;

    return (
        <Panel className='admin-ads-panel col-4' header={header}>
            <div className='field w-full'>
                <InputText className='block w-full' {...textProps} placeholder='ID của banner' />
            </div>
        </Panel>
    )
}