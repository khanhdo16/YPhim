import './Popup.css';
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from 'primereact/button';
import { useLocation } from 'react-router-dom';
import { usePreviousDifferent } from "rooks";

const PopupItem = ({ image, url, setInfo }) => {
    const [loaded, setLoaded] = useState(false);

    const options = {
        style: {opacity: loaded ? undefined : 0},
        onLoad: () =>  setLoaded(true)
    }

    const closePopup = (e) => setInfo(null)


    return (
        <div id='popup' {...options} onClick={closePopup} onError={closePopup}>
            <Button icon='pi pi-times' label='Đóng' onClick={closePopup} />
            <a  href={url}>
                <img src={image} alt='' onError={closePopup} />
            </a>
        </div>
    )
}

export const Popup = () => {
    const { pathname } = useLocation();
    const [info, setInfo] = useState();
    const previous = usePreviousDifferent(info);

    const getPopup = async () => {
        try {
            const res = await fetch('/api/popup')
            if(res.status === 200) {
                const popup = await res.json()
                if(popup) setInfo(popup)
            }
        } catch (err) {
            if(process.env.DEBUG) console.log(err)
        }
    }

    //eslint-disable-next-line
    useEffect(() => getPopup(), [])

    useEffect(() => {
        if(!info) setInfo(previous)
        //eslint-disable-next-line
    }, [pathname])

    const popup = useMemo(() => {
        const { image, url } = info || {};

        const options = { image, url, setInfo };

        if(image && url) return <PopupItem {...options} />
        return null
    }, [info])

    return popup;
}