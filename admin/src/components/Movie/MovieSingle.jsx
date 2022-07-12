import './MovieSingle.css'
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { nanoid } from 'nanoid'
import { AdminImagePicker } from '../ImagePicker';
import { Tooltip } from 'primereact/tooltip';
import { Skeleton } from 'primereact/skeleton';
import { useMediaQuery } from 'react-responsive';
import slugify from 'slugify';
import { useMovieValidate, MovieValidateProvider } from './use-validate-movie';
import { useNavigate, useParams } from 'react-router-dom';



let toast = null

function MovieTitle({ title, setTitle, slug, setSlug }) {
    const movieValidate = useMovieValidate();

    const updateTitle = (e) => {
        const { value } = e.target
        setTitle(value)
        generateSlug(value)
    }

    const generateSlug = (title) => {
        const slug = slugify(title, { lower: true, locale: 'vi', trim: true, remove: /[*+~.()'"!:@]/g })
        setSlug(slug)
    }

    const slugError = useMemo(() => {
        if (movieValidate.error.slug === true)
            return 'Địa chỉ phim là mục bắt buộc!';
        if (movieValidate.error.slug === 'existed')
            return 'Địa chỉ phim này đã tồn tại, vui lòng chọn địa chỉ khác!';
        else
            return '';
    }, [movieValidate.error])

    return (
        <>
            <div className='moviesingle-field-label'>
                <InputText id='title' className='moviesingle-title' placeholder='Tiêu đề' value={title} onChange={updateTitle} />
                <small className="p-error ">{movieValidate.error.title ? 'Tiêu đề là mục bắt buộc!' : ''}</small>
            </div>
            <div className='moviesingle-field-text'>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">{`${window.location.origin}/`}</span>
                    <InputText placeholder="ten-phim" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} />
                </div>
                <small className="p-error ">{slugError}</small>
            </div>
        </>
    )
}

function MovieField({ label, children }) {
    return (
        <div className='moviesingle-field'>
            <h3 className='moviesingle-field-label'>{label}</h3>
            <div className='moviesingle-field-text'>
                {children}
            </div>
        </div>
    )
}

function TextField(props) {
    const { label, note, ...textProps } = props;

    return (
        <div className='field w-full'>
            <label className='block mb-2'>{label}</label>
            <InputText className='block w-full' placeholder='••••••••' {...textProps} />
            {note ? <small className='text-primary'>{note}</small> : undefined}
        </div>
    )
}

function EpisodeList({ eps, setEps }) {
    const dragged = useRef();

    const renderEps = useMemo(() => {
        const list = []

        eps.forEach((ep, id) => {
            list.push(
                <EpisodePanel
                    dragged={dragged}
                    key={id} eps={eps}
                    setEps={setEps}
                    ep={ep} id={id}
                />
            )
        })

        return list
        // eslint-disable-next-line
    }, [eps])

    function EpisodeMenu() {
        const createEp = () => {
            setEps(prev => new Map([
                ...prev,
                [nanoid(), null]
            ]))
        }

        return (
            <div className='moviesingle-eps-menu'>
                <Button icon='pi pi-plus' label='Tập mới' onClick={createEp} />
            </div>
        )
    }

    return (
        <div className='moviesingle-card'>
            <EpisodeMenu />
            {renderEps}
        </div>
    )
}

const DropPoint = ({ dragged, id, top, items, setItems, className }) => {
    const onDragOver = (e) => {
        e.preventDefault();

        if(!items.has(dragged.current)) return;
        if (dragged.current === id) return;

        e.target.classList.toggle('active', true);
    }

    const onDragLeave = (e) => {
        e.target.classList.toggle('active', false);

        if (dragged.current === id) return;
    }

    const onDrop = (e) => {
        e.preventDefault();
        e.target.classList.toggle('active', false);

        if(!items.has(dragged.current)) return;
        if (dragged.current === id) return;
        if (!dragged.current || !id || !items || !setItems) return;

        const newItems = Array.from(items.entries());
        const sourceIndex = newItems.findIndex(item => item[0] === dragged.current);
        const destIndex = newItems.findIndex(item => item[0] === id);

        if(sourceIndex >= 0 && destIndex >= 0) {
            const isFirstPosition = destIndex === 0 && top;
            const isTopDown = sourceIndex < destIndex
            const insertAt =  (isTopDown || isFirstPosition) ? destIndex : destIndex + 1;

            newItems.splice(insertAt, 0, newItems.splice(sourceIndex, 1)[0]);
            setItems(new Map(newItems));
        }
    }

    const dragListeners = {
        onDragOver,
        onDragLeave,
        onDrop
    }

    return <div className={`${className ? className + ' ' : ''}drop-point`} {...dragListeners} />
}

function EpisodePanel({ dragged, eps, setEps, ep, id }) {
    const { name: initName, servers: initServers } = ep || {};
    const isMobile = useMediaQuery({ maxWidth: '768px' })
    const movieValidate = useMovieValidate();
    const serverTemplate = [[nanoid(), { name: '', type: 'link', link: '' }]];
    const [servers, setServers] = useState(initServers || new Map(serverTemplate))
    const [name, setName] = useState(initName || '');
    const [error, setError] = useState();
    const serverDragged = useRef();

    const setDragSource = (e) => {
        const { value } = e.target.attributes['data-epid']
        dragged.current = value;
    }

    const firstRender = useRef(true);

    const headerTemplate = (options) => {
        const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
        const className = `${options.className} p-jc-start moviesingle-ep-header`;

        const deleteEp = () => {
            if (eps.size > 1) {
                eps.delete(id)
                setEps(new Map(eps))
            }
            else {
                if (toast) toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: 'Phim phải có ít nhất 1 tập!' })
            }
        }

        const createServer = () => {
            setServers(prev => new Map([
                ...prev,
                [nanoid(), { type: 'link' }]
            ]))
        }

        const updateName = (e) => {
            const { value } = e.target
            const prev = eps.get(id)

            const getName = () => {
                if (value && typeof value === 'string') {
                    return value[0].toUpperCase() + value.slice(1);
                }
                else return value;
            }

            eps.set(id, { ...prev, name: getName() })

            setName(getName())
            setEps(new Map(eps))
        }

        return (
            <div className={className}>
                <span className={options.titleClassName}>
                    <InputText className='moviesingle-ep-title' placeholder="Tên tập" value={name} onChange={updateName} />
                    {error ? <small className="p-error">{error}</small> : undefined}
                </span>
                <div className='moviesingle-ep-buttons'>
                    <Button icon='pi pi-plus' className='p-button-rounded'
                        label={isMobile ? undefined : 'Server'} onClick={createServer}
                    />
                    <Button icon='pi pi-trash' className='p-button-rounded p-button-danger'
                        label={isMobile ? undefined : 'Xoá'} onClick={deleteEp}
                    />
                    <Button icon={toggleIcon} className='p-button-rounded p-button-outlined p-button-secondary'
                        onClick={options.onTogglerClick}
                    />
                </div>
            </div>
        )
    }

    function validateTitle() {
        const ep = eps.get(id);
        let error = '';

        if (!ep.name) error = 'Tên tập là mục bắt buộc!'

        return error;
    }


    const renderServers = useMemo(() => {
        const list = []

        servers.forEach((server, id) => {
            list.push(
                <ServerSingle dragged={serverDragged} key={id} servers={servers}
                    setServers={setServers} server={server} id={id}
                />
            )
        })

        return list
    }, [servers])

    //Update servers
    useEffect(() => {
        const prev = eps.get(id)
        eps.set(id, { ...prev, servers: servers })

        setEps(new Map(eps))
        // eslint-disable-next-line
    }, [servers])

    //Validate
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const error = validateTitle();
        setError(error);

        if (error) {
            movieValidate.setError(prev => {
                return { ...prev, eps: true }
            });
        }
        else {
            movieValidate.setError(prev => {
                delete prev.eps;
                return prev;
            });
        }
        // eslint-disable-next-line
    }, [movieValidate.validating]);


    return (
        <div
            className='moviesingle-ep-dragger'
            onDragStart={setDragSource}
            draggable data-epid={id}
        >
            <DropPoint top className='moviesingle-ep' dragged={dragged}
                id={id} items={eps} setItems={setEps}
            />
            <Panel className='moviesingle-panel moviesingle-ep'
                headerTemplate={headerTemplate} toggleable
            >
                <div className='moviesingle-ep-servers'>
                    {renderServers}
                </div>
            </Panel>
            <DropPoint className='moviesingle-ep' dragged={dragged}
                id={id} items={eps} setItems={setEps}
            />
        </div>
    )
}

