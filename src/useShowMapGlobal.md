/_ eslint-disable @typescript-eslint/no-explicit-any _/
/_ eslint-disable react/no-deprecated _/

import { useEffect, useState } from 'react';

import GlobalMap from '@components/map/components/global';
import { IUser } from '@src/lib/types/user';
import ReactDOM from 'react-dom';

import './styles/index.scss';

export default function Map() {
const [currentUser, setCurrentUser] = useState<IUser | null>(null);

useEffect(() => {
const handleMessage = request => {
if (request.type === 'AUTH_STATE_CHANGED') {
const user = request.payload;
setCurrentUser(user);
}
};

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };

}, []);

useEffect(() => {
chrome.runtime.sendMessage({ type: 'GET_USER' }, response => {
const user = response.payload;
setCurrentUser(user);
});
}, []);

const openModal = () => {
// Tạo div chứa modal
const modalContainer = document.createElement('div');
modalContainer.id = 'my-modal-container';
modalContainer.style.position = 'absolute';
modalContainer.style.top = '0';
modalContainer.style.height = '100%';
modalContainer.style.width = '100%';
modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
modalContainer.style.zIndex = '1000';

    // Thêm modal vào phần tử "main"
    const mainElement = document.querySelector(
      '#react-root > div > div > div.css-175oi2r.r-13qz1uu.r-417010.r-18u37iz > main',
    );
    mainElement.appendChild(modalContainer);

    // Component React để render
    const ModalComponent = () => (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          width: '100%',
          height: '100%',
        }}>
        <GlobalMap />
      </div>
    );

    // Render React component vào modal container
    ReactDOM.render(<ModalComponent />, modalContainer);

    // remove css
    const stopeventElement = document.querySelectorAll('.ol-overlaycontainer-stopevent');

    stopeventElement.forEach((element: any) => {
      if (element && element.style) {
        element.style.display = 'none';
      }
    });

};

const closeModal = () => {
const modalContainer = document.getElementById('my-modal-container');
if (modalContainer) {
modalContainer.remove();
}
};

useEffect(() => {
if (!currentUser) return;

    const intervalId = setInterval(() => {
      const moreButton = document.querySelector(
        '#react-root > div > div > div.css-175oi2r.r-13qz1uu.r-417010.r-18u37iz > header > div > div > div > div.css-175oi2r.r-1habvwh > div.css-175oi2r.r-15zivkp.r-1bymd8e.r-13qz1uu > nav > div',
      );

      if (moreButton) {
        clearInterval(intervalId);

        const newButton = document.createElement('a');
        newButton.setAttribute('role', 'button');
        newButton.innerText = 'Toggle Map';
        newButton.style.cursor = 'pointer';
        newButton.style.marginTop = '10px';
        newButton.style.marginLeft = '12px';

        newButton.onclick = () => {
          const modalExists = !!document.getElementById('my-modal-container');
          if (modalExists) {
            closeModal();
          } else {
            openModal();

            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }
        };

        moreButton.parentNode.insertBefore(newButton, moreButton.nextSibling);
      }
    }, 3000);

    return () => {
      clearInterval(intervalId);
    };

}, [currentUser]);
}
