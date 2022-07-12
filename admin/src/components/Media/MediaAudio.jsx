import './MediaAudio.css'
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BottomScrollListener } from 'react-bottom-scroll-listener';
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton';
import { useNavigate, useLocation } from 'react-router-dom';
import placeholder from './music_placeholder.png'

function AudioItem({ info }) {
    const navigate = useNavigate()

    function openInfoPage() {
        const url = `/media/audio/${info._id}`
        navigate(url, { state: { info: info } })
    }

    return (
        <div className='media-audiolist-container' onClick={openInfoPage}>
            <div className='media-audiolist-item'>
                <img src={placeholder} alt={info.name} className='media-audiolist-preview' />
                <div className='media-audiolist-info'>
                    {info.name?
                        <span className='media-audiolist-info-header'>{info.name}</span>
                        : <Skeleton />
                    }
                </div>
            </div>
        </div>
    )
}

function AudioList({items}) {
    const audios = items.map(audio => {
        return <AudioItem key={audio._id} info={audio} />
    })

    return (
        <div className='media-audiolist'>
            {audios}
        </div>
    )
}

function SkeletonList() {
    const SkeletonItem = () => {
        return (
            <div className='media-audiolist-container'>
                <Skeleton borderRadius='0' height='100%' />
            </div>
        )
    }
    const items = [];

    for(let i = 0; i < 18; i++) {
        items.push(<SkeletonItem key={i} />)
    }

    return (
        <div className='media-audiolist'>
            {items}
        </div>
    )
}


export const AdminMediaAudio = ({searchItems, setSearchItems, searchVisible}) => {
    const ITEM_LIMIT = 24;
    const { deleted } = useLocation().state || {}
    const [items, setItems] = useState([])
    const [showLoader, setShowLoader] = useState(true)
    const [loading, setLoading] = useState(true)
    const mounted = useRef(false)
    const initial = useRef(true)

    async function getAudios(offset = 0, initial = false) {
        const res = await fetch(`/api/media/audio?offset=${offset}&limit=${ITEM_LIMIT}`)
        if (res.status === 200) {
            const audios = await res.json()
            if (Array.isArray(audios)) {
                if(initial) {
                    return audios
                }
                else if (audios.length > 0) {
                    setItems(prev => {
                        if (prev) return [...prev, ...audios]
                        else return audios
                    })
                }
            }
        }
    }

    function loadMore() {
        if(searchItems) {
            setSearchItems(null)
        }
        else {
            getAudios(items.length)
        }
    }

    function handleScrollBottom() {
        if(!searchItems) {
            getAudios(items.length)
        }
    }

    function getInitialAudios(isMounted) {
        if(!searchItems) {
            setItems([])
            if(!searchVisible) {
                getAudios(0, true).then(audios => {
                    if(isMounted) {
                        setItems(prev => {
                            if (prev) return [...prev, ...audios]
                            else return audios
                        })

                        initial.current = false
                    }
                })
            }
        }
    }

    useEffect(() => {
        let isMounted = true;

        getInitialAudios(isMounted)

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        setLoading(true)

        if(searchItems) {
            setItems(searchItems)
        }
        if (!searchItems && initial.current === false) {
            setItems([])
            getAudios()
        }
        // eslint-disable-next-line
    }, [searchItems])


    useEffect(() => {
        if(deleted) {
            const newItems = items.filter(item => item._id !== deleted)

            setItems(newItems)
        } // eslint-disable-next-line
    }, [deleted])

    
    useLayoutEffect(() => {
        const { clientHeight } = document.getElementsByClassName('content')[0]
        const viewHeight = window.innerHeight
        
        if (clientHeight < viewHeight && !searchItems) setShowLoader(true)
        else setShowLoader(false)
    }, [items, searchItems, loading])


    useEffect(() => {
		mounted.current = true;
		
		return () => {
            mounted.current = false;
        };
	})

    const notFound = useMemo(() => {
        if(loading) {
            setTimeout(() => {
                if(mounted.current) {
                    setLoading(false)
                }
            }, 500)

            return <SkeletonList />
        }
        return <span className='block mt-5 text-center'>Không tìm thấy kết quả nào.</span>
        //eslint-disable-next-line
    }, [loading, items])

    return (
        <>
            <div className='content-loader'
                style={{ display: showLoader ? undefined : 'none' }}
            >
                <Button label='Tải thêm' onClick={loadMore} />
            </div>
            {!loading && items.length > 0 ?
                <BottomScrollListener debounce={0} onBottom={handleScrollBottom}>
                    <AudioList items={items} />
                </BottomScrollListener>
                : notFound
            }
        </>
    )
}