function ServerSingle({ dragged, servers, setServers, server, id }) {
    const { type: initType } = server || {};
    const isMobile = useMediaQuery({ maxWidth: '768px' });
    const movieValidate = useMovieValidate();
    const [type, setType] = useState(initType || 'link');
    const typeOptions = [
        { label: 'Link', value: 'link' },
        { label: 'Embed', value: 'embed' }
    ];

    const errorRef = useRef();
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const error = validateServer();
        errorRef.current.textContent = error;

        if (error) {
            movieValidate.setError(prev => {
                return { ...prev, servers: true }
            });
        }
        else {
            movieValidate.setError(prev => {
                delete prev.servers;
                return prev;
            });
        }
        // eslint-disable-next-line
    }, [movieValidate.validating]);

    const setDragSource = (e) => {
        const { value } = e.target.attributes['data-svid']
        dragged.current = value;
    }

    function validateServer() {
        const server = servers.get(id);
        let error = '';

        if (!server.name) error += 'tên server, '
        if (!server.type) error += 'loại link, '
        if (!server.link) error += 'link, '

        if (error) {
            error = error.slice(0, -2) + ' là mục bắt buộc!'
            error = error[0].toUpperCase() + error.slice(1);
        }

        return error;
    }

    const deleteServer = () => {
        if (servers.size > 1) {
            servers.delete(id)
            setServers(new Map(servers))
        }
        else {
            if (toast) toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: 'Tập phim phải có ít nhất 1 server!' })
        }
    }

    const updateServer = (e) => {
        const { name, value } = e.target
        const server = servers.get(id)

        switch (name) {
            case 'server-name':
                servers.set(id, { ...server, name: value })
                break;
            case 'server-type':
                servers.set(id, { ...server, type: e.value })
                setType(e.value)
                break;
            case 'server-link':
                servers.set(id, { ...server, link: value })
                break;
            default:
                console.log('Invalid input.')
        }

        setServers(new Map(servers))
    }

    const getServer = useMemo(() => {
        return servers.get(id)
    }, [servers, id])

    return (
        <div
            className='moviesingle-ep-server-dragger'
            onDragStart={setDragSource}
            draggable data-svid={id}
        >
            <DropPoint top className='moviesingle-ep-server' dragged={dragged}
                id={id} items={servers} setItems={setServers}
            />
            <div className="moviesingle-ep-server">
                <div className='p-inputgroup'>
                    <span className="p-inputgroup-addon">Server</span>
                    <InputText name='server-name' style={{ maxWidth: isMobile ? '15%' : '10%' }} placeholder='1' value={getServer.name || ''} onChange={updateServer} />
                    <Dropdown name='server-type' style={{ maxWidth: 'max-content' }} className='p-inputgroup-addon'
                        options={typeOptions} value={type} onChange={updateServer}
                    />
                    <InputText name='server-link' className='moviesingle-ep-server-link' value={getServer.link || ''} onChange={updateServer} placeholder='https://example.com/videoembedlink' />
                    <Button className='p-button-danger' icon='pi pi-trash' onClick={deleteServer} />
                </div>
                <small className="p-error " ref={errorRef}></small>
            </div>
            <DropPoint className='moviesingle-ep-server' dragged={dragged}
                id={id} items={servers} setItems={setServers}
            />
        </div>
    )
}

