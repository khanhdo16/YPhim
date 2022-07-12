import './BookList.css'
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

function BookItem({ info, setItems }) {
    const { title, views, image, slug, published } = info;
    const shortenViews = millify(views.total, {
        precision: 2,
    });
    const date = new Date(info.date).toLocaleString('en-GB');

    const thumbnail = image.s || placeholder;

    const deleteBook = () => {
        const { slug } = info;

        fetch(`/api/book/${slug}`, {
            method: 'DELETE'
        })
        .then(res => {
            if(res.status === 200) {
                setItems(prev => {
                    return prev.filter(item => item.slug !== slug)
                })
                if(toast) toast.current.show({severity: 'success', summary: 'Thành công', detail: 'Xoá truyện thành công!'});
            }
            if(res.status === 400) {
                if(toast) toast.current.show({severity: 'error', summary: 'Lỗi', detail: 'Xoá truyện không thành công!'});
            }
        })
    }

    const confirmDelete = (event) => {
        confirmPopup({
            target: event.currentTarget,
            message: 'Bạn có chắc chắn muốn xoá truyện?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Xoá',
            acceptClassName: 'p-button-danger',
            accept: deleteBook,
            rejectLabel: 'Huỷ',
        });
    }


    return (
        <tr className='booklist-item'>
            <td className='booklist-image'>
                <Link to={`/book/${slug}`} className='booklist-image-container'>
                    <img src={thumbnail} alt={title} />
                </Link>
            </td>
            <td className='booklist-title'>
                <Link to={`/book/${slug}`}>
                    <span>{title}</span>
                </Link>
            </td>
            <td className='booklist-published'>
                <span>{published ? 'Công khai' : 'Ẩn'}</span>
            </td>
            <td className='booklist-views'>
                <span>{shortenViews}</span>
            </td>
            <td className='booklist-date'>
                <span>{date}</span>
            </td>
            <td className='booklist-delete'>
                <Button className='p-button-danger' icon='pi pi-trash' onClick={confirmDelete} />
            </td>
        </tr>
    )
}

function BookTable({items}) {
    return (
        <table className='booklist'>
            <thead>
                <tr className='booklist-header'>
                    <th className='booklist-image'>Ảnh bìa</th>
                    <th className='booklist-title'>Tiêu đề</th>
                    <th className='booklist-published'>Hiển thị</th>
                    <th className='booklist-views'>Views</th>
                    <th className='booklist-date'>Ngày đăng</th>
                    <th className='booklist-delete'>Xoá</th>
                </tr>
            </thead>
            <tbody>{items}</tbody>
        </table>
    )
}

function BookList({items, setItems}) {
    const books = items.map(book => {
        return <BookItem key={book._id} info={book} setItems={setItems} />
    })

    return <BookTable items={books} />
}

function SkeletonList() {
    const SkeletonItem = () => {
        return (
            <tr className='booklist-item'>
                <td colSpan={6}><Skeleton borderRadius='0' height='100%' width='100%' /></td>
            </tr>
        )
    }
    const items = [];

    for(let i = 0; i < 10; i++) {
        items.push(<SkeletonItem key={i} />)
    }

    return <BookTable items={items} />
}


export const AdminBookList = ({searchItems}) => {
    const ITEM_LIMIT = 8;
    const [first, setFirst] = useState(0);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const mounted = useRef(false)
    const initial = useRef(true)
    toast = useRef()

    const getBooks = async (page = 1) => {
        const res = await fetch(`/api/book?page=${page}&limit=${ITEM_LIMIT}`)
        if (res.status === 200) {
            const books = await res.json()
            if(books) {
                const { docs, totalDocs } = books;
                
                setItems(docs);
                setTotal(totalDocs)
            }
        }
    }

    const handlePageChange = (e) => {
        const { page, first } = e
        setFirst(first)

        if(searchItems) {
            const range = first + ITEM_LIMIT;

            setItems(searchItems.slice(first, range))
            return;
        }

        getBooks(page + 1)
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
        getBooks()

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
            const range = ITEM_LIMIT
            setItems(searchItems.slice(0, range));
            setTotal(searchItems.length);
            setFirst(0);
        }
        if (!searchItems && initial.current === false) {
            setItems([]);
            getBooks();
            setFirst(0);
        }
        // eslint-disable-next-line
    }, [searchItems])

    return (
        <>
        <Toast ref={toast} />
        {!loading && items.length > 0 ?
            <>
            <BookList items={items} setItems={setItems} />
            <Paginator totalRecords={total} rows={ITEM_LIMIT} first={first} onPageChange={handlePageChange} />
            </>
            : notFound
        }
        </>
    )
}