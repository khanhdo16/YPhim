import './BookSingle.css'
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { InputText } from 'primereact/inputtext';
import Quill from 'quill';
import BlotFormatter, { ResizeAction, DeleteAction, ImageSpec } from 'quill-blot-formatter';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { Toast } from 'primereact/toast';
import { nanoid } from 'nanoid'
import { AdminImagePicker } from '../ImagePicker';
import { Tooltip } from 'primereact/tooltip';
import { Skeleton } from 'primereact/skeleton';
import { useMediaQuery } from 'react-responsive';
import slugify from 'slugify';
import { useBookValidate, BookValidateProvider } from './use-validate-book';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminAudioPicker } from '../AudioPicker';
import { useAuth } from '../../use-auth';

let toast = null

function BookTitle({ title, setTitle, slug, setSlug }) {
    const bookValidate = useBookValidate();

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
        if (bookValidate.error.slug === true)
            return 'Địa chỉ truyện là mục bắt buộc!';
        if (bookValidate.error.slug === 'existed')
            return 'Địa chỉ truyện này đã tồn tại, vui lòng chọn địa chỉ khác!';
        else
            return '';
    }, [bookValidate.error])

    return (
        <>
            <div className='booksingle-field-label'>
                <InputText id='title' className='booksingle-title' placeholder='Tiêu đề' value={title} onChange={updateTitle} />
                <small className="p-error ">{bookValidate.error.title ? 'Tiêu đề là mục bắt buộc!' : ''}</small>
            </div>
            <div className='booksingle-field-text'>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">{`${window.location.origin}/`}</span>
                    <InputText placeholder="ten-truyen" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} />
                </div>
                <small className="p-error ">{slugError}</small>
            </div>
        </>
    )
}

