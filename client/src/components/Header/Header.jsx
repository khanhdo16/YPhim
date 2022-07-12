import React, { useState, useRef } from 'react';
import './Header.css';
import { NavLink } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive';
import { AnimatePresence, motion } from 'framer-motion';
import { countryList } from '../../countryList';
import { InputText } from 'primereact/inputtext';
import { Movie } from '../Movie';
import { Book } from '../Book';


const animationSetting = {
    initial: { scale: 0, opacity: 0.9 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 2, opacity: 0 },
    transition: {
        type: 'spring',
        duration: 0.5
    }
}


const navClassName = ({ isActive }) => {
    return `header__nav${isActive ? ' active': ''}`;
}

const countryNav = Object.entries(countryList).map(([key, value]) => {
    return (
        <NavLink key={key} to={`/quoc-gia/${key}`}
            className={navClassName}
        >{value}</NavLink>
    )
})

const CountryMenu = ({onClick}) => {
    return (
        <motion.div {...animationSetting} id='header__menu--countries'
            onClick={onClick}
        >
            <div className='pi pi-times close'/>
            <div className='content'>{countryNav}</div>
        </motion.div>
    )
}


const CountryList = () => {
    const isMobile = useMediaQuery({maxWidth: '1150px'});
    const [visible, setVisible] = useState(false);

    const showMenu = () => {
        setVisible(prev => {
            document.body.classList.toggle('noscroll', !prev)
            return !prev
        })
    }

    if(isMobile)
        return (
            <>
            <span className='header__nav header__country-toggle' onClick={showMenu}>
                Quốc gia <i className='pi pi-chevron-down text-xs' />
            </span>
            <AnimatePresence>
                {visible && (<CountryMenu onClick={showMenu} />)}
            </AnimatePresence>
            </>
        )
    else
        return countryNav
}

const Search = ({onClick}) => {
    const [search, setSearch] = useState({
        movies: [],
        books: []
    })
    const [value, setValue] = useState('');
    const timer = useRef();

    const getSearch = async (value) => {
        const res = await fetch(`/api/search/?q=${value}`);
        if(res.status === 200) {
            const search = await res.json();
    
            setSearch(search)
        }
    }

    const handleChange = (e) => {
        console.log(e.target.value)
        if(timer.current) clearTimeout(timer.current);

        const { value } = e.target;
        setValue(value)

        timer.current = setTimeout(() => {
            getSearch(value);
        }, 500)
    }

    return (
        <motion.div {...animationSetting} id='header-search'>
            <div className='header-search__header'>
                <span className='header-search__title'>Tìm kiếm</span>
                <div className='pi pi-times header-search__close' onClick={onClick} />
            </div>
            <InputText className='header-search__input' value={value}
                onChange={handleChange} placeholder='Tên phim, truyện...'
            />
            <div className='header-search__content' onClick={onClick}>
                { search.books.length > 0
                    && (<Book search={search.books} />)
                }
                { search.movies.length > 0
                    && (<Movie search={search.movies} />)
                }
            </div>
        </motion.div>
    )
}


export const Header = () => {
    const [searchVisible, setSearchVisible] = useState(false);

    const showSearch = () => {
        setSearchVisible(prev => {
            document.body.classList.toggle('noscroll', !prev)
            return !prev
        })
    }

    return (
        <>
        <header>
            <div id='header__container'>
                <a id='header__logo' href='/'>
                    <img  src='/logo512.png' alt='YPhim Logo' />
                </a>
                <nav id='header__menu'>
                    <NavLink to='/' className={navClassName}>Trang chủ</NavLink>
                    <CountryList />
                </nav>
                <img className='header-search__icon' src='/img/search-icon.png' alt='' onClick={showSearch} />
            </div>
        </header>
        <AnimatePresence>
            {searchVisible && (<Search onClick={showSearch} />)}
        </AnimatePresence>
        </>
    )
}