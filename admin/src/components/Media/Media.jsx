import './Media.css'
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { TabMenu } from 'primereact/tabmenu';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { AdminMediaImage } from './MediaImage'
import { useMediaQuery } from 'react-responsive'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { AdminMediaAudio } from './MediaAudio';

export const AdminMedia = () => {
    const navigate = useNavigate()
    const { type } = useParams()
    const isMobile = useMediaQuery({maxWidth: '768px'})
    const [activeIndex, setActiveIndex] = useState(getActiveIndex(type))
    const [searchVisible, setSearchVisible] = useState(false)
    const [items, setItems] = useState(null)
    const searchElement = useRef()
    const searchQuery = useRef('')
    const timer = useRef(null)

    const mediaMenu = [
        {label: 'Hình ảnh', icon: 'pi pi-image'},
        {label: 'Nhạc', icon: 'pi pi-volume-up'},
        {template: () => {
            if(isMobile) {
                return (
                    <>
                    <Sidebar className='media-searchbar' visible={searchVisible} position="top"  modal={false}
                        onHide={() => setSearchVisible(false)}
                    >
                        <InputText placeholder="Tìm kiếm" ref={searchElement} onChange={handleSearch} />
                        <Button label='Huỷ' onClick={e => {
                            searchQuery.current = searchElement.current.value = ''
                            searchFiles(null)
                        }} />
                    </Sidebar>
                    <Button className='p-button-rounded p-button-secondary' icon='pi pi-search' onClick={() => setSearchVisible(true)} />
                    </>
                )
            }
            else {
                return (
                    <span className='p-input-icon-right'>
                        <i className="pi pi-search" />
                        <InputText placeholder="Tìm kiếm" ref={searchElement} onChange={handleSearch} />
                    </span>
                )
            }
        }}
    ];

    useLayoutEffect(() => {
        const menuItems = document.getElementsByClassName('p-panelmenu-header-link')
        const thisItem = Array.from(menuItems).filter(item => item.text === 'Media')[0]
        
        if(thisItem.attributes['aria-expanded'].nodeValue === 'false')
            thisItem.click()
    })

    useEffect(() => {
        if(searchQuery.current) {
            searchElement.current.value = searchQuery.current
        }
    })

    function handleSearch(e) {
        searchQuery.current = e.target.value
        
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            searchFiles(e.target.value)
        }, 500)
    }

    async function searchFiles(value) {
        if(value) {
            const res = await fetch(`/api/media/${type}?search=${value}`)
            if(res.status === 200) {
                const images = await res.json()
                
                if (Array.isArray(images)) {
                    setItems(images)
                }
            }
        }
        else setItems(null)
    }

    function getActiveIndex() {
        if (type === 'image')
            return 0

        if (type === 'audio')
            return 1

        return 0
    }
    
    const activeContent = () => {
        if (type === 'image')
            return <AdminMediaImage searchItems={items} setSearchItems={setItems} searchVisible={searchVisible} />

        if (type === 'audio')
            return <AdminMediaAudio searchItems={items} setSearchItems={setItems} searchVisible={searchVisible} />

        return <AdminMediaImage searchItems={items} setSearchItems={setItems} searchVisible={searchVisible} />
    }

    const changeTab = (e) => {
        setActiveIndex(e.index)

        switch(e.index) {
            case 0:
                return navigate('/media/image')
            case 1:
                return navigate('/media/audio')
            default:
                return navigate('/media/image')
        }
    }

    
    return (
        <>
        <Outlet />
        <h1>Media</h1>
        <TabMenu model={mediaMenu} activeIndex={activeIndex} onTabChange={changeTab} />
        {activeContent()}
        </>
    )
}