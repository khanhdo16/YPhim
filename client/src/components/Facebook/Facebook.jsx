import './Facebook.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EmbeddedPost, Page } from 'react-facebook';
import { useMutationObserverRef } from 'rooks';

const FacebookPost = ({ link }) => {
    const count = useRef(0);
    const [loaded, setLoaded] = useState(false);
    const [loadRef] = useMutationObserverRef(updateLoadState);
    
    function updateLoadState(mutationList) {
        mutationList.forEach(record => {
            if (
                record.type === 'attributes'
                && record.target.tagName.toLowerCase() === 'iframe'
                && record.attributeName === 'style'
            ) {
                count.current++;
            }
            
            if(count.current === 3) {
                setLoaded(true)
                count.current = -1
            }
        })
    }

    

    return (
        <div id='facebook' className={!loaded ? 'p-skeleton' : undefined} ref={loadRef}>
            <div style={{opacity: loaded ? undefined : 0}}>
                <EmbeddedPost href={link} showText />
            </div>
        </div>
    )
}

const FacebookPage = () => {
    const url = 'https://www.facebook.com/ophimhayx';
    const count = useRef(0);
    const [loaded, setLoaded] = useState(false);
    const [loadRef] = useMutationObserverRef(updateLoadState);
    
    function updateLoadState(mutationList) {
        mutationList.forEach(record => {
            if (
                record.type === 'attributes'
                && record.target.tagName.toLowerCase() === 'iframe'
                && record.attributeName === 'style'
            ) {
                count.current++;
            }
            
            if(count.current === 3) {
                setLoaded(true)
                count.current = -1
            }
        })
    }

    return (
        <div id='facebook-page' className={!loaded ? 'p-skeleton' : undefined} ref={loadRef}>
            <div style={{opacity: loaded ? undefined : 0}}>
                <Page href={url} tabs='timeline' height='70px' width='500px' adaptContainerWidth />
            </div>
        </div>
    )
}

export const Facebook = () => {
    const [link, setLink] = useState();

    const getFacebook = async () => {
        try {
            const res = await fetch('/api/facebook')
            if(res.status === 200) {
                const { link } = await res.json()
                if(link) setLink(link)
            }
        } catch (err) {
            if(process.env.DEBUG) console.log(err)
        }
    }

    useEffect(() => getFacebook(), []) //eslint-disable-next-line

    const facebook = useMemo(() => {
        if(link)
            return (
                <>
                <FacebookPost link={link} />
                <FacebookPage />
                </>
            )
        else
            return <FacebookPage />
    }, [link])

    return facebook;
}