import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useIsMobile } from '../../../hooks/useIsMobile';
import css from './index.module.scss';
import Input from '../../atoms/input';
import Button from '../../atoms/button';
import IconButton from '../../molecules/iconButton';
import { useModal } from '../../../hooks/useModal';
import { useSketch } from '../../../hooks/useSketch';
import {
  createTraceAlongPath,
  disposeMultipleObjects,
  handleCreativityOnSpace,
  reconstructElements,
  createRealisticStarfield,
} from '../../organisms/Board3d/spaceElements';
import { formatDate } from '../../../utils/functions';
import { drawFunction } from '../../organisms/Board3d/cartesianSpaceElements';
import { cleanupScene } from '../../../utils/functions';

interface SavedScenesProps {
  handleCloseModal: () => void;
  sceneRef: React.MutableRefObject<THREE.Scene | null>;
  elementsStackRef: React.MutableRefObject<Map<string, THREE.Object3D>>;
  colorRef: React.MutableRefObject<string>;
  sizeRef: React.MutableRefObject<number>;
  cartesianSpaceRef: React.MutableRefObject<{ active: boolean; lineSize: number; numLines: number }>;
  handlePlaneSelection?: (...args: unknown[]) => void;
  particleRef: React.MutableRefObject<{ id: string | null; group: THREE.Group | null }>;
  functionsRef: React.MutableRefObject<unknown[]>;
  notify: (iconName: string, variant: string, options?: any) => void;
  isOpen?: boolean;
}

