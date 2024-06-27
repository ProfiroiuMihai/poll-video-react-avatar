/* eslint-disable import/no-extraneous-dependencies */
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Toaster position="top-center" reverseOrder={false} />
    <App />
  </BrowserRouter>
);
