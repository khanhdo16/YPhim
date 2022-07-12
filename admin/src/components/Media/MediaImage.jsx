import './MediaImage.css'
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BottomScrollListener } from 'react-bottom-scroll-listener';
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton';
import { useNavigate, useLocation } from 'react-router-dom';

function ImageItem({ info }) {
    const navigate = useNavigate()
    const imageType = info.url.match(/(\.\w{3,4}$)/g);
    const imageThumbnail = `https://i.imgur.com/${info.imgurId}l${imageType}`;

    function openInfoPage() {
        const url = `/media/image/${info._id}`
        navigate(url, { state: { info: info } })
    }

    return (
        <div className='media-imagegrid-container' onClick={openInfoPage}>
            <div className='media-imagegrid-item'>
                <img src={imageThumbnail} alt={info.name} className='media-imagegrid-preview' />
            </div>
        </div>
    )
}

function ImageGrid({items}) {
    const images = items.map(image => {
        return <ImageItem key={image._id} info={image} />
    })

    return (
        <div className='media-imagegrid'>
            {images}
        </div>
    )
}

function SkeletonGrid() {
    const SkeletonItem = () => {
        return (
            <div className='media-imagegrid-container'>
                <div className='media-imagegrid-item'>
                    <Skeleton borderRadius='0' height='100%' />
                </div>
            </div>
        )
    }
    const items = [];

    for(let i = 0; i < 24; i++) {
        items.push(<SkeletonItem key={i} />)
    }

    return (
        <div className='media-imagegrid'>
            {items}
        </div>
    )
}

export const AdminMediaImage = ({searchItems, setSearchItems, searchVisible}) => {
    const ITEM_LIMIT = 24;
    const { deleted } = useLocation().state || {}
    const [items, setItems] = useState([])
    const [showLoader, setShowLoader] = useState(true)
    const [loading, setLoading] = useState(true)
    const mounted = useRef(false)
    const initial = useRef(true)

    async function getImages(offset = 0, initial = false) {
        const res = await fetch(`/api/media/image?offset=${offset}&limit=${ITEM_LIMIT}`)
        if (res.status === 200) {
            const images = await res.json()
            if (Array.isArray(images)) {
                if(initial) {
                    return images
                }
                else if (images.length > 0) {
                    setItems(prev => {
                        if (prev) return [...prev, ...images]
                        else return images
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
            getImages(items.length)
        }
    }

    function handleScrollBottom() {
        if(!searchItems) {
            getImages(items.length)
        }
    }

    function getInitialImages(isMounted) {
        if(!searchItems) {
            setItems([])
            if(!searchVisible) {
                getImages(0, true).then(images => {
                    if(isMounted) {
                        setItems(prev => {
                            if (prev) return [...prev, ...images]
                            else return images
                        })

                        initial.current = false
                    }
                })
            }
        }
    }

    useEffect(() => {
        let isMounted = true;

        getInitialImages(isMounted)

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
            getImages()
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

            return <SkeletonGrid />
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
                    <ImageGrid items={items} />
                </BottomScrollListener>
                : notFound
            }
        </>
    )
}