function BookField({ label, children }) {
    return (
        <div className='booksingle-field'>
            <h3 className='booksingle-field-label'>{label}</h3>
            <div className='booksingle-field-text'>
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

function ChapterList({ chapters, setChapters }) {
    const dragged = useRef();

    const renderChapters = useMemo(() => {
        const list = []

        chapters.forEach((chapter, id) => {
            list.push(
                <ChapterPanel
                    dragged={dragged}
                    key={id} chapters={chapters}
                    setChapters={setChapters}
                    chapter={chapter} id={id}
                />
            )
        })

        return list
        // eslint-disable-next-line
    }, [chapters])

    function ChapterMenu() {
        const createChapter = () => {
            setChapters(prev => new Map([
                ...prev,
                [nanoid(), null]
            ]))
        }

        return (
            <div className='booksingle-chapters-menu'>
                <Button icon='pi pi-plus' label='Chương mới' onClick={createChapter} />
            </div>
        )
    }

    return (
        <div className='booksingle-card'>
            <ChapterMenu />
            {renderChapters}
        </div>
    )
}

const DropPoint = ({ dragged, id, top, items, setItems, className, setEditing }) => {
    const onDragOver = (e) => {
        e.preventDefault();

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
        if(setEditing) setEditing(true)

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

function ChapterPanel({ dragged, chapters, setChapters, chapter, id }) {
    const { name: initName, content: initContent, music: initMusic, image: initImage } = chapter || {};
    const isMobile = useMediaQuery({ maxWidth: '768px' })
    const bookValidate = useBookValidate();
    const [error, setError] = useState({});
    const [picker, showPicker] = useState(false);
    const [name, setName] = useState(initName || '');
    const [content, setContent] = useState(initContent || '');
    const [music, setMusic] = useState(initMusic || {});
    const [image, setImage] = useState(initImage || '');
    const [editing, setEditing] = useState(true);

    const firstRender = useRef(true);


    const setDragSource = (e) => {
        const { value } = e.target.attributes['data-chapid']
        dragged.current = value;
    }

    const onEditing = (e) => {
        const { type } = e;

        if(type === 'mousedown' || type === 'touchstart') {
            setEditing(false);
        }
    }

    function validateChapter() {
        const chapter = chapters.get(id);
        let error = {};

        if (!chapter.name) error.name = 'Tên chương là mục bắt buộc!'
        if (!chapter.content) error.content = 'Nội dung là mục bắt buộc!'
        if (Object.keys(error).length === 0) error = null

        return error;
    }

    const headerTemplate = (options) => {
        const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
        const className = `${options.className} p-jc-start booksingle-chapter-header`;

        const headerDragProps = {
            onMouseDown: onEditing,
            onTouchStart: onEditing
        }

        const deleteChapter = () => {
            if (chapters.size > 1) {
                chapters.delete(id)
                setChapters(new Map(chapters))
            }
            else {
                if (toast) toast.current.show({ severity: 'warn', summary: 'Cảnh báo', detail: 'Truyện phải có ít nhất 1 chương!' })
            }
        }

        const updateName = (e) => {
            const { value } = e.target

            const getName = () => {
                if (value && typeof value === 'string') {
                    return value[0].toUpperCase() + value.slice(1);
                }
                else return value;
            }

            setName(getName())
        }

        return (
            <div className={className} {...headerDragProps}>
                <span className={options.titleClassName}>
                    <InputText className='booksingle-chapter-title' placeholder="Tên chương" value={name} onChange={updateName} />
                    {error && error.name ? <small className="p-error">{error.name}</small> : undefined}
                </span>
                <div className='booksingle-chapter-buttons'>
                    <Button icon='pi pi-trash' className='p-button-rounded p-button-danger'
                        label={isMobile ? undefined : 'Xoá'} onClick={deleteChapter}
                    />
                    <Button icon={toggleIcon} className='p-button-rounded p-button-outlined p-button-secondary'
                        onClick={options.onTogglerClick}
                    />
                </div>
            </div>
        )
    }

    //Validate chapter
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const error = validateChapter();
        setError(error)

        if (error) {
            bookValidate.setError(prev => {
                return { ...prev, chapters: true }
            });
        }
        else {
            bookValidate.setError(prev => {
                delete prev.chapters;
                return prev;
            });
        }
        // eslint-disable-next-line
    }, [bookValidate.validating]);

    //Update chapter info
    useEffect(() => {
        chapters.set(id, {
            name: name,
            content: content,
            music: music._id,
            image: image._id
        })
        setChapters(new Map(chapters))
        // eslint-disable-next-line
    }, [name, content, music, image])

    return (
        <>
            {picker ? <AdminImagePicker visible={picker} setVisible={showPicker} setLink={setImage} /> : undefined}
            <div
                className='booksingle-chapter-dragger'
                onDragStart={setDragSource}
                draggable={!editing} data-chapid={id}
            >
                <DropPoint top className='booksingle-chapter' setEditing={setEditing} dragged={dragged}
                    id={id} items={chapters} setItems={setChapters}
                />
                <Panel className='booksingle-panel booksingle-chapter' toggleable
                    headerTemplate={headerTemplate}
                >
                    <div className='booksingle-chapter-servers grid'>
                        <div className='col-9'>
                            <div className='booksingle-chapter-field'>
                                <ChapterContent content={content} setContent={setContent} />
                                {error && error.content ? <small className="p-error">{error.content}</small> : undefined}
                            </div>
                            <ChapterMusic music={music} setMusic={setMusic} />
                        </div>
                        <div className='col-3'>
                            {image ?
                                <ChapterImage image={image} showPicker={showPicker} />
                                : <Button className='w-full h-full p-button-outlined' label='Chọn ảnh bìa' onClick={() => { showPicker(true) }} />
                            }
                        </div>
                    </div>
                </Panel>
                <DropPoint className='booksingle-chapter' dragged={dragged} setEditing={setEditing}
                    id={id} items={chapters} setItems={setChapters}
                />
            </div>
        </>
    )
}

const quillToolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],

    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],

    ['blockquote', 'code-block', 'link', 'image'],

    ['clean']
];

class CustomImageSpec extends ImageSpec {
    getActions() {
        return [ResizeAction, DeleteAction];
    }
}

