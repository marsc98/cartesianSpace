import React, { useState, useRef, useEffect } from 'react';
import css from './index.module.scss';
import Button from '../../atoms/button';
import Icon from '../../atoms/icon';
import { useModal } from '../../../hooks/useModal';
import { TUTORIALS } from '../../organisms/TutorialGuide/data';
import { useIsMobile } from '../../../hooks/useIsMobile';

const CommandsReference = ({
  onStartTutorial = (_: string) => {},
  onClose = () => {},
}: {
  onStartTutorial?: (type: string) => void;
  onClose?: () => void;
}) => {
  const [activeTab, setActiveTab] = useState('navigation');
  const [currentPage, setCurrentPage] = useState(0);
  const tableRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const { addModal } = useModal();

  const isMobile = useIsMobile();

  const commandsData = {
    navigation: {
      title: 'Navegação',
      commands: [
        {
          key: 'Setas ↑↓←→',
          description: 'Move a câmera para frente/trás/esquerda/direita',
        },
        { key: 'Ctrl + ↑', description: 'Move a câmera para cima' },
        { key: 'Ctrl + ↓', description: 'Move a câmera para baixo' },
        { key: 'Page Up', description: 'Move a câmera para cima' },
        { key: 'Page Down', description: 'Move a câmera para baixo' },
        {
          key: 'Mouse Wheel',
          description:
            'Zoom in/out (rolar) ou movimento lateral (Shift + rolar)',
        },
        { key: 'Ctrl + Wheel', description: 'Move a câmera para cima/baixo' },
        {
          key: 'Mouse Drag',
          description: 'Rotaciona a câmera ao redor da cena',
        },
        {
          key: 'Shift + Mouse Drag',
          description: 'Move a câmera lateralmente (pan)',
        },
        {
          key: '1 Toque + Arrastar',
          description: 'Rotaciona a câmera (mobile)',
        },
        { key: '2 Toques + Pinça', description: 'Zoom in/out (mobile)' },
        {
          key: '2 Toques + Arrastar',
          description: 'Move a câmera lateralmente (mobile)',
        },
      ],
    },
    drawing: {
      title: 'Desenho',
      commands: [
        { key: 'D', description: 'Ativa/desativa modo de desenho livre' },
        {
          key: 'Mouse Drag (desenho)',
          description: 'Desenha traços no espaço 3D',
        },
        {
          key: 'Ctrl + Mouse Drag',
          description: 'Desenha no eixo Z (profundidade)',
        },
        {
          key: 'Esc',
          description: 'Cancela operação atual ou desativa modo de desenho',
        },
        { key: 'Clique duplo', description: 'Seleciona elemento para edição' },
      ],
    },
    elements: {
      title: 'Elementos',
      commands: [
        { key: 'B', description: 'Abre seletor de elementos geométricos' },
        { key: 'T', description: 'Ativa modo de adição de texto' },
        { key: 'P', description: 'Adiciona papel/quadro branco' },
        { key: 'G', description: 'Desenha espaço cartesiano (grade 3D)' },
        { key: 'F', description: 'Abre controles de funções matemáticas' },
        { key: 'M', description: 'Adiciona montanhas (terrain)' },
      ],
    },
    system: {
      title: 'Sistema',
      commands: [
        { key: 'Ctrl + Z', description: 'Desfaz última ação (undo)' },
        { key: 'L', description: 'Limpa toda a cena' },
        { key: 'S', description: 'Abre menu de cenas salvas' },
        { key: 'Ctrl + S', description: 'Salva cena atual' },
        { key: 'I', description: 'Mostra informações da cena' },
        { key: 'C', description: 'Abre calculadora' },
      ],
    },
    tutorials: {
      title: 'Tutoriais',
      commands: Object.entries(TUTORIALS).map(([key, { label }]) => ({ key, description: label })),
    },
  };

  const itemsPerPage = isMobile ? 3 : 5;
  const currentCommands = commandsData[activeTab].commands;
  const totalPages = Math.ceil(currentCommands.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleCommands = currentCommands.slice(startIndex, endIndex);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeft(tableRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].pageX);
  };

  const handleTouchMove = (e) => {
    if (!startX) return;
    const currentX = e.touches[0].pageX;
    const diff = startX - currentX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage < totalPages - 1) {
        setCurrentPage((prev) => prev + 1);
      } else if (diff < 0 && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      }
      setStartX(null);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  return (
    <div className={css['commands-reference-container']}>
      <div
        className={css['tabs-container']}
        style={{ marginBottom: `${isMobile ? '0' : '20px'}` }}
      >
        {Object.keys(commandsData).map((tabKey) => (
          <button
            key={tabKey}
            className={`${css['tab-button']} ${activeTab === tabKey ? css['active'] : ''}`}
            onClick={() => setActiveTab(tabKey)}
          >
            {commandsData[tabKey].title}
          </button>
        ))}
      </div>

      <div
        className={css['table-container']}
        ref={tableRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <table className={css['commands-table']}>
          <thead>
            <tr>
              {activeTab === 'tutorials' ? (
                <>
                  <th style={{textAlign: 'center'}}>Tutoriais</th>
                  <th></th>
                </>
              ) : (
                <>
                  <th>Comando</th>
                  <th style={{textAlign: 'center'}}>Descrição</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleCommands.map((command, index) => (
              <tr key={index}>
                {activeTab === 'tutorials' ? (
                  <>
                    <td className={css['command-description']}>
                      <span className={css['description-text']}>{command.description}</span>
                    </td>
                    <td className={css['tutorial-action']}>
                      <Button
                        color="blue"
                        text="▶  Iniciar"
                        action={() => { onStartTutorial(command.key); onClose(); }}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className={css['command-key']}>
                      <kbd>{command.key}</kbd>
                    </td>
                    <td className={css['command-description']}>
                      <span className={css['description-text']}>
                        {command.description}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={css['pagination-container']}>
          <Button
            className={css['pagination-button']}
            radius={20}
            color="blue"
            action={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <Icon
              name="coolArrow"
              size="s"
              style={{ height: '25px', transform: 'rotate(180deg)' }}
            />
          </Button>

          <span className={css['pagination-info']}>
            Página {currentPage + 1} de {totalPages}
          </span>

          <Button
            className={css['pagination-button']}
            radius={20}
            color="blue"
            action={() =>
              setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={currentPage === totalPages - 1}
          >
            <Icon name="coolArrow" size="s" style={{ height: '25px' }} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommandsReference;
