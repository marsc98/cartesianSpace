import React, { useState, useRef } from 'react';
import css from './index.module.scss';

const Joystick = ({ moveCamera }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [boxShadow, setBoxShadow] = useState('none');
  const containerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startPosRef.current = {
      x: e.clientX || e.touches[0].clientX,
      y: e.clientY || e.touches[0].clientY
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    // Calculate position (limited to joystick boundaries)
    const maxDistance = 40; // Maximum distance from center
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    const newX = Math.cos(angle) * distance;
    const newY = Math.sin(angle) * distance;

    setPosition({ x: newX, y: newY });

    // Determine direction and set shadows
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        moveCamera('right', 1);
        setBoxShadow('15px 0 20px rgba(255, 255, 255, 0.7)');
      } else {
        moveCamera('left', 1);
        setBoxShadow('-15px 0 20px rgba(255, 255, 255, 0.7)');
      }
    } else {
      if (deltaY > 0) {
        moveCamera('down', 1);
        setBoxShadow('0 15px 20px rgba(255, 255, 255, 0.7)');
      } else {
        moveCamera('up', 1);
        setBoxShadow('0 -15px 20px rgba(255, 255, 255, 0.7)');
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setPosition({ x: 0, y: 0 });
    setBoxShadow('none');
    moveCamera(null);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  const handleTouchStart = (e) => {
    handleMouseDown(e);
  };

  const handleTouchMove = (e) => {
    handleMouseMove(e);
  };

  return (
    <div className={css["joystick-wrapper"]}>
      <div
        ref={containerRef}
        className={css["joystick"]}
        style={{ boxShadow }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div
          className={css["joystick-inner"]}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out'
          }}
        />
      </div>
    </div>
  );
};

export default Joystick;
