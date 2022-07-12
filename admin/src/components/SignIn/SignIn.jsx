import './SignIn.css'
import React, { useState } from "react";
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { useAuth } from '../../use-auth';

export const AdminSignIn = () => {
    const auth =  useAuth();
    const [checked, setChecked] = useState(false)

    const signin = (event) => {
        event.preventDefault()

        const fields = event.target.elements

        const data = {
            username: fields['username'].value,
            password: fields['password'].value,
            rememberme: checked
        }

        fetch('/api/signin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
            credentials: 'include'
        })
        .then(res => {
            if(res.status === 200 && !auth.user) {
                auth.getStatus()
            }
        })
    }

    return (
        <div className="form-signin flex align-items-center justify-content-center min-h-screen h-full">
            <div className="flex flex-column align-items-center surface-card p-4 shadow-2 border-round w-10 lg:w-4">
                <form className='w-11' onSubmit={signin}>
                    <label htmlFor="username" className="block text-900 font-medium mb-2">Tên đăng nhập</label>
                    <InputText id="username" type="text" className="w-full mb-3" />

                    <label htmlFor="password" className="block text-900 font-medium mb-2">Mật khẩu</label>
                    <InputText id="password" type="password" className="w-full mb-3" />

                    <div className="flex align-items-center justify-content-center mb-5">
                        <div className="flex align-items-center">
                            <Checkbox id="rememberme" onChange={() => setChecked(!checked)} checked={checked} binary className="mr-2" />
                            <label htmlFor="rememberme">Ghi nhớ mật khẩu?</label>
                        </div>
                    </div>

                    <Button type='submit' label="Đăng nhập" icon="pi pi-user" className="w-full" />
                </form>
            </div>
        </div>
    )
}