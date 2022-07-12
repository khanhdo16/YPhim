import './Admin.css'
import React from 'react'
import { AdminMenu } from "./Menu";
import { AdminSettings } from "./Settings";
import { AdminMedia, AdminMediaNew, AdminMediaInfo } from "./Media";
import { AuthImgur } from "./Auth";
import { AdminMovie, AdminMovieSingle } from './Movie';
import { AdminAds } from './Ads';
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminBookSingle, AdminBook } from './Book';
import { Dashboard } from './Dashboard';


export const Admin = () => {
    return (
        <div className='admin'>
            <AdminMenu />
            <div className='content'>
                <Routes>
                    <Route path='/' element={<Dashboard />} />
                    <Route path='media' element={<Navigate to='/media/image' />} />
                        <Route path='media/:type' element={<AdminMedia />}>
                            <Route path=':id' element={<AdminMediaInfo />} />
                        </Route>
                        <Route path='media/new' element={<AdminMediaNew />} />
                    <Route path='movie' element={<AdminMovie />} />
                        <Route path='movie/new' element={<AdminMovieSingle create />} />
                        <Route path='movie/:id' element={<AdminMovieSingle />} />
                    <Route path='book' element={<AdminBook />} />
                        <Route path='book/new' element={<AdminBookSingle create />} />
                        <Route path='book/:id' element={<AdminBookSingle />} />
                    <Route path='ads' element={<AdminAds />} />
                    <Route path='settings' element={<AdminSettings />} />
                    <Route path='auth/imgur' element={<AuthImgur />} />
                </Routes>
            </div>
        </div>
    )
}