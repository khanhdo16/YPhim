import "./Book.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "primereact/skeleton";

const BookItem = ({ info }) => {
    const [loaded, setLoaded] = useState(false);
    const { title, slug, image, latest, completed } = info;

    const options = {
        style: { opacity: loaded ? undefined : 0 },
        onLoad: () => setLoaded(true),
    };

    return (
        <article className="book-item" {...options}>
            <Link to={`/truyen/${slug}`} className="book-item__container">
                <img className="book-item__poster" src={image.m} alt={title} />
                <div className="book-item__background" />
                <div className="book-item__details">
                    {completed ? (
                        <span className="book-item__status">Hoàn thành</span>
                    ) : undefined}
                    <span className="book-item__latest">{latest}</span>
                </div>
                <h3 className="book-item__title">{title}</h3>
            </Link>
        </article>
    );
};

const SkeletonItem = () => {
    return (
        <article className="book-item">
            <div className="book-item__container">
                <Skeleton className="book-item__poster" height="100%" />
            </div>
        </article>
    );
};

const skeleton = () => {
    const items = [];

    for (let i = 0; i < 5; i++) {
        items.push(<SkeletonItem key={i} />);
    }

    return items;
};

export const Book = ({search}) => {
    const [books, setBooks] = useState(search);
    const hasNextPage = useRef(true);
    const page = useRef(1);
    const wrapperRef = useRef();
    const containerRef = useRef();

    const getBooks = async (page = 1, limit = 5) => {
        try {
            const res = await fetch(`/api/book?page=${page}&limit=${limit}`);
            if (res.status === 200) {
                const json = await res.json();
                if (json) {
                    const { books, hasNextPage: nextPage } = json;

                    setBooks((prev) => {
                        return page > 1 ? [...prev, ...books] : books;
                    });

                    hasNextPage.current = nextPage;
                }
            }
        } catch (err) {
            if(process.env.DEBUG) console.log(err)
        }
    };

    function loadMore() {
        if (hasNextPage.current) {
            getBooks(page.current++);
        }
    }

    const handleScroll = (e) => {
        const { scrollLeft, scrollLeftMax } = e.target;

        if (scrollLeft >= scrollLeftMax - 50 && hasNextPage.current) loadMore();
    };

    useEffect(() => {
        if(!search) getBooks();
        //eslint-disable-next-line
    }, []);

    useEffect(() => {
        if(search) setBooks(search)
    }, [search])

    const bookList = useMemo(() => {
        if (Array.isArray(books) && books.length > 0) {
            return books.map((book) => {
                return <BookItem key={book._id} info={book} />;
            });
        }

        return skeleton();
    }, [books]);

    const title = useMemo(() => {
        if(search) return 'Truyện';
        return 'Truyện mới'
    }, [search])

    return (
        <section id="book">
            <h2 className="book__header">{title}</h2>
            <div className="book__container__wrapper" ref={wrapperRef}>
                <div
                    className="book__container"
                    ref={containerRef}
                    onScroll={!search ? handleScroll : undefined}
                >
                    <div className="book__list">{bookList}</div>
                </div>
            </div>
        </section>
    );
};
