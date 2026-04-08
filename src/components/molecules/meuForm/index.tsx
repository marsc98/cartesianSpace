import React, { useState } from 'react';
import Button from '../../atoms/button';

// Ícone GitHub SVG
const GithubIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

// Ícone LinkedIn SVG
const LinkedinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const MeuForm = ({ isMobile = false }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleButtonClick = () => {
    setIsAnimating(true);

    setTimeout(() => {
      window.open(import.meta.env.VITE_FORM_URL, '_blank');
      setTimeout(() => setIsAnimating(false), 500);
    }, 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '1152px',
          borderRadius: '12px',
          boxShadow:
            '0 15px 15px -10px rgba(0, 0, 0, 0.3), 0 -15px 15px -10px rgba(0, 0, 0, 0.3), -15px 0 15px -10px rgba(0, 0, 0, 0.3), 15px 0 15px -10px rgba(0, 0, 0, 0.3)',
          overflow: isMobile ? 'auto' : 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? '600px' : '500px',
          border: '1px solid #475e73',
        }}
      >
        {/* Coluna Esquerda - Resumo (Papel) */}
        <div
          style={{
            maxWidth: '600px',
            padding: '25px',
            borderRight: '4px solid #475e73',
            height: isMobile ? 'auto' : '100%',
            overflowY: isMobile ? 'visible' : 'auto',
            order: isMobile ? 2 : 1,
          }}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>

          <div
            style={{
              padding: '4px',
              borderRadius: '8px',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <hr />
            <br />
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              Resumo
            </h2>
            <div
              style={{
                color: '#374151',
                lineHeight: '1.75',
                textAlign: 'justify',
                paddingTop: '8px',
                fontSize: isMobile ? '.8rem' : '.9rem',
              }}
            >
              <p style={{ marginBottom: '12px' }}>
                O ensino de matemática enfrenta desafios relacionados à
                abstração de conceitos e à distância entre a linguagem em que se
                expressa a teoria e a experiência cotidiana. Este trabalho
                apresenta o desenvolvimento de um software de criação
                tridimensional e um dispositivo de controle de cursor destinados
                a auxiliar o ensino e aprendizagem de matemática. O software
                utiliza tecnologias web modernas, incluindo Three.js e WebGL,
                para renderização de objetos tridimensionais em diferentes
                dispositivos e con- sequentemente diferentes telas, com
                aceleração por hardware.
              </p>
              <p style={{ marginBottom: '12px' }}>
                A aplicação permite a criação e manipulação de elementos
                matemáticos em espaço tridimensional, incluindo geometrias,
                funções matemáticas, eixos de referência, terrenos, textos e
                imagens, com navegação similar a ambientes virtuais em primeira
                pessoa. O dispositivo de controle consiste em um sensor MPU6050
                e uma ESP32 C3 super mini, que capturam o ân- gulo de
                deslocamento e a direção do movimento para controlar o cursor
                via Bluetooth Low Energy (BLE).
              </p>
              <p style={{ marginBottom: '12px' }}>
                O sistema fundamenta-se em princípios de computação gráfica,
                incluindo transformações matriciais, pipeline de renderização
                WebGL, algoritmos de raycasting para detecção de intersecções, e
                processamento de expressões matemáti- cas através da biblioteca
                Math.js. A solução proposta visa proporcionar uma ferramenta
                interativa que aproxime estudantes dos conceitos matemáticos
                fundamentais através de visualização tridimensional e exploração
                das propriedades estéticas da matemática.
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Conteúdo */}
        <div
          style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: isMobile ? 'auto' : '100%',
            order: isMobile ? 1 : 2,
          }}
        >
          {/* Topo - Logos */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <a
              href="https://github.com/marsc98"
              title="Github"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px',
                backgroundColor: '#1f2937',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#374151')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#1f2937')
              }
            >
              <GithubIcon />
            </a>
            <a
              href="https://www.linkedin.com/in/marco-a-santosdasilva/"
              title="Linkedin"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px',
                backgroundColor: '#2563eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#1d4ed8')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#2563eb')
              }
            >
              <LinkedinIcon />
            </a>
          </div>

          {/* Meio - Texto */}
          <div style={{ flex: 1, marginBottom: '24px' }}>
            <div
              style={{
                color: '#374151',
                lineHeight: '1.75',
                textAlign: 'justify',
              }}
            >
              <p style={{ marginBottom: '16px' }}>
                Muito obrigado por se interessar por esse sistema, ele foi
                desenvolvido como meu trabalho de conclusão de curso, em
                conjunto com um dispositivo de hardware que interage com o
                sistema se conectando como mouse em qualquer dispositivo.
              </p>
              <p>
                {isMobile ? 'Abaixo' : 'Ao lado'} está o resumo da monografia
                para trazer uma ideia do que foi pretendido e aqui em baixo está
                um botão que te leva para um formulário para me ajudar na
                conclusão da monografia e também deixar sugestões, críticas,
                ideias... e se quiser entrar em contato seguem minhas redes ali
                no início do modal!!
              </p>
            </div>
          </div>

          {/* Baixo - Botão com Animação */}
          <div
            style={{
              justifyContent: 'center',
            }}
          >
            <Button
              href={import.meta.env.VITE_FORM_URL}
              text="Formulário :)"
              onClick={handleButtonClick}
            />

            {/* Animação "valeu demais" */}
            {isAnimating && (
              <div
                style={{
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      whiteSpace: 'nowrap',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#2563eb',
                      animation: 'expandLeft 2s ease-out forwards',
                      transformOrigin: 'right center',
                      right: '5px',
                    }}
                  >
                    valeu
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      whiteSpace: 'nowrap',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#2563eb',
                      animation: 'expandRight 2s ease-out forwards',
                      transformOrigin: 'left center',
                      left: '5px',
                    }}
                  >
                    demais
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes expandLeft {
          0% {
            transform: translateX(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(-80px) scale(1);
            opacity: 1;
          }
        }

        @keyframes expandRight {
          0% {
            transform: translateX(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(80px) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
