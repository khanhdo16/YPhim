import './Rank.css';
import 'react-alice-carousel/lib/alice-carousel.css';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { countryList } from '../../countryList';
import { Link } from 'react-router-dom';
import AliceCarousel from 'react-alice-carousel';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { useOnWindowResize } from 'rooks';
import millify from 'millify';



const RankItem = ({rank, info}) => {
    const { title, slug, country, rating, views, image } = info
    const [loaded, setLoaded] = useState(false);

    const options = {
        onLoad: () =>  setLoaded(true),
        style: {opacity: loaded ? undefined : 0},
    }

    return (
        <Link to={`/${slug}`} className='rank-item' {...options} >
            <div className='rank-item__background'>
                <img src={image.m} width='100%' height='100%' alt='' />
            </div>
            <div className='rank-item__movie'>
                <div className='rank-item__poster'>
                    <img  src={image.m} alt={title} />
                </div>
                <div className='rank-item__detail'>
                    <h3>{title}</h3>
                    <span><strong>Quốc gia: </strong>{countryList[country]}</span>
                    {/* eslint-disable-next-line  */}
                    <span><strong>Đánh giá: </strong>{rating && rating != 0.0 ? `${rating}/5.0` : 'Chưa có'}</span>
                    <span><strong>Views: </strong>{views ? millify(views) : 0}</span>
                </div>
            </div>
            <span className='rank-item__rank'>{rank}</span>
        </Link>
    )
}

const RankSlider = ({movies}) => {
    const [resized, setResized] = useState(true);
    const sliderRef = useRef();

    const movieList = movies.map((movie, index) => {
        return <RankItem key={movie._id} rank={index + 1} info={movie} onDragStart={e => e.preventDefault()} />
    })

    const options = {
        ref: sliderRef,
        items: movieList,
        responsive: {
            0: { items: 3 },
            767.97: { items: 2 },
            1119.97: { items: 3},
            1919.97: { items: 4},
            2559.97: { items: 5}
        },
        disableButtonsControls: true,
        disableDotsControls: true,
        infinite: true,
        autoPlay: true,
        autoPlayInterval: 2000,
    }

    useOnWindowResize(() => {
        setResized(false);
        setTimeout(() => setResized(true), 200)
    })

    return (
        <div id='rank'>
            {resized && (<AliceCarousel {...options} />)}
            <div id='rank__prev'>
                <Button className='p-button-rounded' icon='pi pi-chevron-left' onClick={() => sliderRef.current.slidePrev()} />
            </div>
            <div id='rank__next'>
                <Button className='p-button-rounded' icon='pi pi-chevron-right' onClick={() => sliderRef.current.slideNext()} />
            </div>
        </div>
    )
}

const SkeletonItem = ({rank}) => {
    return (
        <div className='rank-item w-4'>
            <Skeleton className='rank-item__background' />
            <span className='rank-item__rank'>{rank}</span>
        </div>
    )
}

const SkeletonSlider = () => {
    const skeletonList = [
        <SkeletonItem key={1} rank={1} />,
        <SkeletonItem key={2} rank={2} />,
        <SkeletonItem key={3} rank={3} />
    ]

    return (
        <div id='rank' className='flex'>
            {skeletonList}
        </div>
    )
}


export const Rank = () => {
    const [movies, setMovies] = useState();

    const getMovieRank = async () => {
        try {
            const res = await fetch('/api/rank')
            if(res.status === 200) {
                const movies = await res.json()
                if(movies) setMovies(movies)
            }
        } catch (err) {
            if(process.env.DEBUG) console.log(err)
        }
    }
    

    //Get initial data
    useEffect(() => {
        getMovieRank()
        //eslint-disable-next-line
    }, [])


    const slider = useMemo(() => {
        if(movies) return <RankSlider movies={movies} />
        return <SkeletonSlider />
        //eslint-disable-next-line
    }, [movies]) 

    return slider;
}