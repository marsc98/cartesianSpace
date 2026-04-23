import React, { useEffect, useState } from 'react';
import css from './index.module.scss';
import ColorPicker from '../../atoms/colorPicker';
import SizeSetter from '../../atoms/sizeSetter';
import Carousel from '../carousel';

function CreativityForm(props) {
  const {
    currentColor,
    setCurrentColor,
    activeCreativityRef,
    sizeRef,
    drawerRef,
    isMobile,
    setIsOwnCursorActive,
    setPencilIsActive,
    setElementsIsActive,
    colorRef,
    elementsRef,
    drawingRef,
    boardIsActive,
    setBoardIsActive,
    handleCreativity,
  } = props;
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedCarousel, setSelectedCarousel] = useState(
    activeCreativityRef.current.type,
  );
  const [actualizeColor, setActualizeColor] = useState(false);


  const elements3d = [
    {
      id: 'sphere',
      type: 'shapes',
      name: 'Esféra',
      img: '/images/elements/sphere.png',
    },
    {
      id: 'pyramid',
      type: 'shapes',
      name: 'Pirâmide',
      img: '/images/elements/pyramid.png',
    },
    {
      id: 'cylinder',
      type: 'shapes',
      name: 'Cilindro',
      img: '/images/elements/cylinder.png',
    },
    {
      id: 'cube',
      type: 'shapes',
      name: 'Cubo',
      img: '/images/elements/cube.png',
    },
    {
      id: 'arrow',
      type: 'shapes',
      name: 'Seta',
      img: '/images/elements/arrow.png',
    },
  ];

  const elements2d = [
    {
      id: 'circle',
      type: 'shapes',
      name: 'Círculo',
      img: '/images/elements/circle.png',
    },
    {
      id: 'line',
      type: 'shapes',
      name: 'Linha',
      img: '/images/elements/line.png',
    },
    {
      id: 'triangle',
      type: 'shapes',
      name: 'Triângulo',
      img: '/images/elements/triangle.png',
    },
    {
      id: 'square',
      type: 'shapes',
      name: 'Quadrado',
      img: '/images/elements/square.png',
    },
  ];

  const traces = [
    { id: '2dTrace', type: 'traces', name: '2D' },
    { id: '3dTrace', type: 'traces', name: '3D' },
    { id: 'optimizedTrace', type: 'traces', name: 'Traço Otimizado' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  function handleShapeSelection(shape) {
    setSelectedShape(shape.id);
    setElementsIsActive(true);
    drawingRef.current = true;
    elementsRef.current.shape = shape.id;
    elementsRef.current.type = shape.type;
    elementsRef.current.active = true;

    activeCreativityRef.current.name = shape.name;
    activeCreativityRef.current.id = shape.id;
    activeCreativityRef.current.type = shape.type;
    activeCreativityRef.current.img = shape.img;
  }

  function handleTraceSelection(shape) {
    setSelectedShape(shape.id);
    setElementsIsActive(false);
    drawingRef.current = true;
    elementsRef.current.active = false;
    elementsRef.current.shape = null;
    elementsRef.current.type = shape.type;

    activeCreativityRef.current.name = shape.name;
    activeCreativityRef.current.id = shape.id;
    activeCreativityRef.current.type = shape.type;
    activeCreativityRef.current.img = null;

    setIsOwnCursorActive(true);
    setPencilIsActive(true);
  }

  useEffect(() => {
    if (elementsRef.current.shape) {
      setSelectedShape(elementsRef.current.shape);
    } else {
      setSelectedShape('square');
    }
  }, []);


  return (
    <form className={css['shape-form-container']} onSubmit={handleSubmit}>
      <div className={css['shape-settings']} data-is-mobile={isMobile}>
        <ColorPicker
          colorRef={colorRef}
          label="Cor do elemento:"
          actualizeColor={setActualizeColor}
          ismobile={isMobile}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
        />

        <SizeSetter sizeRef={sizeRef} shouldRotate={true} colorRef={colorRef} />
      </div>

      <ul className={css['shapes-list']}>
        <li
          style={{ width: '100%' }}
          onClick={() => setSelectedCarousel('traces')}
        >
          <div className={css['elements']}>

            <h3>Traços</h3>
            <Carousel
              selected={activeCreativityRef.current.id}
              isMobile={isMobile}
              active={selectedCarousel === 'traces'}
              handleSelection={handleTraceSelection}
              items={traces}
              colorRef={colorRef}
              visibleColumns='3'

            />
          </div>
        </li>

        <li
          style={{ width: '100%' }}
          onClick={() => setSelectedCarousel('shapes')}
        >
          <div className={css['elements']}>
            <h3> Elementos <br/> 2D</h3>
            <Carousel
              selected={activeCreativityRef.current.id}
              isMobile={isMobile}
              active={selectedCarousel === 'shapes'}
              handleSelection={handleShapeSelection}
              items={elements2d}
              colorRef={colorRef}
              visibleColumns='3'
            />
          </div>
        </li>

        <li
          style={{ width: '100%' }}
          onClick={() => setSelectedCarousel('shapes')}
        >

          <div className={css['elements']}>
            <h3> Elementos <br/> 3D</h3>
            <Carousel
              selected={activeCreativityRef.current.id}
              isMobile={isMobile}
              active={selectedCarousel === 'shapes'}
              handleSelection={handleShapeSelection}
              items={elements3d}
              colorRef={colorRef}
              visibleColumns='3'
            />
          </div>
        </li>
      </ul>

    </form>
  );
}

export default CreativityForm;
