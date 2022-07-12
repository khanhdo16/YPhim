import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { FacebookProvider } from 'react-facebook';


ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
    <FacebookProvider version='v14.0' language='vi_VN' appId='1460552057751318'>
      <App />
    </FacebookProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
