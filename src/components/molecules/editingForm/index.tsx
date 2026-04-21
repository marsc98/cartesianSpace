import React, { useEffect, useRef, useState } from 'react';
import css from './index.module.scss';
import Carousel from '../carousel';
import {
  drawElementSelectionIndicator,
} from '../../organisms/Board3d/spaceElements';
import { useModal } from '../../../hooks/useModal';
import AnimationForm from '../animationForm';

function EditingForm(props) {
  const {
    activateMode,
    handleMarkPosition,
    isMobile,
    colorRef,
    sceneRef,
    lastIntersected,
    coordinates,
    editingInteractorRef,
    modalId,
  } = props;

  const { addModal, removeModal } = useModal();

  const options = [
    {
      id: 'dragHand',
      type: 'config',
      name: 'Reposicionar elemento',
      action: () => activateMode('freeReposition'),
    },
    {
      id: 'reposition',
      type: 'config',
      name: 'Reposicionar elemento no detalhe',
      action: () => activateMode('reposition'),
    },
    {
      id: 'rotation',
      type: 'config',
      name: 'Rotacionar Elemento',
      action: () => activateMode('rotation'),
    },
    {
      id: 'resize',
      type: 'config',
      name: 'Redimensionar Elemento',
      action: () => activateMode('scale'),
    },
    { id: 'copy', type: 'copy', name: 'Copiar', action: () => activateMode('copy') },
    { id: 'delete', type: 'config', name: 'Deletar', action: () => activateMode('delete') },
    {
      id: 'cameraRoll',
      type: 'action',
      name: 'Animar',
      action: () => activateMode('animation'),
    },
  ];

  useEffect(() => {
    const element = drawElementSelectionIndicator(
      lastIntersected.current,
      sceneRef,
    );
    return () => {
      if (editingInteractorRef?.current) {
        editingInteractorRef.current.initialX = coordinates.x;
        editingInteractorRef.current.initialY = coordinates.y;
      }
      element.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={css['editing-container']}>
      {/* selected={activeCreativityRef.current.id} */}
      <Carousel
        visibleColumns='3'
        selected={true}
        isMobile={false}
        active={true}
        handleSelection={(shape) => shape.action()}
        label={''}
        items={options}
        colorRef={colorRef}
        cardSize="m"
        cardIsSvg={true}
      />
    </div>
  );
}

export default EditingForm;
