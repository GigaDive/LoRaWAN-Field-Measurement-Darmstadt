import * as React from 'react';
import {createRoot} from 'react-dom/client';
import { Provider } from 'react-redux';
import SurfaceLayout from './surfaceLayout'; 
import { store } from './store';

/**
 * Entry point for our react application. This application is for realtime monitoring and analyzing LoRa signal strength and quality measurements. 
 */
export default function App() {
  return (
    <>
          <Provider store={store}>
              <SurfaceLayout />
          </Provider>
        </>
    
  );
}

export function renderToDom(container) {
  createRoot(container).render(<App />);
}