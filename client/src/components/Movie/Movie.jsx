import './Movie.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useBottomScrollListener } from 'react-bottom-scroll-listener';
import { Link } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';
import { countryList } from '../../countryList';
import { useMediaQuery } from 'react-responsive';



const MovieItem = ({ info }) => {
    const [loaded, setLoaded] = useState(false);
    const { title, slug, image, latest, completed } = info;

    const options = {
        style: { opacity: loaded ? undefined : 0 },
        onLoad: () => setLoaded(true)
    }

    return (
        <article className='movie-item' {...options}>
            <Link to={`/${slug}`} className='movie-item__container'>
                <img className='movie-item__poster' src={image.m} alt={title} />
                <div className='movie-item__background' />
                <div className='movie-item__details'>
                    {completed ? <span className='movie-item__status'>Hoàn thành</span> : undefined}
                    <span className='movie-item__latest'>{latest}</span>
                </div>
                <h3 className='movie-item__title'>{title}</h3>
            </Link>
        </article>
    )
}

const SkeletonItem = () => {
    return (
        <article className='movie-item'>
            <div className='movie-item__container'>
                <Skeleton className='movie-item__poster' height='100%' />
            </div>
        </article>
    )
}

const skeleton = () => {
    const items = [];

    for (let i = 0; i < 12; i++) {
        items.push(<SkeletonItem key={i} />)
    }

    return items;
}

export const Movie = ({ country, search }) => {
    const isMobile = useMediaQuery({ maxDeviceWidth: '768px' });
    const isTablet = useMediaQuery({ minWidth: '767.97px', maxDeviceWidth: '1200px' });
    const [movies, setMovies] = useState(search);
    const hasNextPage = useRef(true);
    const page = useRef(1);
    const scrollRef = useBottomScrollListener(loadMore);
    const LAYOUT = {
        COL: {
            mobile: 3,
            tablet: 5,
            desktop: 6
        },
        ROW: {
            mobile: { default: 3 },
            tablet: {
                home: 4,
                country: 3
            },
            desktop: {
                home: 4,
                country: 3
            }
        }
    }

    const getItemLimit = (loadMore) => {
        let device;
        let tab;

        if (isMobile) { device = 'mobile'; tab = 'default' }
        if (isTablet && !country) { device = 'tablet'; tab = 'home'; }
        if (isTablet && country) {  device = 'tablet'; tab = 'country'; }
        if (!device && !tab) {
            if(country) { device = 'desktop'; tab = 'country'; }
            else { device = 'desktop'; tab = 'home'; }

        }
        if (loadMore) {
            return (LAYOUT.COL[device] * LAYOUT.ROW[device][tab]) + LAYOUT.COL[device];
        }

        return (LAYOUT.COL[device] * LAYOUT.ROW[device][tab]) + 1;
    }

    const getMovies = async (page = 1, loadMore) => {
        try {
            const queryString = new URLSearchParams({
                page,
                limit: getItemLimit(loadMore),
                ...country && ({ country })
            }).toString();

            const res = await fetch(`/api/movie?${queryString}`);

            if (res.status === 200) {
                const json = await res.json();
                if (json) {
                    const { movies, hasNextPage: nextPage } = json;

                    setMovies(prev => {
                        return page > 1 ? [...prev, ...movies] : movies
                    });

                    hasNextPage.current = nextPage;
                }
            }
        } catch (err) {
            if (process.env.DEBUG) console.log(err)
        }
    }

    function loadMore() {
        if (hasNextPage.current) getMovies(++page.current, true)
    }

    useEffect(() => {
        if (search || country) return;
        getMovies()
        //eslint-disable-next-line
    }, [])

    useEffect(() => {
        if (country) getMovies()
        //eslint-disable-next-line
    }, [country])

    useEffect(() => {
        if (search) setMovies(search)
    }, [search])

    const movieList = useMemo(() => {
        if (Array.isArray(movies) && movies.length > 0) {
            return movies.map(movie => {
                return <MovieItem key={movie._id} info={movie} />
            })
        }

        return skeleton();
    }, [movies])

    const title = useMemo(() => {
        if (country) return `Phim ${countryList[country]}`;
        if (search) return 'Phim';
        return 'Phim mới'
    }, [search, country])

    return (
        <section id='movie'>
            <h2 className='movie__header'>{title}</h2>
            <div className='movie__container__wrapper'>
                <div className='movie__container' ref={!search ? scrollRef : undefined}>
                    <div className='movie__list'>
                        {movieList}
                    </div>
                </div>
            </div>
        </section>
    )
}