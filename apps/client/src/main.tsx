import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><main><span>HECHO EN URUGUAY</span><h1>Truco de<br/>Boliche</h1><p>Se está armando la mesa.</p><a href="/api/health">Comprobar servidor</a></main></React.StrictMode>);
