import React from 'react';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { PanelMenu } from 'primereact/panelmenu';
import { Divider } from 'primereact/divider';
import { useMenu } from '../../use-menu';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../use-auth'
import './Menu.css';

export const AdminMenu = () => {
    const auth = useAuth()
    const location = useLocation()
    const { closed, setClosed } = useMenu()
    const { pathname } = location

    const subMenuTemplate = (item, options) => {
        const active = item.expanded ? ' active' : ''

        return (
            <a href={item.url} className={options.className + active} role='menuitem'>
                {item.icon ? <span className={options.iconClassName}></span> : undefined}
                {item.label ? <span className={options.labelClassName}>{item.label}</span> : undefined}
            </a>
        )
    }

    const items = React.useMemo(() => {
        return [
            {
                label: 'Trang chủ',
                icon: 'pi pi-home',
                url: '/',
                className: 'admin-menu-single',
                expanded: (pathname === '/'),
            },
            {
                label: 'Media',
                icon: 'pi pi-images',
                expanded: (pathname.includes('/media')),
                items: [
                    {
                        label: 'Tải lên',
                        icon: 'pi pi-plus',
                        url: '/media/new',
                        className: 'admin-menu-single',
                        expanded: (pathname === '/media/new'),
                        template: subMenuTemplate
                    },
                    {
                        label: 'Thư viện',
                        icon: 'pi pi-list',
                        url: '/media/image',
                        className: 'admin-menu-single',
                        expanded: (pathname.includes('/media')),
                        template: subMenuTemplate
                    }
                ]
            },
            {
                label: 'Phim',
                icon: 'pi pi-video',
                expanded: (pathname.includes('/movie')),
                items: [
                    {
                        label: 'Tạo phim mới',
                        icon: 'pi pi-plus',
                        url: '/movie/new',
                        className: 'admin-menu-single',
                        expanded: (pathname === '/movie/new'),
                        template: subMenuTemplate
                    },
                    {
                        label: 'Danh sách phim',
                        icon: 'pi pi-list',
                        url: '/movie',
                        expanded: (pathname === '/movie'),
                        template: subMenuTemplate
                    },
                ]
            },
            {
                label: 'Truyện',
                icon: 'pi pi-book',
                expanded: (pathname.includes('/book')),
                items: [
                    {
                        label: 'Tạo truyện mới',
                        icon: 'pi pi-plus',
                        url: '/book/new',
                        expanded: (pathname === '/book/new'),
                        template: subMenuTemplate
                    },
                    {
                        label: 'Danh sách truyện',
                        icon: 'pi pi-list',
                        url: '/book',
                        expanded: (pathname === '/book'),
                        template: subMenuTemplate
                    },
                ],
            },
            {
                template: () => {
                    return <Divider />;
                },
            },
            {
                label: 'Quảng cáo',
                icon: 'pi pi-dollar',
                className: 'admin-menu-single',
                url: '/ads',
                expanded: (pathname === '/ads'),
            },
            {
                label: 'Cài đặt',
                icon: 'pi pi-cog',
                className: 'admin-menu-single',
                url: '/settings',
                expanded: (pathname === '/settings'),
            },
        ]
        // eslint-disable-next-line
    }, [pathname])

    return (
        <div className={'z-5 ' + (closed ? 'admin-menu collapsed' : 'admin-menu')}>
            <div className='admin-menu-items'>
                <PanelMenu model={items} />
            </div>
            <div className='admin-menu-actions'>
                <Button
                    label='Đăng xuất'
                    icon='pi pi-sign-out'
                    onClick={() => {auth.logout()}}
                    className='admin-menu-logout p-button-rounded p-button-danger'
                />
                <ToggleButton
                    onIcon='pi pi-chevron-right'
                    offIcon='pi pi-chevron-left'
                    onLabel=''
                    offLabel=''
                    checked={closed}
                    onChange={() => setClosed(!closed)}
                    className='admin-menu-close p-button-rounded p-button-secondary'
                />
            </div>
        </div>
    );
}
