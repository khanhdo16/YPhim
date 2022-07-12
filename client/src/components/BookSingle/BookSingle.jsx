import './BookSingle.css';
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { Ads } from "../Ads";
import { Comments } from "react-facebook";
import { Rating as PRRating } from "primereact/rating";
import slugify from "slugify";
import millify from "millify";
import { Facebook } from "../Facebook";
import { TabMenu } from "primereact/tabmenu";
import { Skeleton } from "primereact/skeleton";
import { Button } from 'primereact/button';
import { useLocalstorage, useLocalstorageState, useIntersectionObserverRef, useOnWindowScroll } from "rooks";
import LZString from 'lz-string';
import { Markup } from 'interweave';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { confirmDialog } from 'primereact/confirmdialog';



const RESIZE = {
  INCR: 'increment',
  DECR: 'decrement',
  MIN: 100,
  MAX: 150,
  STEP: 10
}

const PAGE = {
  NEXT: 'next',
  PREV: 'prev'
}

const HashNavLink = (props) => {
  const { hash } = useLocation();
  const { item, selected, to, className, activeClassName, onClick, ...restProps } = props;
  const isActive = useMemo(() => {
    if (selected === item) return true;
    return hash === to
  }, [hash, selected, item, to])

  const setActive = useCallback(() => {
    if (isActive && (selected !== item)) onClick()
  }, [isActive, onClick, selected, item])

  useEffect(() => setActive(), [setActive])

  return (
    <Link to={to} onClick={onClick} {...restProps}
      className={isActive
        ? `${className} ${activeClassName}`
        : className
      }
    />
  )
}

const ChapterItem = ({ slug, selected, chap, setChap }) => {
  return (
    <HashNavLink to={slug} className='booksingle-chap' item={chap}
      selected={selected} onClick={setChap} activeClassName='active'
    >
      {chap.name}
    </HashNavLink>
  );
};

const Chapters = ({ chapters, selectedChap, setSelectedChap }) => {
  const getHashSlug = (chap) => {
    const { name } = chap;

    const slugString = slugify(name, {
      lower: true,
      locale: "vi",
    });

    return `#${slugString}`;
  };

  const chapList = useMemo(() => {
    if (chapters) {
      return chapters.map((chap) => {
        return (
          <ChapterItem
            key={JSON.stringify(chap)}
            selected={selectedChap}
            slug={getHashSlug(chap)}
            chap={chap}
            setChap={() => setSelectedChap(chap)}
          />
        );
      });
    }
    return null;

    //eslint-disable-next-line
  }, [chapters, selectedChap]);


  return (
    <div className="booksingle-chapters">
      <h2 className="booksingle-chapters__header">Danh sách chương</h2>
      <div className="booksingle-chapters__container">
        <div className="booksingle-chapters__list">{chapList}</div>
      </div>
    </div>
  );
};

const ChapterScrollTop = () => {
  const [display, setDisplay] = useState('none');

  const handleClick = () => {
    const content = document.getElementById('chapter-content');
    const toolbar = document.querySelector('.chapter-content__toolbar');

    if(content && toolbar) {
      const { top } = content.getBoundingClientRect();
      window.scrollBy({top: top - toolbar.offsetHeight})
    }
  }

  useOnWindowScroll(() => {
    const content = document.getElementById('chapter-content');

    if(content) {
      const { top } = content.getBoundingClientRect();

      const state = (top <= 0) ? 'flex' : 'none';
      if(display !== state) setDisplay(state)
    }
  })

  return (
    <button className="p-scrolltop p-link p-component p-scrolltop-enter-done"
      style={{zIndex: 1001, display: display}}
      type="button" onClick={handleClick}
    >
      <span className="p-scrolltop-icon pi pi-chevron-up"></span>
    </button>
  )
}

