import './App.css';
import 'primereact/resources/themes/bootstrap4-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import React from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from './components/Home';
import { Header } from './components/Header';
import { Announcement } from './components/Announcement';
import { Popup } from './components/Popup';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Footer } from './components/Footer';
import { NotFound } from './components/NotFound';
import { MovieSingle } from './components/MovieSingle';
import { BookSingle } from './components/BookSingle';
import { countryRoutes } from './countryList';
import { Maintenance } from './components/Maintenance';

function App() {
  return (
    <HelmetProvider>
      <Helmet titleTemplate='%s - YPhim - Phim hay - Truyện hay - Cập nhật nhanh' defaultTitle="YPhim - Phim hay - Truyện hay - Cập nhật nhanh">
        <title>YPhim - Phim hay - Truyện hay - Cập nhật nhanh</title>
        <meta
          name="description"
          content="Truy cập YPhim để xem phim, đọc truyện."
        />
        <meta name="robots" content="noindex,nofollow" />
        <meta name="keywords" content="yphim, phim hay, phim mới, truyện mới, truyện hay" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yphim.com/" />
        <meta property="og:title" content="YPhim - Phim hay - Truyện hay - Cập nhật nhanh" />
        <meta property="og:description" content="Truy cập YPhim để xem phim, đọc truyện." />
        <meta property="og:image" content="https://yphim.com/logo512.png" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://yphim.com/" />
        <meta property="twitter:title" content="YPhim - Phim hay - Truyện hay - Cập nhật nhanh" />
        <meta property="twitter:description" content="Truy cập YPhim để xem phim, đọc truyện." />
        <meta property="twitter:image" content="https://yphim.com/logo512.png" />
      </Helmet>
      <Header />
      <Popup />
      {/* <Announcement /> */}
      <main>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/:slug' element={<MovieSingle />} />
          <Route path='/truyen' element={<Navigate to='/' />} />
          <Route path='/truyen/:slug' element={<BookSingle />} />
          <Route path='/quoc-gia'>
            {countryRoutes}
            <Route path='*' element={<Navigate to='/' />} />
          </Route>
          <Route path='/not-found' element={<NotFound />} />
          <Route path='/maintenance' element={<Maintenance />} />
          <Route path='*' element={<Navigate to='/not-found' />} />
        </Routes>
      </main>
      <Footer />
    </HelmetProvider>
  );
}

export default App;