function MovieSwitchButton({ label, value, setValue, onLabel, offLabel }) {
    return (
        <div className='moviesingle-switch'>
            <span>{label}</span>
            <ToggleButton onLabel={onLabel} offLabel={offLabel} onIcon='pi pi-check-circle' offIcon='pi pi-times-circle'
                iconPos='right' checked={value} onChange={e => setValue(e.value)}
            />
        </div>
    )
}

function MovieInfo({ info, setInfo }) {
    const { date, views, rating } = info;

    const handleChange = (e) => {
        const { name, value } = e.target

        setInfo(prev => {
            return {
                ...prev, rating: {
                    ...rating,
                    [name]: value
                }
            }
        })
    }

    return (
        <Panel className='moviesingle-panel' header='Thông tin' toggleable>
            <TextField label='Ngày đăng' value={date} disabled />
            <TextField label='Lượt views' value={views.total || 0} disabled />
            <TextField name='yu' label='Đánh giá của Yu' value={rating.yu} note='Max 5 điểm' onChange={handleChange} />
            <TextField name='guest' label='Đánh giá tổng' value={rating.guest} note='Max 5 điểm' onChange={handleChange} />
        </Panel>
    )
}

function CountryPicker({ selectedCountry, setSelectedCountry }) {
    const countries = [
        { label: 'Thái Lan', value: 'thai-lan' },
        { label: 'Đài Loan', value: 'dai-loan' },
        { label: 'Hàn Quốc', value: 'han-quoc' },
        { label: 'Trung Quốc', value: 'trung-quoc' },
        { label: 'Nhật Bản', value: 'nhat-ban' },
        { label: 'Phillipines', value: 'phillipines' },
        { label: 'Hong Kong', value: 'hong-kong' }
    ]

    return (
        <Dropdown className='moviesingle-country' value={selectedCountry} options={countries}
            onChange={(e) => setSelectedCountry(e.value)} placeholder="Chọn quốc gia"
        />
    )
}