const ChapterContent = ({ chapters, selectedChap, setSelectedChap }) => {
  const { slug } = useParams();
  const { name, image, music } = selectedChap || {};
  const [text, setText] = useState();
  const [loading, setLoading] = useState(true);
  const [toolbarRef] = useIntersectionObserverRef(handleSticky, { threshold: 1 });
  const [fontSize, setFontSize] = useLocalstorageState('book:font-size', 100);

  const preventAction = {
    onCopy: e => e.preventDefault(),
    onPaste: e => e.preventDefault(),
    onCut: e => e.preventDefault(),
    onSelect: e => e.preventDefault(),
    onDrag: e => e.preventDefault(),
  }

  const animationSetting = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: 0.5
    }
  }

  const chapterIndex = useMemo(() => {
    setLoading(true);
    if (!chapters) return 0;
    const index = chapters.findIndex(item => item === selectedChap)
    return index >= 0 ? index : 0
  }, [chapters, selectedChap])

  function handleSticky([entries]) {
    const { boundingClientRect, isIntersecting } = entries;
    const isTop = !isIntersecting && boundingClientRect.top <= 0

    toolbarRef(node => {
      node.classList.toggle('top', isTop)
      return node
    })

    if (isTop) {
      const active = document.querySelector('.chapter-content__toolbar.top .booksingle-chap.active')
      if (active) active.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const fontResizer = (type) => {
    const isMin = fontSize === RESIZE.MIN && type === RESIZE.DECR;
    const isMax = fontSize === RESIZE.MAX && type === RESIZE.INCR;

    if (isMin || isMax) return;
    if (type === RESIZE.INCR) return setFontSize(fontSize + RESIZE.STEP)
    if (type === RESIZE.DECR) return setFontSize(fontSize - RESIZE.STEP)
  }

  const pageChanger = (type) => {
    if (type === PAGE.NEXT && chapters[chapterIndex + 1]) {
      return setSelectedChap(chapters[chapterIndex + 1])
    }

    if (type === PAGE.PREV && chapters[chapterIndex - 1]) {
      return setSelectedChap(chapters[chapterIndex - 1])
    }
  }

  const getContent = async (slug, chapIndex) => {
    try {
      const res = await fetch(`/api/book/${slug}/chap/${chapIndex}`);
      if (res.status === 200) {
        const text = await res.text();
        setText(text);
      }

    } catch (err) {
      if (process.env.DEBUG) console.log(err)
    }
  }

  const content = useMemo(() => {
    if (text) {
      const { style, content } = JSON.parse(LZString.decompressFromUTF16(text)) || {};

      if (style && content) {
        return {
          style: style,
          text: <Markup tagName='div' className='ql-editor' content={content} />
        }
      }

      return null;
    }

    return null;
  }, [text])

  useEffect(() => {
    getContent(slug, chapterIndex)
  }, [slug, chapterIndex])

  useEffect(() => {
    if (content) {
      setTimeout(() => {
        setLoading(false);
      }, 500)
    }
  }, [content])

  return (
    <>
      <Helmet>
        <style>{content && content.style}</style>
      </Helmet>
      <div className='chapter-content__toolbar' ref={toolbarRef}>
        <h3 className="chapter-content__title">{name}</h3>
        <div className='chapter-content__resizer'>
          <span>Kích cỡ chữ:</span>
          <Button icon='pi pi-minus' onClick={() => fontResizer(RESIZE.DECR)} />
          <Button icon='pi pi-plus' onClick={() => fontResizer(RESIZE.INCR)} />
        </div>
        <div className='chapter-content__paginator'>
          <Button label='Trở về' onClick={() => pageChanger(PAGE.PREV)} />
          <Button label='Tiếp theo' onClick={() => pageChanger(PAGE.NEXT)} />
        </div>
        <Chapters
          chapters={chapters}
          selectedChap={selectedChap}
          setSelectedChap={setSelectedChap}
        />
      </div>
      <div id="chapter-content" style={{ fontSize: `${fontSize}%` }} {...preventAction}>
        {
          loading
            ? <Skeleton width='100%' height='30rem' />
            : <AnimatePresence>
              {!loading
                && (
                  <motion.div {...animationSetting}>
                    {image && (<div className='chapter-content__image'><img src={image.l} alt='' /></div>)}
                    {music && (<audio className='chapter-content__music' src={music} controls autoPlay loop />)}
                    {content && (content.text)}
                  </motion.div>
                )
              }
            </AnimatePresence>
        }
        <ChapterScrollTop />
      </div>
    </>
  );
};


const ExtensionMenu = ({ pathname }) => {
  const [activeIndex, setActiveIndex] = useState(0);


  const items = [
    {
      key: 0,
      label: "Comment",
      component: (
        <div className="booksingle__comment">
          <Comments orderBy='reverse_time' numPosts='5' href={`https://yphim.com${pathname}/`} width="100%" />
        </div>
      ),
    },
    {
      key: 1,
      label: "Bài viết Facebook",
      component: <Facebook />,
    },
  ];

  return (
    <div className="booksingle-extension">
      <TabMenu
        model={items}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.value.key)}
      />
      <div className="booksingle-extension__content">
        {items[activeIndex].component}
      </div>
    </div>
  );
};

