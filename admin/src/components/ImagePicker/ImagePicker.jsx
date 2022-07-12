import './ImagePicker.css'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext'
import { useLocation } from 'react-router-dom';

function ImageItem({ info, setLink, setVisible }) {
    const imageType = info.url.match(/(\.\w{3,4}$)/g);
    const imageThumbnail = `https://i.imgur.com/${info.imgurId}l${imageType}`;

    const handleClick = () => {
        setLink(info)
        setVisible(false)
    }
    
    return (
        <div className='imagepicker-grid-container' onClick={handleClick}>
            <div className='imagepicker-grid-item'>
                <img src={imageThumbnail} alt={info.name} className='imagepicker-grid-preview' />
            </div>
        </div>
    )
}

function ImageGrid({items, setLink, setVisible}) {
    const images = items.map(image => {
        return <ImageItem key={image._id} info={image} setLink={setLink} setVisible={setVisible} />
    })

    return (
        <div className='imagepicker-grid'>
            {images}
        </div>
    )
}

function SkeletonGrid() {
    const SkeletonItem = () => {
        return (
            <div className='imagepicker-grid-container'>
                <div className='imagepicker-grid-item'>
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
        <div className='imagepicker-grid'>
            {items}
        </div>
    )
}

export const AdminImagePicker = ({visible, setVisible, setLink}) => {
    const ITEM_LIMIT = 24;
    const { deleted } = useLocation().state || {}
    const [items, setItems] = useState([])
    const [searchItems, setSearchItems] = useState(null)
    const [loading, setLoading] = useState(true)
    const mounted = useRef(false)
    const initial = useRef(true)
    const timer = useRef(null)
    

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

    function getInitialImages(isMounted) {
        if(!searchItems) {
            setItems([])
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


    useEffect(() => {
		mounted.current = true;
		
		return () => {
            mounted.current = false;
        };
	})

    function handleSearch(e) { 
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            searchFiles(e.target.value)
        }, 500)
    }

    async function searchFiles(value) {
        if(value) {
            const res = await fetch(`/api/media/image?search=${value}`)
            if(res.status === 200) {
                const images = await res.json()
                
                if (Array.isArray(images)) {
                    setSearchItems(images)
                }
            }
        }
        else setSearchItems(null)
    }

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

    const header = () => {
        return (
            <span className='p-input-icon-right imagepicker-search'>
                <i className="pi pi-search" />
                <InputText placeholder="Tìm kiếm" onChange={handleSearch} />
            </span>
        )
    }

    const dialogProps = {
        style: { width: '80vw' },
        header: header(),
        visible: visible,
        onHide: () => setVisible(false),
        footer: [
            <Button label='Bỏ chọn' onClick={() => setLink('')} />,
            <Button label='Tải thêm' onClick={loadMore} />
        ],
        draggable: false
    }

    return (
        <>
            <Dialog className='imagepicker-dialog' {...dialogProps} >
                {!loading && items.length > 0 ?
                    <ImageGrid items={items} setLink={setLink} setVisible={setVisible} />
                    : notFound
                }
            </Dialog>
            
        </>
    )
}