const SavedScenes = React.memo(
  ({
    handleCloseModal,
    sceneRef,
    elementsStackRef,
    colorRef,
    sizeRef,
    cartesianSpaceRef,
    handlePlaneSelection,
    particleRef,
    functionsRef,
    notify,
  }: SavedScenesProps) => {
    const [animationState, setAnimationState] = useState('closed');
    const [inputValue, setInputValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLUListElement>(null);

    const isMobile = useIsMobile();

    const { addModal, removeModal } = useModal();
    const {
      elements,
      currentSketch,
      allSketches,
      addElement,
      addSketch,
      deleteSketch,
      updateSketch,
      getSketchById,
      getAllSketches,
      getLatestSketch,
      setElements,
    } = useSketch();

    // ============================================
    // LOAD ALL SKETCHES LIST AND RECONSTRUCT
    // ============================================

    useEffect(() => {
      let firstAccess = true;
      loadAllSketches();
    }, [elements.length]);

    const loadAllSketches = useCallback(async () => {
      try {
        await getAllSketches();
      } catch (error) {
        console.error('Erro ao carregar sketches:', error);
      }
    }, [getAllSketches]);

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    const handleSaveSketch = useCallback(async () => {
      if (!currentSketch) {
        console.error('Nenhuma sketch ativa');
        return;
      }

      setIsSaving(true);

      try {
        const name =
          inputValue.trim() || `Sketch ${new Date().toLocaleString('pt-BR')}`;

        await updateSketch(currentSketch.id, {
          name,
          data: elements,
        });

        setInputValue('');
        await loadAllSketches();

        console.log(`✅ Sketch salva: ${name}`);
      } catch (error) {
        console.error('Erro ao salvar sketch:', error);
        alert('Erro ao salvar sketch. Veja o console para mais detalhes.');
      } finally {
        setIsSaving(false);
      }
    }, [currentSketch, elements, inputValue, updateSketch, loadAllSketches]);

    const handleAddNewSketch = useCallback(async () => {
      const name =
        inputValue.trim() || `Sketch ${new Date().toLocaleString('pt-BR')}`;

      cleanupScene(sceneRef.current);
      setElements([]);
      createRealisticStarfield(sceneRef, elementsStackRef);

      try {
        await addSketch(name);
        setInputValue('');
        await loadAllSketches();

        console.log(`✅ Nova sketch criada: ${name}`);
      } catch (error) {
        console.error('Erro ao criar sketch:', error);
        alert('Erro ao criar sketch. Veja o console para mais detalhes.');
      }
    }, [inputValue, addSketch, loadAllSketches]);

    const handleLoadSketch = useCallback(
      async (sketchId) => {
        setIsLoading(true);

        try {
          const sketch = await getSketchById(sketchId);

          if (!sketch) throw new Error('Sketch não encontrada');
          if (!sceneRef.current) throw new Error('Scene não inicializada');

          sceneRef.current.children = [];

          createRealisticStarfield(sceneRef, elementsStackRef);

          updateSketch(sketch);

          // // Reconstruir elementos
          await reconstructElements(
            sketch.data || [],
            sceneRef,
            elementsStackRef,
            cartesianSpaceRef,
            handlePlaneSelection,
            addElement,
            particleRef,
            functionsRef,
          );

          console.log(`✅ Sketch carregada: ${sketch.name}`);
          notify?.('bookmark', 'success', { duration: 1500 });
        } catch (error) {
          console.error('Erro ao carregar sketch:', error);
          alert('Erro ao carregar sketch. Veja o console para mais detalhes.');
        } finally {
          setIsLoading(false);
        }
      },
      [
        sceneRef,
        elementsStackRef,
        cartesianSpaceRef,
        handlePlaneSelection,
        addElement,
        particleRef,
        functionsRef,
        getSketchById,
        notify,
      ],
    );

    const handleDeleteSketch = useCallback(
      async (id) => {
        try {
          await deleteSketch(id);
          await loadAllSketches();

          console.log('✅ Sketch deletada');
        } catch (error) {
          console.error('Erro ao deletar sketch:', error);
        }
      },
      [deleteSketch, loadAllSketches],
    );

    const confirmSketchDelete = useCallback(
      (id) => {
        const deleteConfimId = `modal-delete-confim-${Date.now()}`;
        addModal({
          id: deleteConfimId,
          isOpen: true,
          title: 'Deseja realmente excluir essa sketch?',
          formId: 'delete-confim-form',
          content: <span>'Essa operação não pode ser desfeita'</span>,
          onClose: () => {
            // handleCloseModal();
            removeModal(deleteConfimId);
          },
          action: () => {
            handleDeleteSketch(id);
            // handleCloseModal();
            removeModal(deleteConfimId);
          },
          buttonText: 'Excluir',
          buttonColor: 'red',
        });
      },
      [, handleCloseModal, handleDeleteSketch],
    );

    const handleDownloadSketch = useCallback(
      async (sketchId) => {
        try {
          const sketch = await getSketchById(sketchId);

          if (!sketch) throw new Error('Sketch não encontrada');

          const jsonString = JSON.stringify(sketch, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${sketch.name.replace(/[^a-z0-9]/gi, '_')}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Erro ao fazer download:', error);
          alert('Erro ao fazer download da sketch.');
        }
      },
      [getSketchById],
    );

    const handleKeyPress = useCallback(
      (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleAddNewSketch();
        }
      },
      [handleAddNewSketch],
    );

    // ============================================
    // RENDER
    // ============================================

    return (
      <ul
        className={`${css['saved-scenes-container']} ${css[animationState]}`}
        ref={containerRef}
      >
        <div className={css['add-scene-container']}>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeypress={handleKeyPress}
            placeholder="Nome da sketch"
            className={css['scene-input']}
            disabled={isSaving}
          />
          <Button
            text={isSaving ? '...' : '+'}
            action={handleAddNewSketch}
            disabled={isSaving}
          />
        </div>

        <hr className={css['divider']} />

        {isLoading && (
          <div className={css['loading-indicator']}>Carregando sketch...</div>
        )}

        {allSketches.length === 0 ? (
          <div className={css['empty-state']}>Nenhuma sketch salva ainda</div>
        ) : (
          allSketches.map((sketchItem) => {
            const isCurrentSketch = currentSketch?.id === sketchItem.id;
            const formatedDate = formatDate(sketchItem.updatedAt);

            return (
              <li key={sketchItem.id}>
                <div
                  className={css['scene-item']}
                  data-active={isCurrentSketch}
                >
                  <div
                    className={css['scene-info']}
                    data-active={isCurrentSketch}
                  >
                    <span
                      title={sketchItem.name}
                      className={css['scene-title']}
                      data-active={isCurrentSketch}
                    >
                      {sketchItem.name}
                    </span>
                  </div>
                  <div className={css['scene-meta-container']}>
                    <span className={css['scene-meta']}>
                      {isMobile
                        ? formatedDate.time
                        : `${formatedDate?.date} • ${formatedDate?.time}`}
                    </span>
                  </div>
                  <div className={css['scene-actions']}>
                    <IconButton
                      hoverText="Download"
                      isActive={isCurrentSketch}
                      iconName="download"
                      size="p"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSketch(sketchItem.id);
                      }}
                    />
                    <IconButton
                      hoverText="Carregar"
                      isActive={isCurrentSketch}
                      iconName="bookmark"
                      size="p"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSketch(sketchItem.id);
                      }}
                    />
                    <IconButton
                      hoverText="Deletar"
                      isActive={isCurrentSketch}
                      iconName="delete"
                      size="p"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmSketchDelete(sketchItem.id);
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isOpen === nextProps.isOpen &&
      prevProps.sceneRef === nextProps.sceneRef
    );
  },
);

SavedScenes.displayName = 'SavedScenes';

export default SavedScenes;
