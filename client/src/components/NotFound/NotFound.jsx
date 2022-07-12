import React from 'react';
import { useMutationObserverRef } from "rooks";

export const NotFound = () => {
    const [spanRef] = useMutationObserverRef((e) => console.log(e))

    return (
        <div id='not-found' className='text-center'>
            <h1><span className='text-6xl'>404</span><br />NOT FOUND</h1>
            <span ref={spanRef} className='block text-2xl font-medium mb-5'>Đang tìm gì đấy? Làm gì có mà tìm...</span>
            <img className='block mx-auto my-2 max-w-full lg:w-3' src='/img/not-found.png' alt='' />
        </div>
    )
};
