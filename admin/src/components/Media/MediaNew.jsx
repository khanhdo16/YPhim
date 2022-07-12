import React, { useState, useRef } from 'react'
import { FileUpload } from 'primereact/fileupload'
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar'
import { useAuth } from '../../use-auth'
import './MediaNew.css'

export const AdminMediaNew = () => {
    const auth = useAuth();
    const toast = useRef(null);
    const [progress, setProgress] = useState({})


    const onClear = () => setProgress({})

    const onRemove = (event) => {
        const { name } = event.file

        delete progress[name]
        setProgress(progress)
    }

    const uploadHandler = ({ files }) => {
        const uploaded = document.getElementsByClassName('uploaded').length

        if(uploaded !== files.length) {
            files.forEach(file => {
                if(!progress.hasOwnProperty(file.name)) {
                    if(auth.user.imgur == null || auth.user.imgur.access_token == null) {
                        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Chưa đăng nhập Imgur. Hãy đăng nhập Imgur trong Cài đặt' });
                        return;
                    }
    
                    const fileType = file.type.includes('audio') ? 'audio' : 'image'
                    const url = file.type.includes('audio') ? '/api/upload' : 'https://api.imgur.com/3/image'
                    const formdata = new FormData();
                    formdata.append(fileType, file)
    
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', url)
    
                    if (fileType === 'audio')
                        xhr.withCredentials = true
                    else
                        xhr.setRequestHeader('Authorization', `Bearer ${auth.user.imgur.access_token}`)
    
                    xhr.onprogress = (event) => {
                        setProgress(prev => {
                            return {
                                ...prev,
                                [file.name]: event.loaded * 100 / event.total
                            }
                        })
                    }
    
                    xhr.onerror = (e) => {
                        delete progress[file.name]
                        setProgress(progress)
    
                        toast.current.show({ severity: 'error', summary: 'Lỗi', detail: 'Lỗi máy chủ. Vui lòng thử lại.' });
                    }
    
                    xhr.onload = () => {
                        if (xhr.status === 200) {
                            if(fileType === 'image') {
                                const response = JSON.parse(xhr.response)
                                uploadImageToServer(response, file)
                            }
    
                            if(file.type === 'audio') {
                                updateClassName(file)
                                toast.current.show({severity: 'success', summary: 'Thành công', detail: `File đã tải lên: ${file.name}` });
                            }
                        }
                        else {
                            delete progress[file.name]
                            setProgress(progress)
    
                            toast.current.show({ severity: 'error', summary: 'Lỗi', detail: `Lỗi khi tải lên: ${file.name}. Vui lòng thử lại.` });
                        }
                    }
    
                    xhr.send(formdata)
                }
            })
        }
        else {
            toast.current.show({severity: 'info', detail: 'Tất cả file đã được tải lên.' });
        }
    }

    function updateClassName(file) {
        const list = document.getElementsByClassName('p-fileupload-filename')
        for (let item of list) {
            if(item.textContent === file.name) {
                const parent = item.parentElement
                parent.classList.add('uploaded')
            }
        }
    }

    function uploadImageToServer(res, file) {
        if (res && file) {
            const { id, link } = res.data
            const { name, type, size } = file

            const data = {
                imgurId: id,
                name: name,
                url: link,
                type: type,
                size: size,
            }

            fetch('/api/upload', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(res => {
                if(res.status === 200) {
                    updateClassName(file)
                    toast.current.show({severity: 'success', summary: 'Thành công', detail: `File đã tải lên: ${file.name}` });
                }
                else {
                    delete progress[file.name]
                    setProgress(progress)

                    toast.current.show({ severity: 'error', summary: 'Lỗi', detail: `Lỗi khi tải lên: ${file.name}. Vui lòng thử lại.` });
                }
            })
        }
    }

    const headerTemplate = (options) => {
        const { className, chooseButton, uploadButton, cancelButton } = options;

        return (
            <div className={className}>
                {chooseButton}
                {uploadButton}
                {cancelButton}
                <span className='admin-upload-size' style={{ marginLeft: 'auto' }}>Tối đa 10MB</span>
            </div>
        );
    }

    const itemTemplate = (file, options) => {
        return (
            <>
            <ProgressBar showValue={false} value={progress[file.name] ? progress[file.name] : 0} />
            {file.type.includes('image')
            ? <div className='admin-upload-preview'>
                <img alt={file.name} role="presentation" src={file.objectURL} width="100%" />
            </div>
            : undefined
            }
            {options.fileNameElement}
            {options.sizeElement}
            {progress[file.name] && progress[file.name] === 100
                ? undefined : options.removeElement
            }
            </>
        )
    }

    const fileUploadOptions = {
        name: 'media',
        customUpload: true,
        multiple: true,
        maxFileSize: 1024 * 1024 * 10,
        accept: 'image/*,audio/*',
        previewWidth: '100%',
        chooseLabel: 'Chọn file',
        uploadLabel: 'Tải lên',
        cancelLabel: 'Huỷ',
        uploadHandler: uploadHandler,
        onRemove: onRemove,
        onClear: onClear,
        headerTemplate: headerTemplate,
        itemTemplate: itemTemplate,
        progressBarTemplate: ' ',
        emptyTemplate: <p className="p-m-0">Kéo thả hoặc chọn file để tải lên.</p>,
        invalidFileSizeMessageSummary: 'Kích thước file quá lớn',
        invalidFileSizeMessageDetail: ', tối đa là 10mb.'
    }

    return (
        <>
            <h1>Tải lên</h1>
            <Toast ref={toast}></Toast>
            <FileUpload {...fileUploadOptions} />
        </>
    )
}