import "./App.css";
import 'primereact/resources/themes/bootstrap4-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import React, { useEffect } from 'react'
import { Admin } from './components/Admin';
import { AdminSignIn } from './components/SignIn';
import { ProvideMenu } from './use-menu'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from "./use-auth";

function App() {
  const auth = useAuth();
  const location = useLocation();

  useEffect(() => {
    auth.getStatus() // eslint-disable-next-line
  }, [])

  if (auth.user) {
    return (
      <ProvideMenu>
        <Admin />
      </ProvideMenu>
    )
  }
  else {
    if(location.pathname !== '/') {
      return <Navigate to='/' />
    }

    return <AdminSignIn />
  }
}

export default App;
