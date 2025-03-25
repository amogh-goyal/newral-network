import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from "./landing.jsx";
import Signup from './signup.jsx'
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';


createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);