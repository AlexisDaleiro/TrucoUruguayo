import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import App from './App';
import {isAndroid} from './platform';
import {startPwa} from './pwa';
if(isAndroid)void import('./nativeRuntime').then(module=>module.startNative()).catch(()=>{});else startPwa();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
