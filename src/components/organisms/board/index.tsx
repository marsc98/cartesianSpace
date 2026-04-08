import { useCallback, useEffect, useRef, useState } from "react";
import css from "./index.module.scss";
import Picker from "../../molecules/picker";
import { useCoordinates } from "../../../hooks/useCoordinates";
import Controls from "../../atoms/controls";
import Icon from "../../atoms/icon";

function Board() {
  const canvasRef = useRef(null);
  const { coordinatesState, setcoordinatesState } = useCoordinates();
  const [boardContext, setBoardcontext] = useState(null);
  // const [coordinatesState, setDrawingCoordinates] = useState({ x: 0, y: 0 });
  const [controlsRangeState, setControlsRangeState] = useState(() => ({
    cursor: 3,
    y: window.innerHeight / 2,
    tamanho: 0.01,
    amplitude: 100,
    frequencia: 0.01,
    h: 200,
    s: 50,
    l: 50,
    r: 0,
    g: 0,
    b: 0,
    a: 0.01,
  }));
  const [color, setColor] = useState("#ffffff");
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(true);
  const [cursorType, setCursorType] = useState("default");
  // Possible actions: ["drawing", "erasing", "shootingFirework", "manipulatingWaves", "universeFlowing"]
  const [action, setAction] = useState("drawing");
  const [particles, setParticles] = useState([]);
  const [stars, setStars] = useState([]);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  const animationIdRef = useRef(null);
  const clickRef = useRef(null);

  const hasControls = action === "drawing" || action === "manipulatingWaves";

  var controlsRange = {
    cursor: 3,
    y: window.innerHeight / 2,
    tamanho: 0.01,
    amplitude: 100,
    frequencia: 0.01,
  };

  let presentationCoordinates = {
    x: 10,
    y: 10,
  };

  const tools = [
    {
      name: "sample",
      value: "",
      sample: true,
    },
    {
      name: "caneta",
      value: "/images/icons/draw.svg",
      action: startDraw,
    },
    {
      name: "borracha",
      value: "/images/icons/eraser.svg",
      action: startEraser,
    },
    {
      name: "borracha",
      value: "/images/icons/move.svg",
      action: startEraser,
    },
  ];

  const animations = [
    {
      name: "sample",
      value: "",
      sample: true,
    },
    {
      name: "sin",
      value: "/images/icons/sin.svg",
      action: startWaves,
    },
    {
      name: "fireworks",
      value: "/images/icons/boom.svg",
      action: startFireWorks,
    },
    {
      name: "universe",
      value: "/images/icons/universe.svg",
      action: startStars,
    },
  ];

  const colors = [
    { name: "sample", value: "", sample: true },
    { name: "white", value: "#ffffff", action: updateColor },
    { name: "red", value: "#a60520", action: updateColor },
    { name: "blue", value: "#0603a3", action: updateColor },
    { name: "green", value: "#047509", action: updateColor },
    { name: "yellow", value: "#a5b802", action: updateColor },
    { name: "orange", value: "#b86302", action: updateColor },
    { name: "black", value: "#000", action: updateColor },
    { name: "brown", value: "#633602", action: updateColor },
    { name: "pink", value: "#b50291", action: updateColor },
    { name: "purple", value: "#7c0387", action: updateColor },
  ];

  function updateColor(newColor) {
    setColor(newColor);
  }

  function startEraser() {
    setAction("erasing");
    setCursorType("context-menu");
  }

  function startDraw() {
    setAction("drawing");
    setCursorType("default");
    setIsDrawing(true);
  }

  function startWaves() {
    clearBoard();
    setIsDrawing(false);
    setAction("manipulatingWaves");
    animateWaves();
  }

  function startFireWorks() {
    clearBoard();
    setIsDrawing(false);
    setAction("shootingFirework");
    animateFireworks();
  }

  function startStars() {
    clearBoard();
    setIsDrawing(false);
    setAction("universeFlowing");
    initStars();
  }

  function clearBoard() {
    animationIdRef?.current?.forEach((id) => cancelAnimationFrame(id));
    animationIdRef.current = [];
    boardContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    setParticles([]);
  }

  /**
   * This function draw a circle in the screen on the
   * mouse position
   */
  function paintLikePencil() {
    const posX = coordinatesState?.x;
    const posY = coordinatesState?.y;

    boardContext.beginPath();
    boardContext.arc(
      posX,
      posY,
      controlsRangeState.cursor,
      0,
      Math.PI * 2,
      false
    );
    boardContext.fillStyle = color;
    boardContext.fill();
  }

  /**
   * This function triggers a line for the user
   */
  function line() {
    // beginPath() -> init the "draw" event
    boardContext.beginPath();

    // moveTo(x,y) -> initial coordinates of the line
    boardContext.moveTo(50, 300);

    // lineTo(x,y) -> final coordinates to the line
    boardContext.lineTo(300, 100);

    // strokeStyle -> chang the element color
    boardContext.strokeStyle = "#fff";

    // stroke() -> draw the line
    boardContext.stroke();
  }

  /**
   * This function draw an square based on the user
   * click event
   */
  function square() {
    // fillStyle -> set the square color
    boardContext.fillStyle = "#fff";

    // fillRect(x,y,l,a) -> draw an square reciving the coordinates and the size
    boardContext.fillRect(100, 100, 100, 50);
  }

  const gravity = 0.046;
  const friction = 0.99;

  /**
   * This function draw an circle based on the user
   * click event
   */
  class Spark {
    constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.opacity = 1;

      this.update = () => {
        this.draw();

        // This math makes sure that the particle it's simulating the reality by
        // decreasing the x axis to simulate the friction and decreasing and adding
        // on the y axis to simulate friction of the air and gravity together
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.velocity.y += gravity;

        // This increment mooves the particle after the calculates that simulate the reality
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.opacity -= 0.003;
      };

      this.draw = function() {
        boardContext.save();
        boardContext.globalAlpha = this.opacity;
        boardContext.beginPath();
        boardContext.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        boardContext.fillStyle = this.color;
        boardContext.fill();
        boardContext.closePath();
        boardContext.restore();
      };
    }
  }

  class Star {
    constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.opacity = 1;

      this.update = () => {
        this.draw();
      };

      this.draw = function() {
        boardContext.beginPath();
        boardContext.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        boardContext.shadowColor = this.color;
        boardContext.shadowBlur = 30;
        boardContext.fillStyle = this.color;
        boardContext.fill();
        boardContext.closePath();
      };
    }
  }

  function initStars() {
    setStars([]);
    for (let i = 0; i < 400; i++) {
      const x = randomNumber(-window.innerWidth, window.innerWidth);
      const y = randomNumber(-window.innerHeight, window.innerHeight);
      const radius = randomNumber(0, 4.2);
      const color = `hsl(${randomNumber(0, 360)}, 50%, 50%)`;

      const newStar = new Star(x, y, radius, color);
      setStars((stars) => [...stars, newStar]);
    }
  }

  let radians = 0;
  let alpha = 1;
  function animateStarts() {
    animationIdRef?.current?.push(requestAnimationFrame(animateStarts));

    boardContext.fillStyle = `rgba(10, 10, 10, ${alpha})`;
    boardContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // save() -> Starts an context to it frame
    boardContext.save();
    // translate() -> Move the entire board by really translating
    boardContext.translate(window.innerWidth / 2, window.innerHeight / 2);
    boardContext.rotate(radians);
    // The particles need to be updated after the board translaion to have the feeling
    // of moviment because the board will render caring the old particle coordinates
    // already memoized
    stars.forEach((star) => {
      star.update();
    });
    boardContext.restore();

    radians += 0.003;

    if (clickRef.current && alpha >= 0.1) {
      alpha -= 0.02;
    } else if (!clickRef.current && alpha < 1) {
      alpha += 0.02;
    }
  }

  /**
   * This function trigger the metod that clear an specifc size
   * on the canvas
   */
  function eraseArea() {
    boardContext.clearRect(
      coordinatesState?.x - controlsRangeState.cursor / 2,
      coordinatesState?.y - controlsRangeState.cursor / 2,
      controlsRangeState.cursor,
      controlsRangeState.cursor
    );
  }

  /**
   * This function indicates to the moviment listener
   * that it can start drawing on the board.
   */
  function startInteracting(event) {
    setIsInteracting(true);

    if (action === "universeFlowing") {
      clickRef.current = true;
    }
  }

  /**
   * This function indicates to the moviment listener
   * that it can stop drawing on the board.
   */
  function stopInteracting() {
    setIsInteracting(false);
    if (action === "universeFlowing") {
      clickRef.current = false;
    }
  }

  /**
   * This function changes the usage mode
   */
  function updateInteractionMode() {
    setIsDrawing(!isDrawing);
    setAction("");
  }

  /**
   * This function updates the coordinates based on the user desire.
   * The react states don't work with the requestAnimationFrame()
   * because of the state time to update
   *
   * @param {number} x
   * @param {number} y
   */
  const updateCoordinates = useCallback(
    (x, y) => {
      if (isDrawing) {
        setcoordinatesState({ x, y });
      } else {
        presentationCoordinates.x = x;
        presentationCoordinates.y = y;
      }
    },
    [isDrawing, setcoordinatesState],
  );

  const handleCanvasMouseMove = useCallback(
    (event) => {
      updateCoordinates(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
    },
    [updateCoordinates],
  );

  function updateControlsRange(control, size) {
    setControlsRangeState((state) => ({ ...state, [control]: size }));
  }

  /**
   * This function creates random numbers in a speciic range of values
   *
   * @param {number} max
   * @param {number} min
   * @returns
   */
  function randomNumber(max, min) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  let increment = controlsRange.frequencia;
  /**
   * This function draws waves based on the height, amplitude, lenght, frequency
   * and colors inputed on the controls above the screen
   */
  function waves() {
    boardContext.fillStyle = `rgba(${controlsRangeState.r}, ${controlsRangeState.g}, ${controlsRangeState.b}, ${controlsRangeState.a})`;
    boardContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

    boardContext.beginPath();
    boardContext.moveTo(0, window.innerHeight / 2);

    // This "for" draws multiple dots like a line and make then move
    // with the help of the sin equation to have the wave shape
    for (let i = 0; i < window.innerWidth; i++) {
      boardContext.lineTo(
        i,
        controlsRangeState.y +
        Math.sin(i * controlsRangeState.tamanho + increment) *
        controlsRangeState.amplitude *
        Math.sin(increment)
      );
    }

    boardContext.strokeStyle = `hsl(${controlsRangeState.h * Math.sin(increment)
      }, ${controlsRangeState.s}%, ${controlsRangeState.l}%)`;
    boardContext.stroke();

    increment += controlsRange.frequencia;
  }

  function animateWaves() {
    waves();

    animationIdRef?.current?.push(requestAnimationFrame(animateWaves));
  }

  function handleClick(event) {
    if (action === "shootingFirework") {
      fireworks(event.clientX, event.clientY);
    }
  }

  function fireworks(x, y) {
    const particleCount = 300;
    const angleIncrement = (Math.PI * 2) / particleCount;
    const radius = 8;
    const power = 20;

    for (let i = 0; i < particleCount; i++) {
      const color = `hsl(${randomNumber(0, 360)}, 50%, 50%)`;

      const newParticle = new Spark(x, y, radius, color, {
        // This block uses sin and cos to calculate new coordinates by trnasforming the roll
        // mooviment in a wave based form. This can also crate circles, try to remove
        // "* randomNumber(-power, power)", you have a rintg made by circles
        x: Math.cos(angleIncrement * i) * randomNumber(-power, power),
        y: Math.sin(angleIncrement * i) * randomNumber(-power, power),
      });

      setParticles((prevParticles) => [...prevParticles, newParticle]);
    }
  }

  function animateFireworks() {
    boardContext.fillStyle = "rgba(0, 0, 0, 0.05)";
    boardContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

    setParticles((prevParticles) =>
      prevParticles
        .filter((particle) => particle.opacity > 0)
        .map((particle) => {
          particle.update();
          return particle;
        })
    );

    animationIdRef?.current?.push(requestAnimationFrame(animateFireworks));
  }

  function increaseScale() {
    setScale(scale => scale * 1.1);
  }

  function decreaseScale() {
    setScale(scale => scale / 1.1);
  }

  useEffect(() => {
    if (boardContext && action === "universeFlowing") {
      animateStarts();
    }
  }, [action]);

  /**
   * This useEffect starts the canvas
   */
  useEffect(() => {
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;

    setBoardcontext(context);
  }, []);

  /**
   * This useEffect controls the circle draw on the
   * screen based on the mouse click
   */
  useEffect(() => {
    if (boardContext && isInteracting) {
      switch (action) {
        case "erasing":
          return eraseArea();
        case "drawing":
          return paintLikePencil();
        default:
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinatesState]);

  useEffect(() => {
    const handleResize = (e) => {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      // if (boardContext) {
      const { width, height, ...others } =
        canvasRef?.current.getBoundingClientRect();
      setDimensions({ width, height });

      // setScale()

      // if ()
      // }
    };

    handleResize(); // Chama inicialmente para definir o tamanho
    // Add event listeners when the component mounts
    window.addEventListener("resize", handleResize);

    // Clean up by removing event listeners when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // const adjust = e.deltaY > 0 ? -0.1 : 0.1;
        // setScale(adjust);
      }
    };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        /* setScale(0.1); */
      } else {
        if ((e.ctrlKey || e.metaKey) && e.key === "-") {
          e.preventDefault();
          /* setScale(-0.1); */
        }
      }
    };
    // Add event listeners when the component mounts
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    // Clean up by removing event listeners when the component unmounts
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /**
   * This useEffect trigers the animation every time a range changes
   * to draw constantly new sin on the screen
   */
  useEffect(() => {
    if (boardContext && !isDrawing && action !== "shootingFirework") {
      animateWaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    controlsRangeState.y,
    controlsRangeState.amplitude,
    controlsRangeState.frequencia,
    controlsRangeState.tamanho,
    controlsRangeState.h,
    controlsRangeState.s,
    controlsRangeState.l,
    controlsRangeState.r,
    controlsRangeState.g,
    controlsRangeState.b,
    controlsRangeState.a,
  ]);

  useEffect(() => {
    if (boardContext && !isDrawing) {
      setCursorType("crosshair");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardContext, isDrawing]);


  return (
    <div className={css["board_container"]}>
      <Picker
        list={isDrawing ? tools : animations}
        hasImage={true}
        position={1}
      />

      {hasControls && (
        <Controls
          controlsRange={controlsRange}
          updateRange={updateControlsRange}
          controlsRangeState={controlsRangeState}
          isDrawing={isDrawing}
        />
      )}

      {isDrawing && <Picker list={colors} position={4} />}

      <button
        onClick={updateInteractionMode}
        className={css["presentation-button"]}
        data-is-drawing={isDrawing}
      >
        <Icon name="presentation" size="m" />
      </button>

      {!isDrawing && (
        <button onClick={clearBoard} className={css["clear-button"]}>
          <Icon name="clearAll" size="p" />
        </button>
      )}

      {/*isDrawing && (
        <div className={css["scale-modifier_container"]}>
          <button onClick={increaseScale} className={css["plus-button"]}>
            <Icon name="plus" size="p" />
          </button>
          <button onClick={decreaseScale} className={css["minus-button"]}>
            <Icon name="minus" size="p" />
          </button>
        </div>
      )*/}

      <canvas
        ref={canvasRef}
        className={css["canvas"]}
        style={{ cursor: cursorType }}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={startInteracting}
        onMouseUp={stopInteracting}
        onClick={handleClick}
      />

      <div className={css["cursor_layer"]}>

      </div>
    </div>
  );
}

export default Board;
