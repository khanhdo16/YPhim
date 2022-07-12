import './Announcement.css'
import React, { useState, useEffect } from 'react'


const TextInterval = ({items = []}) => {
    const duration = 9000;
    const [className, setClassName] = useState('fade-enter');
    const [active, setActive] = useState(0);

    useEffect(() => {
        if(items.length === 1) return;

        const repeat = setInterval(() => {
            setClassName('fade-enter')
            setActive(currActive => {
                if(currActive === items.length - 1) return 0
                return currActive + 1;
            })
        }, duration)

        return () => {
            clearInterval(repeat)
        }

        //eslint-disable-next-line
    }, [])

    useEffect(() => {
        if(className === 'fade-done') return;

        if(className === 'fade-enter') {
            setTimeout(() => {
                setClassName('fade-done')
            }, 100)
            return;
        }
    }, [className])


    return (
        <span
            className={`${className}${active === 0 ? ' first' : ''}`}
        >
            <span data-text={items[active]}>{items[active]}</span>
        </span>
    )
}

export const Announcement = () => {
    const text2 = 'Khuyến cáo không xem phim quá 180 phút một ngày, nếu không sẽ bị ảo phim, nhìn đâu cũng thấy idol.';
    const [text, setText] = useState();

    const getAnnouncement = async () => {
        try {
            const res = await fetch('/api/announcement')
            const { text } = res.status === 200 ? await res.json() : {};
            if(text) setText(text)
        }
        catch(err) {
            if(process.env.DEBUG) console.log(err)
        }
    }

    useEffect(() => getAnnouncement(), []) //eslint-disable-next-line

    return (
        <div id='announcement'>
            <TextInterval items={[text2, text]} />
        </div>
    )
}