const Rating = ({ rating, pathname, id }) => {
  const [rate, setRate] = useLocalstorage(`${pathname}:rating`, 0);

  const sendRating = (e) => {
    fetch(`/api/book/${id}/rate/${rating}`);

    setRate(e.value);
  }

  const handleRating = (e) => {
    if (!rate) {
      const rating = e.value;

      const message = () => {
        // eslint-disable-next-line 
        if (rating == 1)
          return 'Mày chắc chắn là không phải vì ngốk ngếk mà đánh giá truyện này 1 sao chứ?';
        // eslint-disable-next-line 
        if (rating == 2)
          return 'Mày chắc chắn là không thù hằn gì mà đánh giá truyện này 2 sao chứ?';
        // eslint-disable-next-line 
        if (rating == 3)
          return `Hỡi con hàng, ngươi chắc chắn muốn đánh giá 3 sao?`;
        // eslint-disable-next-line
        if (rating == 4)
          return 'Bắt đầu mê truyện nên đánh giá 4 sao chứ gì?';
        // eslint-disable-next-line 
        if (rating == 5)
          return 'Hẳn là phải mê mể mề mê lắm nên mới đánh giá 5 sao chứ gì?'
      }

      confirmDialog({
        message: message(),
        header: 'Xác nhận đánh giá',
        icon: 'pi pi-exclamation-triangle',
        accept: () => sendRating(e),
        acceptLabel: 'Đánh giá',
        rejectLabel: 'Huỷ'
      });

      return;
    }

    return e.preventDefault();
  };

  return (
    <span className="booksingle__rating">
      <strong>Đánh giá:&nbsp;</strong>
      <PRRating value={rate} onChange={handleRating} cancel={false} />
      {/* eslint-disable-next-line  */}
      {rating && rating != 0.0 ? ` ${rating}/5.0` : " Chưa có"}
    </span>
  );
};

const Views = ({ views }) => {
  return (
    <span className="booksingle__views">
      <strong>Views:</strong>{" "}
      {views
        ? `${millify(views.total)} / Tuần: ${millify(
          views.weekly
        )} / Tháng: ${millify(views.monthly)}`
        : 0}
    </span>
  )
}

export const BookSingle = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { slug } = useParams();
  const [selectedChap, setSelectedChap] = useState();
  const [book, setBook] = useState();
  const { _id, title, note, chapters, latest, image, rating, views } =
    useMemo(() => book || {}, [book]);

  const noTrailingPathname = useMemo(() => {
    const hasTrailingSlash = /\/.*\/$/g;
    if (pathname.match(hasTrailingSlash)) {
      return pathname.replace(/\/+$/, "");
    }

    return pathname;
  }, [pathname]);

  const getBook = async () => {
    try {
      const res = await fetch(`/api/book/${slug}`);
      if (res.status === 200) {
        const book = await res.json();
        setBook(book);
        setSelectedChap(book.chapters[0]);
      }
      else navigate('/not-found')
    } catch (err) {
      if (process.env.DEBUG) console.log(err);
    }
  };

  // Get initial data
  useEffect(() => {
    getBook();
    //eslint-disable-next-line
  }, []);


  return (
    <>
      <Helmet>
        <title>{title ? `Truyện ${title}` : 'Truyện'}</title>
        <link rel='canonical' href={`https://yphim.com${noTrailingPathname}`} />
        <meta
          name="description"
          content={`Xem ${latest} - ${title} tại YPhim để cập nhật Vietsub mới nhất`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="keywords" content={`${title},${title} ${latest}, yphim, phim hay, phim mới, truyện hay, truyện mới`}></meta>

        <meta property="fb:app_id" content="1460552057751318" />

        <meta property="og:url" content={`https://yphim.com${noTrailingPathname}`} />
        <meta property="og:title" content={`Truyện ${title} - YPhim - Phim hay - Truyện hay - Cập nhật nhanh`} />
        <meta property="og:description" content={`Xem ${latest} - ${title} tại YPhim để cập nhật Vietsub mới nhất`} />
        <meta property="og:image" content={image ? image.o : 'https://yphim.com/logo512.png'} />

        <meta property="twitter:url" content={`https://yphim.com${noTrailingPathname}`} />
        <meta property="twitter:title" content={`Truyện ${title} - YPhim - Phim hay - Truyện hay - Cập nhật nhanh`} />
        <meta property="twitter:description" content={`Xem ${latest} - ${title} tại YPhim để cập nhật Vietsub mới nhất`} />
        <meta property="twitter:image" content={image ? image.o : 'https://yphim.com/logo512.png'} />
      </Helmet>
      <Ads />
      <div id="booksingle" className="container" onContextMenu={e => e.preventDefault()}>
        <div className="content booksingle-content">
          <ChapterContent
            chapters={chapters}
            selectedChap={selectedChap}
            setSelectedChap={setSelectedChap}
          />
        </div>
        <div className="sidebar booksingle-detail">
          <div
            className="booksingle-detail__background"
            style={{ backgroundImage: image ? `url(${image.m})` : undefined }}
          />
          <div className="booksingle-detail__wrapper">
            <h1 className="booksingle__title">{title}</h1>
            <span className="booksingle__latest">
              <strong>Mới nhất:</strong> {latest}
            </span>
            <Rating rating={rating} pathname={noTrailingPathname} id={_id} />
            <Views views={views} />
            {note && (<span className="booksingle__note">{note}</span>)}
            <Chapters
              chapters={chapters}
              selectedChap={selectedChap}
              setSelectedChap={setSelectedChap}
            />
            <ExtensionMenu pathname={noTrailingPathname} />
          </div>
        </div>
      </div>
    </>
  );
};
