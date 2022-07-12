import './Movie.css'
import React, { useState, useRef, useLayoutEffect } from 'react'
import { InputText } from 'primereact/inputtext';
import { Outlet } from 'react-router-dom'
import { AdminMovieList } from './MovieList';

const SearchBar = ({search, handleSearch}) => {
    return (
        <span className='p-input-icon-right'>
            <i className="pi pi-search" />
            <InputText placeholder="Tìm kiếm" value={search} onChange={handleSearch} />
        </span>
    )
}

export const AdminMovie = () => {
    const [items, setItems] = useState(null)
    const [search, setSearch] = useState('')
    const timer = useRef(null)

    useLayoutEffect(() => {
        const menuItems = document.getElementsByClassName('p-panelmenu-header-link')
        const thisItem = Array.from(menuItems).filter(item => item.text === 'Phim')[0]
        
        if(thisItem.attributes['aria-expanded'].nodeValue === 'false')
            thisItem.click()
    })


    function handleSearch(e) {
        const { value } = e.target;
        setSearch(value);

        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            searchFiles(value);
        }, 500)
    }

    async function searchFiles(value) {
        if(value) {
            const res = await fetch(`/api/movie?search=${value}`)
            if(res.status === 200) {
                const images = await res.json()
                
                if (Array.isArray(images)) {
                    setItems(images)
                }
            }
        }
        else setItems(null)
    }

    
    return (
        <>
        <Outlet />
        <h1>Danh sách phim</h1>
        <SearchBar search={search} handleSearch={handleSearch} />
        <AdminMovieList searchItems={items} setSearchItems={setItems} />
        </>
    )
}