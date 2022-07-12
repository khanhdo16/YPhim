import './MovieByCountry.css';
import React from 'react';
import { Ads } from '../Ads';
import { Movie } from '../Movie';
import { Facebook } from '../Facebook';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { countryList } from '../../countryList';


export const MovieByCountry = ({country}) => {
  const { pathname } = useLocation();


  return (
    <>
    <Helmet>
        <title>{`Phim ${countryList[country]}`}</title>
        <meta
          name="description"
          content={`Xem phim BL ${countryList[country]} tại YPhim để cập nhật Vietsub mới nhất`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="keywords" content={`phim BL ${countryList[country]}, yphim, phim hay, phim mới, truyện hay, truyện mới`}></meta>
        
        <meta property="og:url" content={`https://yphim.com${pathname}`} />
        <meta property="og:title" content={`Phim ${countryList[country]} - YPhim - Phim hay - Truyện hay - Cập nhật nhanh`} />
        <meta property="og:description" content={`Xem phim BL ${countryList[country]} tại YPhim để cập nhật Vietsub mới nhất`} />
       
        <meta property="twitter:url" content={`https://yphim.com${pathname}`} />
        <meta property="twitter:title" content={`Phim ${countryList[country]} - YPhim - Phim hay - Truyện hay - Cập nhật nhanh`} />
        <meta property="twitter:description" content={`Xem phim BL ${countryList[country]} tại YPhim để cập nhật Vietsub mới nhất`} />
      </Helmet>
    <Ads />
    <div className='movie-by-country container'>
        <div className='content'>
            <Movie country={country} />
        </div>
        <div className='sidebar'>
            <Facebook />
        </div>
    </div>
    </>
  )
};