function ChapterContent({ content, setContent }) {
    const auth = useAuth();
    const firstRender = useRef(true);
    const quillRef = useRef();
    const quill = useRef();
    const [user, setUser] = useState(false);

    const insertImageToEditor = (url) => {
        const range = quill.current.getSelection();
        quill.current.insertEmbed(range.index, 'image', url);
    };

    const uploadToImgur = async (file) => {
        if (auth.user.imgur == null || auth.user.imgur.access_token == null) {
            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Chưa đăng nhập Imgur. Hãy đăng nhập Imgur trong Cài đặt' });
            return;
        }

        const url = 'https://api.imgur.com/3/image'
        const formdata = new FormData();
        formdata.append('image', file)

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${auth.user.imgur.access_token}` },
            body: formdata
        });

        if (res.status === 200) {
            const { data } = await res.json();
            if (data && data.link) insertImageToEditor(data.link);
        }
    }

    const selectLocalImage = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];
            uploadToImgur(file);
        };
    };

    useEffect(() => {
        if (!quillRef.current || quill.current) return;
        Quill.register('modules/blotFormatter', BlotFormatter);

        quill.current = new Quill(quillRef.current, {
            modules: {
                toolbar: quillToolbarOptions,
                blotFormatter: {
                    specs: [CustomImageSpec]
                }
            },
            theme: 'snow'
        })

        quill.current.on('text-change', () => {
            if (!user) setUser(true);
            setContent(quillRef.current.firstChild.innerHTML);
        });

        //eslint-disable-next-line
    }, [quill, quillRef])

    useEffect(() => {
        if (!firstRender.current || !quill.current || !content) return;
        firstRender.current = false;

        quill.current.getModule('toolbar').addHandler('image', selectLocalImage);

        if (!user) quill.current.clipboard.dangerouslyPasteHTML(content);

        //eslint-disable-next-line
    }, [firstRender, quill, content, user])


    return (
        <div className='booksingle-chapter-content'>
            <div ref={quillRef} />
        </div>
    )
}

function ChapterMusic({ music, setMusic }) {
    const [picker, showPicker] = useState(false);

    return (
        <>
            {picker ? <AdminAudioPicker visible={picker} setVisible={showPicker} setLink={setMusic} /> : undefined}
            <div className="p-inputgroup booksingle-chapter-field">
                <span className="p-inputgroup-addon">Nhạc</span>
                <InputText disabled value={music.name || 'Chọn file nhạc cho chương'} />
                <Button className='p-inputgroup-addon' label='Chọn' onClick={() => showPicker(true)} />
            </div>
        </>
    )
}

function ChapterImage({ image, showPicker }) {
    const imageType = !image.url ? null : image.url.match(/(\.\w{3,4}$)/g);
    const imageThumbnail = !image ? null : `https://i.imgur.com/${image.imgurId}l${imageType}`;

    return (
        <>
            <Tooltip target='.booksingle-chapter-image' position='top' />
            <div className='booksingle-chapter-image' data-pr-tooltip='Ấn để thay đổi ảnh bìa'>
                <img src={imageThumbnail} alt='' onClick={() => { showPicker(true) }} />
            </div>
        </>
    )
}

function BookSwitchButton({ label, value, setValue, onLabel, offLabel }) {
    return (
        <div className='booksingle-switch'>
            <span>{label}</span>
            <ToggleButton onLabel={onLabel} offLabel={offLabel} onIcon='pi pi-check-circle' offIcon='pi pi-times-circle'
                iconPos='right' checked={value} onChange={e => setValue(e.value)}
            />
        </div>
    )
}

function BookInfo({ info, setInfo }) {
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
        <Panel className='booksingle-panel' header='Thông tin' toggleable>
            <TextField label='Ngày đăng' value={date} disabled />
            <TextField label='Lượt views' value={views.total || 0} disabled />
            <TextField name='yu' label='Đánh giá của Yu' value={rating.yu} note='Max 5 điểm' onChange={handleChange} />
            <TextField name='guest' label='Đánh giá tổng' value={rating.guest} note='Max 5 điểm' onChange={handleChange} />
        </Panel>
    )
}

function ImagePreview({ image, showPicker }) {
    const imageType = !image.url ? null : image.url.match(/(\.\w{3,4}$)/g);
    const imageThumbnail = !image ? null : `https://i.imgur.com/${image.imgurId}l${imageType}`;

    return (
        <>
            <Tooltip target='#booksingle-image' position='top' />
            <div id='booksingle-image' style={{ width: '100%', paddingBottom: '150%', position: 'relative' }} data-pr-tooltip='Ấn để thay đổi ảnh bìa'>
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
        <div className='booksingle-loading'>
            <h1>Chỉnh sửa truyện</h1>
            <div className='grid'>
                <div className='booksingle-left col-9'>
                    <Skeleton shape="rectangle" className='booksingle-title booksingle-field-label' height='3rem' />
                    <Skeleton shape="rectangle" className='booksingle-field-text' height='2rem' />
                    <BookField label='Ghi chú'>
                        <Skeleton shape="rectangle" height='2rem' />
                    </BookField>
                    <BookField label='Danh sách chương'>
                        <Skeleton shape="rectangle" height='15rem' />
                    </BookField>
                    <BookField label='Nội dung'>
                        <Skeleton shape="rectangle" height='15rem' />
                    </BookField>
                </div>
                <div className='booksingle-right col-3'>
                    <Skeleton shape="rectangle" height='2rem' />
                    <Skeleton shape="rectangle" height='2rem' />
                    <Skeleton shape="rectangle" height='2rem' />
                    <Skeleton shape="rectangle" height='10rem' />
                    <Skeleton shape="rectangle" height='10rem' />
                </div>
            </div>
        </div>
    )
}

