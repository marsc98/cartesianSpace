interface TutorialStep {
  title: string;
  description: string;
  visual: string | null;
}

interface Tutorial {
  label: string;
  steps: TutorialStep[];
}

export const TUTORIALS: Record<string, Tutorial> = {
  welcome: {
    label: 'Introdução geral',
    steps: [
      {
        title: 'Bem-vindo ao Espaço Cartesiano',
        description: 'Este é um quadro 3D interativo para exercer sua criatividade e até montar apresentações e aulas. Você pode desenhar, adicionar elementos geométricos e navegar no espaço tridimensional.',
        visual: null,
      },
      {
        title: 'Tutoriais disponíveis',
        description: 'Há tutoriais específicos para navegação 3D, desenho livre, elementos geométricos e ferramentas do sistema. Acesse-os pelo menu de Informações.',
        visual: null,
      },
      {
        title: 'Pronto para começar',
        description: 'Explore livremente o espaço. Se precisar de ajuda, pressione o botão de informações (I) no canto da tela para ver comandos e tutoriais.',
        visual: null,
      },
    ],
  },
  navigation: {
    label: 'Navegação 3D',
    steps: [
      {
        title: 'Rotacionar a câmera',
        description: 'Clique e arraste o mouse para rotacionar a câmera ao redor da cena. No mobile, use um dedo para arrastar.',
        visual: 'animation-navigate',
      },
      {
        title: 'Mover lateralmente (Pan)',
        description: 'Segure Shift e arraste o mouse para mover a câmera lateralmente. No mobile, arraste com dois dedos.',
        visual: 'animation-navigate',
      },
      {
        title: 'Zoom',
        description: 'Use o scroll do mouse para aproximar ou afastar a câmera. No mobile, use o gesto de pinça com dois dedos.',
        visual: null,
      },
      {
        title: 'Teclas de navegação',
        description: 'Use as setas do teclado para mover a câmera. Ctrl + seta move verticalmente. Page Up/Down também movem para cima e para baixo.',
        visual: null,
      },
    ],
  },
  drawing: {
    label: 'Desenho livre',
    steps: [
      {
        title: 'Ativar o modo de desenho',
        description: 'Pressione a tecla D para ativar o modo de desenho livre. O cursor muda para indicar que o modo está ativo.',
        visual: 'animation-draw',
      },
      {
        title: 'Desenhar traços',
        description: 'Com o modo de desenho ativo, clique e arraste para criar traços no espaço 3D. Os traços ficam fixos no plano atual.',
        visual: 'animation-draw',
      },
      {
        title: 'Desenhar em profundidade',
        description: 'Segure Ctrl enquanto arrasta para desenhar no eixo Z, criando traços que avançam ou recuam no espaço.',
        visual: 'animation-draw',
      },
      {
        title: 'Personalizar o traço',
        description: 'Use o formulário do lápis para ajustar cor, espessura e outras propriedades do traço antes de desenhar.',
        visual: null,
      },
      {
        title: 'Sair do modo de desenho',
        description: 'Pressione D novamente ou Escape para sair do modo de desenho e voltar à navegação normal.',
        visual: null,
      },
    ],
  },
  elements: {
    label: 'Elementos 3D',
    steps: [
      {
        title: 'Adicionar formas geométricas',
        description: 'Pressione D para abrir o seletor de elementos geométricos. Escolha entre cubos, esferas, cilindros e outras formas.',
        visual: null,
      },
      {
        title: 'Adicionar texto',
        description: 'Pressione T para ativar o modo de texto. Clique na cena para posicionar e depois escreva o conteúdo desejado.',
        visual: null,
      },
      {
        title: 'Espaço cartesiano',
        description: 'Pressione G para desenhar um espaço cartesiano com grade 3D numerada, ideal para representações matemáticas.',
        visual: null,
      },
      {
        title: 'Funções matemáticas',
        description: 'Pressione F para abrir os controles de funções. Você pode plotar funções matemáticas no espaço 3D. Experimente x^2+y^2.',
        visual: null,
      },
    ],
  },
  tools: {
    label: 'Ferramentas',
    steps: [
      {
        title: 'Desfazer ação',
        description: 'Pressione Ctrl + Z para desfazer a última ação realizada na cena.',
        visual: null,
      },
      {
        title: 'Salvar e carregar cenas',
        description: 'Pressione S para abrir o menu de cenas salvas. Use Ctrl + S para salvar a cena atual rapidamente.',
        visual: null,
      },
      {
        title: 'Calculadora',
        description: 'Pressione C para abrir a calculadora integrada, útil para cálculos durante apresentações.',
        visual: null,
      },
      {
        title: 'Limpar a cena',
        description: 'Pressione L para limpar todos os elementos da cena e começar do zero.',
        visual: null,
      },
      {
        title: 'Informações da cena',
        description: 'Pressione I para abrir o painel de informações com comandos disponíveis, tutoriais e detalhes do projeto.',
        visual: null,
      },
    ],
  },
};
