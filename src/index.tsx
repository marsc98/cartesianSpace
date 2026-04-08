import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import Board from './components/organisms/board';
import { CoordinatesProvider } from './hooks/useCoordinates';
import Board3d from './components/organisms/Board3d';
import { ModalProvider } from './hooks/useModal';
import { AppProviders } from './providers/AppProviders';
import { SketchProvider } from './hooks/useSketch';

const root = ReactDOM.createRoot(document.getElementById('root'));
const id = new URLSearchParams(window.location.search).get('pid');
const isBoard = new URLSearchParams(window.location.search).get('board');
const socketId = new URLSearchParams(window.location.search).get('bid');

root.render(
  <React.StrictMode>
    <ModalProvider>
      <AppProviders>
        <SketchProvider>
          <CoordinatesProvider>
            {/*id ? <PhoneControl /> : (is3d || socketId) ? <Board3d socketId={socketId} /> : <Board />*/}
            {isBoard ? <Board /> : <Board3d socketId={socketId} />}
          </CoordinatesProvider>
        </SketchProvider>
      </AppProviders>
    </ModalProvider>
  </React.StrictMode>,
);