const AdminBookSingleTemplate = ({ create }) => {
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [note, setNote] = useState('')
    const [chapters, setChapters] = useState(new Map([[nanoid(), null]]))
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
    const [loading, setLoading] = useState(true)

    const bookValidate = useBookValidate();
    const firstRender = useRef(true);
    const navigate = useNavigate();
    const loadingCounter = useRef(0);

    const { id } = useParams();

    toast = useRef()

    const validateBookData = async () => {
        const validateRequiredData = (error) => {
            const data = {
                title: title,
                slug: slug,
                image: image,
            }

            for (const [key, value] of Object.entries(data)) {
                if (!value) error[key] = true;
            }
        }
        const checkSlug = async () => {
            const res = await fetch('/api/book/check-slug', {
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
        const error = await validateBookData();

        bookValidate.setValidating({});
        bookValidate.setError(error);
    }

    const setPostVisibility = async (published) => {
        const res = await fetch(`/api/book/${slug}`, {
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

    //Publish book
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        const sendPublish = () => {
            const { error } = bookValidate

            if (Object.keys(error).length === 0) {
                const chaptersList = Array.from(chapters.values())

                const data = {
                    title: title,
                    slug: slug,
                    note: note,
                    chapters: chaptersList,
                    published: published,
                    notif: notif,
                    completed: completed,
                    date: new Date(),
                    rating: info.rating,
                    image: image._id,
                }

                const url = create ? '/api/book/new' : `/api/book/${id}`;

                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                    .then(res => {
                        if (res.status === 200) {
                            navigate(`/book/${slug}`)
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
    }, [bookValidate.error])

    //Get data for first render posted book
    useEffect(() => {
        const generateChaptersMap = (chapters) => {
            const chapterList = chapters.map(chapter => {
                return [nanoid(), chapter]
            })

            return new Map(chapterList);
        }

        const getBook = async () => {
            const res = await fetch(`/api/book/${id}`);

            if (res.status === 200) {
                const data = await res.json();
                const chapters = generateChaptersMap(data.chapters);
                const date = new Date(data.date).toLocaleString('en-GB');

                setTitle(data.title)
                setSlug(data.slug)
                setNote(data.note || '')
                setChapters(chapters)
                setPublished(data.published)
                setCompleted(data.completed)
                setInfo({
                    date: date,
                    views: data.views,
                    rating: data.rating
                })
                setImage(data.image)
            }
        }

        if (!create) {
            getBook();
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
        bookValidate.setCreate(create);
    }, [create, bookValidate])

    return (
        <>
            {loading && !create ? <LoadingScreen /> : undefined}
            <Toast ref={toast} />
            {picker ? <AdminImagePicker visible={picker} setVisible={showPicker} setLink={setImage} /> : undefined}
            <h1>{create ? 'Tạo truyện' : 'Chỉnh sửa truyện'}</h1>
            <div className='grid'>
                <div className='booksingle-left col-9'>
                    <BookTitle title={title} setTitle={setTitle} slug={slug} setSlug={setSlug} />
                    <BookField label='Ghi chú'>
                        <InputText className='booksingle-note' placeholder='Lịch ra chap, ghi chú về truyện'
                            value={note} onChange={e => setNote(e.target.value)}
                        />
                    </BookField>
                    <BookField label='Danh sách chương'>
                        <ChapterList chapters={chapters} setChapters={setChapters} />
                    </BookField>
                </div>
                <div className='booksingle-right col-3'>
                    <Button className='w-full' label={create ? 'Đăng' : 'Cập nhật'} onClick={publishPost} />
                    <PublishedVisible create={create}>
                        <Button className='w-full' label={published ? 'Ẩn bài viết' : 'Công khai bài viết'} onClick={() => setPostVisibility(!published)} />
                    </PublishedVisible>
                    <BookSwitchButton label='Thông báo' value={notif} setValue={setNotif} onLabel='Bật' offLabel='Tắt' />
                    <BookSwitchButton label='Hoàn thành' value={completed} setValue={setCompleted} onLabel='Xong' offLabel='Chưa xong' />
                    <PublishedVisible create={create}>
                        <BookInfo info={info} setInfo={setInfo} />
                    </PublishedVisible>
                    <Panel className='booksingle-panel text-center' header='Ảnh bìa' toggleable>
                        {image ?
                            <ImagePreview image={image} showPicker={showPicker} />
                            : <Button className='w-full' label='Chọn ảnh bìa' onClick={() => { showPicker(true) }} />
                        }
                        <small className="p-error ">{bookValidate.error.image ? 'Ảnh bìa là mục bắt buộc!' : ''}</small>
                    </Panel>
                </div>
            </div>
        </>
    )
}

export const AdminBookSingle = ({ create }) => {
    useLayoutEffect(() => {
        const menuItems = document.getElementsByClassName('p-panelmenu-header-link')
        const thisItem = Array.from(menuItems).filter(item => item.text === 'Truyện')[0]

        if (thisItem.attributes['aria-expanded'].nodeValue === 'false')
            thisItem.click()
    })

    return (
        <BookValidateProvider>
            <AdminBookSingleTemplate create={create} />
        </BookValidateProvider>
    )
}