function ImagePreview({ image, showPicker }) {
    const imageType = !image.url ? null : image.url.match(/(\.\w{3,4}$)/g);
    const imageThumbnail = !image ? null : `https://i.imgur.com/${image.imgurId}l${imageType}`;

    return (
        <>
            <Tooltip target='#moviesingle-image' position='top' />
            <div id='moviesingle-image' style={{ width: '100%', paddingBottom: '150%', position: 'relative' }} data-pr-tooltip='Ấn để thay đổi ảnh bìa'>
                <img style={{ cursor: 'pointer', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} src={imageThumbnail} width='100%' height='100%' alt='' onClick={() => { showPicker(true) }} />
            </div>
        </>
    )
}

function PublishedVisible({ create, children }) {
    if (create) return <></>;
    else return children;
}

function LoadingScreen() {
    return (
        <div className='moviesingle-loading'>
            <h1>Chỉnh sửa phim</h1>
            <div className='grid'>
                <div className='moviesingle-left col-9'>
                    <Skeleton shape="rectangle" className='moviesingle-title moviesingle-field-label' height='3rem' />
                    <Skeleton shape="rectangle" className='moviesingle-field-text' height='2rem' />
                    <MovieField label='Ghi chú'>
                        <Skeleton shape="rectangle" height='2rem' />
                    </MovieField>
                    <MovieField label='Danh sách tập'>
                        <Skeleton shape="rectangle" height='15rem' />
                    </MovieField>
                    <MovieField label='Nội dung'>
                        <Skeleton shape="rectangle" height='15rem' />
                    </MovieField>
                </div>
                <div className='moviesingle-right col-3'>
                    <Skeleton shape="rectangle" height='2rem' />
                    <Skeleton shape="rectangle" height='2rem' />
                    <Skeleton shape="rectangle" height='2rem' />
                    <Skeleton shape="rectangle" height='10rem' />
                    <Skeleton shape="rectangle" height='10rem' />
                    <Skeleton shape="rectangle" height='10rem' />
                </div>
            </div>
        </div>
    )
}

const AdminMovieSingleTemplate = ({ create }) => {
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [note, setNote] = useState('')
    const [eps, setEps] = useState(new Map([[nanoid(), null]]))
    const [published, setPublished] = useState(true)
    const [notif, setNotif] = useState(true)
    const [completed, setCompleted] = useState(false)
    const [info, setInfo] = useState({
        date: '',
        views: {},
        rating: { guest: 0, yu: 0 },
    })
    const [picker, showPicker] = useState(false)
    const [image, setImage] = useState()
    const [country, setCountry] = useState()
    const [loading, setLoading] = useState(true)

    const movieValidate = useMovieValidate();
    const firstRender = useRef(true);
    const navigate = useNavigate();
    const loadingCounter = useRef(0);

    const { id } = useParams();

    toast = useRef()

    const validateMovieData = async () => {
        const validateRequiredData = (error) => {
            const data = {
                title: title,
                slug: slug,
                image: image,
                country: country
            }

            for (const [key, value] of Object.entries(data)) {
                if (!value) error[key] = true;
            }
        }
        const checkSlug = async () => {
            const res = await fetch('/api/movie/check-slug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: slug })
            })

            if (res.status === 400) return false;
            return true;
        }

        const error = {};
        const slugAvailable = await checkSlug();

        validateRequiredData(error);
        if (!slugAvailable && slug !== id && slug !== 'new') error.slug = 'existed';

        return error;
    }

    const publishPost = async () => {
        const error = await validateMovieData();

        movieValidate.setValidating({});
        movieValidate.setError(error);
    }

    const setPostVisibility = async (published) => {
        const res = await fetch(`/api/movie/${slug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: published })
        })

        if (res.status === 200) {
            if (toast) toast.current.show({ severity: 'success', summary: 'Thành công', detail: `Bài viết đã ${published ? 'được công khai.' : 'bị ẩn đi.'}` })
            setPublished(published);
        }
        if (res.status === 400) {
            if (toast) toast.current.show({ severity: 'error', summary: 'Lỗi', detail: `${published ? 'Công khai' : 'Ẩn'} bài viết không thành công!` })
        }
    }

    //Publish movie
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const sendPublish = () => {
            const { error } = movieValidate

            if (Object.keys(error).length === 0) {
                const epsList = Array.from(eps.values())

                const epsData = epsList.map(ep => {
                    const { name, servers } = ep;

                    return {
                        name: name,
                        servers: Array.from(servers.values())
                    }
                })

                const data = {
                    title: title,
                    slug: slug,
                    note: note,
                    episodes: epsData,
                    published: published,
                    notif: notif,
                    completed: completed,
                    date: new Date(),
                    rating: info.rating,
                    country: country,
                    image: image._id,
                }

                const url = create ? '/api/movie/new' : `/api/movie/${id}`;

                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                    .then(res => {
                        if (res.status === 200) {
                            navigate(`/movie/${slug}`)
                            if (toast) toast.current.show({ severity: 'success', summary: 'Thành công', detail: `${create ? 'Đăng bài' : 'Cập nhật'} thành công!` })
                        }
                        if (res.status === 400) {
                            if (toast) toast.current.show({ severity: 'error', summary: 'Lỗi', detail: `${create ? 'Đăng bài' : 'Cập nhật'} không thành công!` })
                        }
                    })
            }
        }

        sendPublish();

        // eslint-disable-next-line
    }, [movieValidate.error])

    //Get data for first render posted movie
    useEffect(() => {
        const generateServersMap = (servers) => {
            const serverList = servers.map(server => {
                delete server._id;
                return [nanoid(), { ...server }]
            })

            return new Map(serverList);
        }

        const generateEpsMap = (eps) => {
            const epList = eps.map(ep => {
                const { name, servers } = ep;

                return [nanoid(), {
                    name: name,
                    servers: generateServersMap(servers)
                }]
            })

            return new Map(epList);
        }

        const getMovie = async () => {
            const res = await fetch(`/api/movie/${id}`);

            if (res.status === 200) {
                const data = await res.json();
                const eps = generateEpsMap(data.episodes);
                const date = new Date(data.date).toLocaleString('en-GB');

                setTitle(data.title)
                setSlug(data.slug)
                setNote(data.note || '')
                setEps(eps)
                setPublished(data.published)
                setCompleted(data.completed)
                setInfo({
                    date: date,
                    views: data.views,
                    rating: data.rating
                })
                setCountry(data.country)
                setImage(data.image)
            }
        }

        if (!create) {
            getMovie();
        }
        // eslint-disable-next-line
    }, [])

    //Show loading screen on first load
    useEffect(() => {
        if (loadingCounter.current < 1) {
            loadingCounter.current++;
            return;
        }

        setTimeout(() => {
            setLoading(false);
        }, 500)
        // eslint-disable-next-line
    }, [image])

    //Update create state
    useEffect(() => {
        movieValidate.setCreate(create);
    }, [create, movieValidate])

    return (
        <>
            {loading && !create ? <LoadingScreen /> : undefined}
            <Toast ref={toast} />
            {picker ? <AdminImagePicker visible={picker} setVisible={showPicker} setLink={setImage} /> : undefined}
            <h1>{create ? 'Tạo phim' : 'Chỉnh sửa phim'}</h1>
            <div className='grid'>
                <div className='moviesingle-left col-9'>
                    <MovieTitle title={title} setTitle={setTitle} slug={slug} setSlug={setSlug} />
                    <MovieField label='Ghi chú'>
                        <InputText className='moviesingle-note' placeholder='Lịch chiếu, ghi chú về phim'
                            value={note} onChange={e => setNote(e.target.value)}
                        />
                    </MovieField>
                    <MovieField label='Danh sách tập'>
                        <EpisodeList eps={eps} setEps={setEps} />
                    </MovieField>
                </div>
                <div className='moviesingle-right col-3'>
                    <Button className='w-full' label={create ? 'Đăng' : 'Cập nhật'} onClick={publishPost} />
                    <PublishedVisible create={create}>
                        <Button className='w-full' label={published ? 'Ẩn bài viết' : 'Công khai bài viết'} onClick={() => setPostVisibility(!published)} />
                    </PublishedVisible>
                    <MovieSwitchButton label='Thông báo' value={notif} setValue={setNotif} onLabel='Bật' offLabel='Tắt' />
                    <MovieSwitchButton label='Hoàn thành' value={completed} setValue={setCompleted} onLabel='Xong' offLabel='Chưa xong' />
                    <PublishedVisible create={create}>
                        <MovieInfo info={info} setInfo={setInfo} />
                    </PublishedVisible>
                    <Panel className='moviesingle-panel' header='Quốc gia' toggleable>
                        <CountryPicker selectedCountry={country} setSelectedCountry={setCountry} />
                        <small className="p-error ">{movieValidate.error.country ? 'Quốc gia là mục bắt buộc!' : ''}</small>
                    </Panel>
                    <Panel className='moviesingle-panel text-center' header='Ảnh bìa' toggleable>
                        {image ?
                            <ImagePreview image={image} showPicker={showPicker} />
                            : <Button className='w-full' label='Chọn ảnh bìa' onClick={() => { showPicker(true) }} />
                        }
                        <small className="p-error ">{movieValidate.error.image ? 'Ảnh bìa là mục bắt buộc!' : ''}</small>
                    </Panel>
                </div>
            </div>
        </>
    )
}

export const AdminMovieSingle = ({ create }) => {
    useLayoutEffect(() => {
        const menuItems = document.getElementsByClassName('p-panelmenu-header-link')
        const thisItem = Array.from(menuItems).filter(item => item.text === 'Phim')[0]

        if (thisItem.attributes['aria-expanded'].nodeValue === 'false')
            thisItem.click()
    })

    return (
        <MovieValidateProvider>
            <AdminMovieSingleTemplate create={create} />
        </MovieValidateProvider>
    )
}