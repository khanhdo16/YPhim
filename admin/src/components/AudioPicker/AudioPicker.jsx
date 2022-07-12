import './AudioPicker.css'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext'
import { useLocation } from 'react-router-dom';
import placeholder from './music_placeholder.png';

function AudioItem({ info, setLink, setVisible }) {
    const handleClick = () => {
        setLink(info)
        setVisible(false)
    }
    
    return (
        <div className='audiopicker-list-container' onClick={handleClick}>
            <div className='audiopicker-list-item'>
                <img src={placeholder} alt={info.name} className='audiopicker-list-preview' />
                <div className='audiopicker-list-info'>
                    {info.name?
                        <span className='audiopicker-list-info-header'>{info.name}</span>
                        : <Skeleton />
                    }
                </div>
            </div>
        </div>
    )
}

function AudioList({items, setLink, setVisible}) {
    const audios = items.map(audio => {
        return <AudioItem key={audio._id} info={audio} setLink={setLink} setVisible={setVisible} />
    })

    return (
        <div className='audiopicker-list'>
            {audios}
        </div>
    )
}

function SkeletonList() {
    const SkeletonItem = () => {
        return (
            <div className='audiopicker-list-container'>
                <div className='audiopicker-list-item'>
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
        <div className='audiopicker-list'>
            {items}
        </div>
    )
}

export const AdminAudioPicker = ({visible, setVisible, setLink}) => {
    const ITEM_LIMIT = 24;
    const { deleted } = useLocation().state || {}
    const [items, setItems] = useState([])
    const [searchItems, setSearchItems] = useState(null)
    const [loading, setLoading] = useState(true)
    const mounted = useRef(false)
    const initial = useRef(true)
    const timer = useRef(null)
    

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

    function getInitialAudios(isMounted) {
        if(!searchItems) {
            setItems([])
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
            const res = await fetch(`/api/media/audio?search=${value}`)
            if(res.status === 200) {
                const audios = await res.json()
                
                if (Array.isArray(audios)) {
                    setSearchItems(audios)
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

            return <SkeletonList />
        }
        return <span className='block mt-5 text-center'>Không tìm thấy kết quả nào.</span>
        //eslint-disable-next-line
    }, [loading, items])

    const header = () => {
        return (
            <span className='p-input-icon-right audiopicker-search'>
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
            <Dialog className='audiopicker-dialog' {...dialogProps} >
                {!loading && items.length > 0 ?
                    <AudioList items={items} setLink={setLink} setVisible={setVisible} />
                    : notFound
                }
            </Dialog>
            
        </>
    )
}