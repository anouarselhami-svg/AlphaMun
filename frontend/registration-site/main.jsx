import React from 'react';
import { createRoot } from 'react-dom/client';
import RegistrationApp from './App';
import '../src/styles.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><RegistrationApp /></React.StrictMode>);
