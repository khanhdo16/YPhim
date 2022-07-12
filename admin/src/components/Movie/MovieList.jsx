import './MovieList.css'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { Paginator } from 'primereact/paginator';
import { confirmPopup } from 'primereact/confirmpopup';
import { Link } from 'react-router-dom';
import placeholder from './image_placeholder.jpg'
import millify from "millify"; 

var toast = null


const MovieFav = ({id, fav, setFav}) => {
    const buttonClassName = (fav === id) ? 'p-button-danger' : 'p-button-outlined p-button-secondary';
    const handleClick = async () => {
        const res = await fetch('/api/movie/fav', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id})
        });

        if(res.status === 200) setFav(id)
    }

    return <Button className={buttonClassName} icon='pi pi-heart' onClick={handleClick} />
}

function MovieItem({ info, setItems, fav, setFav }) {
    const { _id, title, image, views, slug, published } = info;
    const shortenViews = millify(views.total, {
        precision: 2,
    });
    const date = new Date(info.date).toLocaleString('en-GB');

    const thumbnail = image.s || placeholder;

    const deleteMovie = () => {
        const { slug } = info;

        fetch(`/api/movie/${slug}`, {
            method: 'DELETE'
        })
        .then(res => {
            if(res.status === 200) {
                setItems(prev => {
                    return prev.filter(item => item.slug !== slug)
                })
                if(toast) toast.current.show({severity: 'success', summary: 'Thành công', detail: 'Xoá phim thành công!'});
            }
            if(res.status === 400) {
                if(toast) toast.current.show({severity: 'error', summary: 'Lỗi', detail: 'Xoá phim không thành công!'});
            }
        })
    }

    const confirmDelete = (event) => {
        confirmPopup({
            target: event.currentTarget,
            message: 'Bạn có chắc chắn muốn xoá phim?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Xoá',
            acceptClassName: 'p-button-danger',
            accept: deleteMovie,
            rejectLabel: 'Huỷ',
        });
    }

    return (
        <tr className='movielist-item'>
            <td className='movielist-image'>
                <Link className='movielist-image-container' to={`/movie/${slug}`}>
                    <img src={thumbnail} alt={title} />
                </Link>
            </td>
            <td className='movielist-title'>
                <Link to={`/movie/${slug}`}>
                    <span>{title}</span>
                </Link>
            </td>
            <td className='movielist-published'>
                <span>{published ? 'Công khai' : 'Ẩn'}</span>
            </td>
            <td className='movielist-views'>
                <span>{shortenViews}</span>
            </td>
            <td className='movielist-date'>
                <span>{date}</span>
            </td>
            <td className='movielist-fav'>
                <span><MovieFav id={_id} fav={fav} setFav={setFav} /></span>
            </td>
            <td className='movielist-delete'>
                <Button className='p-button-danger' icon='pi pi-trash' onClick={confirmDelete} />
            </td>
        </tr>
    )
}

function MovieTable({items}) {
    return (
        <table className='movielist'>
            <thead>
                <tr className='movielist-header'>
                    <th className='movielist-image'>Ảnh bìa</th>
                    <th className='movielist-title'>Tiêu đề</th>
                    <th className='movielist-published'>Hiển thị</th>
                    <th className='movielist-views'>Views</th>
                    <th className='movielist-date'>Ngày đăng</th>
                    <th className='movielist-fav'>Yêu thích</th>
                    <th className='movielist-delete'>Xoá</th>
                </tr>
            </thead>
            <tbody>{items}</tbody>
        </table>
    )
}

function MovieList({items, setItems}) {
    const [fav, setFav] = useState();

    const movies = items.map(movie => {
        return <MovieItem key={movie._id} info={movie} setItems={setItems} fav={fav} setFav={setFav} />
    })

    const getFav = async () => {
        const res = await fetch('/api/movie/fav')
        if(res.status === 200) {
            const { _id } = await res.json();

            setFav(_id)
        }
    }

    useEffect(() => {
        getFav()
    }, [])

    return <MovieTable items={movies} />
}

function SkeletonList() {
    const SkeletonItem = () => {
        return (
            <tr className='movielist-item'>
                <td colSpan={7}><Skeleton borderRadius='0' height='100%' width='100%' /></td>
            </tr>
        )
    }
    const items = [];

    for(let i = 0; i < 10; i++) {
        items.push(<SkeletonItem key={i} />)
    }

    return <MovieTable items={items} />
}


export const AdminMovieList = ({searchItems}) => {
    const ITEM_LIMIT = 8;
    const [first, setFirst] = useState(0);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const mounted = useRef(false)
    const initial = useRef(true)
    toast = useRef()

    const getMovies = async (page = 1) => {
        const res = await fetch(`/api/movie?page=${page}&limit=${ITEM_LIMIT}`)
        if (res.status === 200) {
            const movies = await res.json()
            if(movies) {
                const { docs, totalDocs } = movies;
                
                setItems(docs);
                setTotal(totalDocs)
            }
        }
    }

    const handlePageChange = (e) => {
        const { first, page } = e;
        setFirst(first)

        if(searchItems) {
            const range = first + ITEM_LIMIT;

            setItems(searchItems.slice(first, range))
            return;
        }

        getMovies(page + 1)
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

    //Get initial data
    useEffect(() => {
        getMovies()

        initial.current = false
    }, [])

    //Check mounting state
    useEffect(() => {
		mounted.current = true;
		
		return () => {
            mounted.current = false;
        };
	})

    //Load search results
    useEffect(() => {
        setLoading(true)

        if(searchItems) {
            const range = ITEM_LIMIT;

            setItems(searchItems.slice(0, range));
            setTotal(searchItems.length);
            setFirst(0);
        }
        if (!searchItems && initial.current === false) {
            setItems([]);
            getMovies();
            setFirst(0);
        }
        // eslint-disable-next-line
    }, [searchItems])

    return (
        <>
        <Toast ref={toast} />
        {!loading && items.length > 0 ?
            <>
            <MovieList items={items} setItems={setItems} />
            <Paginator totalRecords={total} rows={ITEM_LIMIT} first={first} onPageChange={handlePageChange} />
            </>
            : notFound
        }
        </>
    )
}