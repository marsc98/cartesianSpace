# Espaço Cartesiano

O Espaço Cartesiano nasceu na busca por um projeto de conclusão de curso. Um dia conversando com minha namorada ela comentou sobre como "desenhava no ar" para pensar, essa frase virou um insight que me levou a querer fazer um "quadro branco" para desenhar e fazer demonstrações, para aproximar a matemática comecei a estudar animações através dos vídeos do canal Chris Courses e comecei a buscar mais formas de mostrar a matemática de várias maneiras na mesma plataforma, mas sem deixar nítido como um passo a passo e sim permitir ao usuário de fato "visualizar" a matemática e caso se interesse veja os cálculos utilizados para movimento, rotação, o desenho em si... O Espaço Cartesiano se tornou um "quadro 3D" interativo. A aplicação permite ao usuário realizar demonstrações de funções, plot de geometrias, desenho à mão livre, animações nos items do espaço.

**Acesse:** [espaco-cartesiano.com.br](https://espaco-cartesiano.com.br)

🇧🇷 Português | [🇺🇸 English](README.en.md)

---

## Comandos

### Desenvolvimento

```bash
yarn install     # instala dependências
yarn start       # inicia o servidor de desenvolvimento na porta 3001
```

### Build e Deploy

```bash
yarn build       # gera o bundle de produção em dist/
yarn deploy      # faz o deploy na Azion + upload manual do arquivo WASM no storage
```

> **Atenção:** use sempre `yarn deploy` no lugar de `azion deploy` diretamente.
> O CLI da Azion não inclui arquivos `.wasm` no upload automático ao storage — o script
> de deploy resolve isso fazendo o upload manualmente após o deploy padrão.

### Parâmetros de URL

| Parâmetro     | Descrição                |
| ------------- | ------------------------- |
| _(nenhum)_    | Abre o board 3D padrão   |
| `?board=true` | Abre o board 2D legado   |

---

## Stack

| Camada          | Tecnologia                      |
| --------------- | ------------------------------- |
| Framework       | React 19 + Vite                 |
| Renderização 3D | Three.js                        |
| Performance     | WebAssembly (Rust → `.wasm`)    |
| Matemática      | mathjs                          |
| Estilização     | CSS Modules (SCSS)              |
| Deploy          | Azion Edge (CDN + Edge Storage) |

---

## Arquitetura e como as tecnologias se conectam

### Visão geral

```
Entrada do usuário (mouse / touch)
        │
        ▼
  React + Contexts
        │
        ▼
  Drawing Pipeline
   ┌────────────┐    ┌─────────────────┐    ┌────────────┐
   │ Raw Coords │───▶│  WASM Optimizer │───▶│  Three.js  │
   │ (Float32)  │    │ (RDP + cilindro)│    │  Renderer  │
   └────────────┘    └─────────────────┘    └────────────┘
                                                   │
                                                   ▼
                                             Scene (Three.js)
                                           elementsStackRef
```

### React + Contexts

O estado da aplicação é distribuído em **8 contextos independentes**, montados em `AppProviders`:

| Context            | Responsabilidade                                             |
| ------------------ | ------------------------------------------------------------ |
| `SessionContext`   | Dados de sessão: cor atual, device mobile, contador de tempo |
| `SceneContext`     | Refs do Three.js: cena, renderer, pilha de elementos         |
| `UIContext`        | Estado da interface: modal aberto, modo de edição ativo      |
| `DrawingContext`   | Estado do traço em progresso                                 |
| `ElementsContext`  | CRUD dos elementos presentes na cena                         |
| `HistoryContext`   | Undo/redo                                                    |
| `CameraContext`    | Posição e comportamento da câmera                            |
| `FunctionsContext` | Funções matemáticas plotadas                                 |

Nenhum estado global externo (Redux, Zustand) — os contextos são suficientes para o escopo do projeto e mantêm o acoplamento baixo.

### Three.js

O board 3D é renderizado inteiramente com Three.js via um canvas montado por ref (`mountRef`). Todos os elementos (traços, funções, planos, geometrias) são objetos Three.js adicionados à `sceneRef` e indexados na `elementsStackRef` (um `Map` keyed por id).

O loop de animação roda de forma contínua via `requestAnimationFrame` e é responsável por renderizar a cena, processar animações de elementos e atualizar a câmera.

### Pipeline de desenho e WebAssembly

Quando o usuário desenha à mão livre, as coordenadas 3D brutas são capturadas continuamente em um `Float32Array` pré-alocado. Ao finalizar o traço, esse array passa pelo pipeline:

```
src/lib/drawing/tracePipeline.ts
   └── traceOptimizer.ts
         └── lib/wasm/index.ts  →  optimize_trace() (Rust/WASM)
               └── traceRenderer.ts  →  Three.js mesh
```

O módulo WASM (`trace_opt.wasm`) executa duas operações em Rust:

1. **Ramer-Douglas-Peucker (RDP):** simplifica a polilinha removendo pontos redundantes com base em um `epsilon` de tolerância. Isso reduz traços de milhares de pontos para dezenas, mantendo a forma visual.

2. **Geração de cilindro:** para cada segmento simplificado, gera anéis de vértices ao redor da direção do traço (`nRing` vértices por anel, com raio proporcional ao tamanho do pincel). O resultado são as posições 3D de um sistema de partículas que forma o traço renderizado.

A comunicação com o WASM usa **memória compartilhada** diretamente: os coords de entrada são escritos no buffer exportado pelo módulo (`input_ptr`), a função é chamada, e as posições de saída são lidas do buffer de saída (`output_ptr`) sem nenhuma cópia extra entre JS e WASM.

### Deploy na Azion

A aplicação é servida como SPA estática no edge da Azion. O Rules Engine da Azion tem duas regras de request em ordem de prioridade:

1. **Servir assets estáticos** — arquivos que casam com a regex de extensões conhecidas (`.js`, `.css`, `.wasm`, etc.) são servidos diretamente do Edge Storage.
2. **Catch-all SPA** — qualquer outra rota é reescrita para `index.html`, permitindo que o React Router (ou parâmetros de URL) controle a navegação.

O arquivo `azion.config.cjs` define essas regras e é aplicado a cada `azion deploy`.

> **Detalhe importante:** o CLI da Azion não faz upload de `.wasm` automaticamente.
> O script `deploy` no `package.json` resolve isso com um `azion create storage object`
> após o deploy padrão. Se o bucket ou o prefixo mudarem (ver `azion/azion.json`),
> o script precisa ser atualizado manualmente.

---

## Licença

Este projeto está licenciado sob a [PolyForm Noncommercial License 1.0.0](LICENSE).

Você pode estudar, executar e adaptar o código para fins não-comerciais.
Para uso comercial, entre em contato antes de utilizar.
