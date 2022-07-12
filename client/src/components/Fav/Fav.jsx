import './Fav.css';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';

export const Fav = () => {
    const [loaded, setLoaded] = useState(false);
    const [fav, setFav] = useState({
        title: '',
        slug: '',
        image: ''
    })

    const posterOptions = {
        style: {opacity: loaded ? undefined : 0},
        onLoad: () =>  setLoaded(true)
    }

    const getMovieFav = async () => {
        try {
            const res = await fetch('/api/fav')
            if(res.status === 200) {
                const fav = await res.json()
                if(fav) setFav(fav)
            }
        } catch (err) {
            if(process.env.DEBUG) console.log(err)
        }
    }

    useEffect(() => {
        getMovieFav()
        //eslint-disable-next-line
    }, [])

    return (
        <Link id='fav' to={fav.slug ?? fav.slug}>
            {!loaded ? <Skeleton height='100%' /> : undefined}
            <img className='fav__poster' src={fav.image.m} alt='' {...posterOptions}  />
            <img className='fav__icon' src='/img/fav.png' alt='' />
            <span className='fav__title'>Tuyệt đỉnh<br />phim</span>
        </Link>
    )
}