import "./MovieSingle.css";
import React, { useState, useEffect, useMemo, useReducer, useCallback } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { Ads } from "../Ads";
import { Rank } from "../Rank";
import { Comments } from "react-facebook";
import { Rating as PRRating } from "primereact/rating";
import { countryList } from "../../countryList";
import slugify from "slugify";
import millify from "millify";
import { Facebook } from "../Facebook";
import { TabMenu } from "primereact/tabmenu";
import { useLocalstorage } from "rooks";
import { Helmet } from 'react-helmet-async';
import { confirmDialog } from 'primereact/confirmdialog';




const SELECTED = {
  EP: "ep",
  SERVER: "server",
  FROMHASH: "fromhash",
};

const Video = ({ server }) => {
  const { type, link } = server || {};

  const video = useMemo(() => {
    let source;

    if (type === 'embed') source = link
    if (type === 'link') source = `/player/play.html?file=${link}`;

    if (source) {
      return (
        <iframe key={Date.now()} title="video" className="video__iframe" scrolling="no"
          src={source} frameBorder="0" allowFullScreen
        />
      )
    }
  }, [type, link])

  return (
    <div id="video">
      {video}
    </div>
  );
};

const HashNavLink = (props) => {
  const { hash } = useLocation();
  const { index, item, selected, isEp, to, className, activeClassName, onClick, ...restProps } = props;
  const isActive = useMemo(() => {
    if(!hash && index === 0) return true;
    if(hash) {
      if (isEp) {
        const epSlug = hash.split('-sv-')[0]
        return epSlug === to;
      }
      return hash === to
    }
  }, [index, hash, isEp, to])

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

const EpisodeItem = ({ index, selected, slug, ep, setEp }) => {
  return (
    <HashNavLink isEp index={index} to={slug} className='moviesingle-ep' item={ep}
      selected={selected} onClick={setEp} activeClassName='active'
    >
      {ep.name}
    </HashNavLink>
  );
};

const ServerItem = ({ index, selected, slug, server, setServer }) => {
  return (
    <HashNavLink index={index} to={slug} className='moviesingle-server' item={server}
      selected={selected} onClick={setServer} activeClassName='active'
    >
      {`Server ${server.name}`}
    </HashNavLink>
  );
};

const Episodes = ({ episodes, selected, setSelected }) => {
  const getHashSlug = (ep, index) => {
    const { name } = ep;

    const slug = !index ? name : `${name} sv ${index}`;

    const slugString = slugify(slug, {
      lower: true,
      locale: "vi",
    });

    return `#${slugString}`;
  };

  const setEp = (ep) => {
    setSelected({ type: SELECTED.EP, payload: ep });
  };

  const setServer = (server) => {
    setSelected({ type: SELECTED.SERVER, payload: server });
  };

  const epList = useMemo(() => {
    if (episodes) {
      return episodes.map((ep, index) => {
        return (
          <EpisodeItem
            index={index}
            key={JSON.stringify(ep)}
            selected={selected.ep}
            slug={getHashSlug(ep)}
            ep={ep}
            setEp={() => setEp(ep)}
          />
        );
      });
    }
    return null;

    //eslint-disable-next-line
  }, [episodes, selected.ep]);

  const servers = useMemo(() => {
    if (selected.ep) {
      const { servers } = selected.ep;

      return servers.map((server, index) => {
        return (
          <ServerItem
            index={index}
            key={JSON.stringify(server)}
            selected={selected.server}
            slug={getHashSlug(selected.ep, index)}
            server={server}
            setServer={() => setServer(server)}
          />
        );
      });
    }
    return null;
    //eslint-disable-next-line
  }, [selected]);

  return (
    <div className="moviesingle-episodes">
      <h2 className="moviesingle-episodes__header">Danh sách tập</h2>
      <div className="moviesingle-episodes__container">
        <div className="moviesingle-episodes__list">{epList}</div>
        <hr />
        <div className="moviesingle-episodes__servers">{servers}</div>
      </div>
    </div>
  );
};

const ExtensionMenu = ({ pathname }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    {
      key: 0,
      label: "Comment",
      component: (
        <div className="moviesingle__comment">
          <Comments orderBy='reverse_time' href={`https://yphim.com${pathname}/`} width="100%" />
        </div>
      ),
    },
    {
      key: 1,
      label: "Bảng xếp hạng",
      component: <Rank />,
    },
    {
      key: 2,
      label: "Bài viết Facebook",
      component: <Facebook />,
    },
  ];

  return (
    <div className="moviesingle-extension">
      <TabMenu
        model={items}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.value.key)}
      />
      <div className="moviesingle-extension__content">
        {items[activeIndex].component}
      </div>
    </div>
  );
};

