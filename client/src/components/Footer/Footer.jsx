import React from 'react';
import './Footer.css';

export const Footer = () => {
    return (
        <footer>
            <div className='footer__copyright'>
                <span className='text-base md:text-xl font-bold md:text-base'>{new Date().getFullYear()} © YPhim</span>
                <span className='text-sm'>Design by KD</span>
            </div>
            <div className='footer__social'>
                <a className='text-base md:text-lg font-medium' href='https://www.facebook.com/ophimhayx'><i className='pi pi-facebook pi-fw' /> Page Facebook</a>
                <a className='text-base md:text-lg font-medium' href='https://www.facebook.com/groups/xemphimgixemvoi'><i className='pi pi-facebook pi-fw' /> Group Facebook</a>
            </div>
        </footer>
    )
}