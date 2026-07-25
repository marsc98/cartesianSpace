import React, { useEffect, useRef, useCallback } from 'react';
import css from './index.module.scss';
import Item from '../../atoms/item';
import { colorToFilter } from '../../../utils/functions';
import {
  drawElementSelectionIndicator,
} from '../../organisms/Board3d/spaceElements';
import { useModal } from '../../../hooks/useModal';

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
    onGroup,
    ungroupAll,
    ungroupSingle,
    pushHistory,
    notify,
    temporarySelectionIds,
    individualMode,
  } = props;

  const { addModal, removeModal } = useModal();

  const desagruparClickRef = useRef(0);
  const desagruparTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupId = lastIntersected?.current?.userData?.groupId
    ?? lastIntersected?.current?.parent?.userData?.groupId;
  const particleId = lastIntersected?.current?.userData?.particleId
    ?? lastIntersected?.current?.parent?.userData?.particleId;

  const handleDesagrupar = useCallback(() => {
    desagruparClickRef.current += 1;
    if (desagruparTimerRef.current) clearTimeout(desagruparTimerRef.current);

    desagruparTimerRef.current = setTimeout(() => {
      const clicks = desagruparClickRef.current;
      desagruparClickRef.current = 0;

      if (clicks >= 3 && particleId) {
        ungroupSingle?.(particleId);
        pushHistory?.({ type: 'UNGROUP_SINGLE', elementId: particleId, groupId });
        notify?.('cut', 'neutral');
      } else if (clicks === 2 && groupId) {
        ungroupAll?.(groupId);
        pushHistory?.({ type: 'UNGROUP_ALL', groupId });
        notify?.('cut', 'warning');
      }
    }, 350);
  }, [groupId, particleId, ungroupAll, ungroupSingle, pushHistory, notify]);

  const showAgrupar = (temporarySelectionIds?.length ?? 0) >= 2 || !(temporarySelectionIds?.length);
  const showDesagrupar = !!groupId && !individualMode;

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
    ...(showAgrupar ? [{
      id: 'join',
      type: 'action',
      name: 'Agrupar',
      action: () => onGroup?.(),
    }] : []),
    ...(showDesagrupar ? [{
      id: 'cut',
      type: 'action',
      name: 'Desagrupar',
      action: handleDesagrupar,
    }] : []),
  ];

  useEffect(() => {
    if (!lastIntersected.current) return;
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

  const selectionCount = temporarySelectionIds?.length ?? 0;

  return (
    <div className={css['editing-container']}>
      {selectionCount >= 2 && (
        <span className={css['selection-count']}>{selectionCount} elementos selecionados</span>
      )}
      <div className={css['options-grid']} data-is-mobile={isMobile}>
        {options.map((option) => (
          <Item
            key={option.id}
            id={option.id}
            item={option}
            isSelected={false}
            colorFilter={colorToFilter(colorRef.current)}
            colorRef={colorRef}
            cardSize="m"
            cardIsSvg={true}
            isMobile={isMobile}
            onClick={option.action}
          />
        ))}
      </div>
    </div>
  );
}

export default EditingForm;