const Rating = ({ rating, pathname, id }) => {
  const [rate, setRate] = useLocalstorage(`${pathname}:rating`, 0);

  const sendRating = (e) => {
    fetch(`/api/movie/${id}/rate/${rating}`);

    setRate(e.value);
  }

  const handleRating = (e) => {
    if (!rate) {
      const rating = e.value;

      const message = () => {
        // eslint-disable-next-line
        if (rating == 1)
          return 'Mày chắc chắn là không phải vì ngốk ngếk mà đánh giá phim này 1 sao chứ?';
        // eslint-disable-next-line 
        if (rating == 2)
          return 'Mày chắc chắn là không thù hằn gì mà đánh giá phim này 2 sao chứ?';
        // eslint-disable-next-line 
        if (rating == 3)
          return `Hỡi con hàng, ngươi chắc chắn muốn đánh giá 3 sao?`;
        // eslint-disable-next-line
        if (rating == 4)
          return 'Bắt đầu mê vì phim nên đánh giá 4 sao chứ gì?';
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
    <span className="moviesingle__rating">
      <strong>Đánh giá:&nbsp;</strong>
      <PRRating value={rate} onChange={handleRating} cancel={false} />
      {/* eslint-disable-next-line  */}
      {rating && rating != 0.0 ? ` ${rating}/5.0` : " Chưa có"}
    </span>
  );
};

const Views = ({ views }) => {
  return (
    <span className="moviesingle__views">
      <strong>Views:</strong>{" "}
      {views
        ? `${millify(views.total)} / Tuần: ${millify(
          views.weekly
        )} / Tháng: ${millify(views.monthly)}`
        : 0}
    </span>
  )
}

export const MovieSingle = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { slug } = useParams();
  const [selected, setSelected] = useReducer(handleSelect, {
    ep: null,
    server: null,
  });
  const [movie, setMovie] = useState();
  const { _id, title, note, country, episodes, latest, image, rating, views } =
    useMemo(() => movie || {}, [movie]);


  const noTrailingPathname = useMemo(() => {
    const hasTrailingSlash = /\/.*\/$/g;
    if (pathname.match(hasTrailingSlash)) {
      return pathname.replace(/\/+$/, "");
    }

    return pathname;
  }, [pathname]);

  function handleSelect(state, { type, payload }) {
    if (type === SELECTED.EP) {
      const { servers } = payload;

      return {
        ep: payload,
        server: servers[0],
      };
    }

    if (type === SELECTED.SERVER) {
      return {
        ...state,
        server: payload,
      };
    }
  }

  const getMovie = async () => {
    try {
      const res = await fetch(`/api/movie/${slug}`);
      if (res.status === 200) {
        const movie = await res.json();
        setMovie(movie);
        setSelected({ type: SELECTED.EP, payload: movie.episodes[0] });
      }
      else navigate('/not-found')
    } catch (err) {
      if (process.env.DEBUG) console.log(err);
    }
  };

  // Get initial data
  useEffect(() => {
    getMovie();
    //eslint-disable-next-line
  }, []);


  return (
    <>
      <Helmet>
        <title>{title ? title : 'Phim'}</title>
        <link rel='canonical' href={`https://yphim.com${noTrailingPathname}`} />
        <meta
          name="description"
          content={`Xem ${latest} - ${title} tại YPhim để cập nhật Vietsub mới nhất`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="keywords" content={`${title},${title} ${latest}, yphim, phim hay, phim mới, truyện hay, truyện mới`}></meta>

        <meta property="fb:app_id" content="1460552057751318" />

        <meta property="og:url" content={`https://yphim.com${noTrailingPathname}`} />
        <meta property="og:title" content={title + ' - YPhim - Phim hay - Truyện hay - Cập nhật nhanh'} />
        <meta property="og:description" content={`Xem ${latest} - ${title} tại YPhim để cập nhật Vietsub mới nhất`} />
        <meta property="og:image" content={image ? image.o : 'https://yphim.com/logo512.png'} />

        <meta property="twitter:url" content={`https://yphim.com${noTrailingPathname}`} />
        <meta property="twitter:title" content={title + ' - YPhim - Phim hay - Truyện hay - Cập nhật nhanh'} />
        <meta property="twitter:description" content={`Xem ${latest} - ${title} tại YPhim để cập nhật Vietsub mới nhất`} />
        <meta property="twitter:image" content={image ? image.o : 'https://yphim.com/logo512.png'} />
      </Helmet>
      <div id="moviesingle" className="container">
        <div className="content moviesingle-video">
          <Video server={selected.server} />
          <Ads />
        </div>
        <div className="sidebar moviesingle-detail">
          <div
            className="moviesingle-detail__background"
            style={{ backgroundImage: image ? `url(${image.m})` : undefined }}
          />
          <h1 className="moviesingle__title">{title}</h1>
          <span className="moviesingle__latest">
            <strong>Mới nhất:</strong> {latest}
          </span>
          <span className="moviesingle__country">
            <strong>Quốc gia:</strong> {countryList[country]}
          </span>
          <Rating rating={rating} pathname={noTrailingPathname} id={_id} />
          <Views views={views} />
          {note && <span className="moviesingle__note">{note}</span>}
          <Episodes
            episodes={episodes}
            selected={selected}
            setSelected={setSelected}
          />
          <ExtensionMenu pathname={noTrailingPathname} />
        </div>
      </div>
    </>
  );
};
