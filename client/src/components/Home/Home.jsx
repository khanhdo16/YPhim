import './Home.css'
import React from 'react';
import { Rank } from '../Rank';
import { Fav } from '../Fav';
import { Ads } from '../Ads';
import { Movie } from '../Movie';
import { Book } from '../Book';
import { Facebook } from '../Facebook';
import { Helmet } from 'react-helmet-async'

export const Home = () => {
    return (
        <>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div id='banner'>
                <Rank />
                <Fav />
            </div>
            <Ads />
            <div className='container'>
                <div className='content'>
                    <Book />
                    <Movie />
                </div>
                <div className='sidebar'>
                    <Facebook />
                </div>
            </div>
        </>
    )
}