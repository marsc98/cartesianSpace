import { useCallback } from 'react';

export const useCreationEvents = (
  {
    elementsIsActive,
    drawerRef,
    elementsRef,
    awaitingSecondClick,
    lineBetweenPointsRef,
    setLinePoints,
    setAwaitingSecondClick,
    handleCreativityOnSpace,
    sceneRef,
    elementsStackRef,
    cartesianSpaceRef,
    addElement,
    pushHistory,
    functionRef,
    functionState,
    addFunctionToCartesianSpace,
    selectedTerrainRef,
    colorRef,
    sizeRef,
    drawDistanceRef,
    setIsResizingElement,
    initialElementsCoordinatesRef,
    raycasterRef,
    mouseRef,
    cameraRef,
    linePoints,
    axisRef,
    controlsRef,
  }: any
) => {

  const handleBoardClick = useCallback(
    (intersectionPoint: any, clientX: number, clientY: number) => {
      if (!intersectionPoint && !elementsIsActive) return;
      if (drawerRef.current.active) return;

      const isLine = elementsRef?.current?.shape === 'line';

      if (
        (!awaitingSecondClick && !isLine) ||
        (awaitingSecondClick && isLine)
      ) {
        setIsResizingElement(true);
        initialElementsCoordinatesRef.current = {
          x: clientX,
          y: clientY,
        };

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const distance = drawDistanceRef.current;
        const point = raycasterRef.current.ray.direction
          .clone()
          .multiplyScalar(distance)
          .add(cameraRef.current.position);

        if (elementsIsActive) {
          switch (elementsRef.current.shape) {
            case 'point':
              handleCreativityOnSpace(
                {
                  element: 'point',
                  position: point,
                  origin: { x: point.x, y: point.y, z: point.z },
                  color: colorRef.current,
                  size: sizeRef.current,
                },
                sceneRef,
                elementsStackRef,
                cartesianSpaceRef,
                addElement,
                false,
                pushHistory,
              );
              break;
            case 'semi-circle':
              handleCreativityOnSpace(
                {
                  element: 'semi-circle',
                  position: point,
                  origin: { x: point.x, y: point.y, z: point.z },
                  color: colorRef.current,
                  size: sizeRef.current,
                },
                sceneRef,
                elementsStackRef,
                cartesianSpaceRef,
                addElement,
                false,
                pushHistory,
              );
              break;
            case 'circle':
              handleCreativityOnSpace(
                {
                  element: 'circle',
                  position: point,
                  origin: { x: point.x, y: point.y, z: point.z },
                  color: colorRef.current,
                  size: sizeRef.current,
                },
                sceneRef,
                elementsStackRef,
                cartesianSpaceRef,
                addElement,
                false,
                pushHistory,
              );
              break;
            case 'polygon':
              handleCreativityOnSpace(
                {
                  element: 'polygon',
                  position: point,
                  origin: { x: point.x, y: point.y, z: point.z },
                  color: colorRef.current,
                  size: sizeRef.current,
                },
                sceneRef,
                elementsStackRef,
                cartesianSpaceRef,
                addElement,
                false,
                pushHistory,
              );
              break;
            case 'freePolygon':
              handleCreativityOnSpace(
                {
                  element: 'freePolygon',
                  position: point,
                  origin: { x: point.x, y: point.y, z: point.z },
                  color: colorRef.current,
                  size: sizeRef.current,
                },
                sceneRef,
                elementsStackRef,
                cartesianSpaceRef,
                addElement,
                false,
                pushHistory,
              );
              break;
            case 'triangle':
              handleCreativityOnSpace(
                {
                  element: 'triangle',
                  position: point,
                  origin: { x: point.x, y: point.y, z: point.z },
                  color: colorRef.current,
                  size: sizeRef.current,
                },
                sceneRef,
                elementsStackRef,
                cartesianSpaceRef,
                addElement,
                false,
                pushHistory,
              );
              break;
            case 'line':
              if (awaitingSecondClick) {
                lineBetweenPointsRef.current = [
                  linePoints[0],
                  intersectionPoint,
                ];
                handleCreativityOnSpace(
                  {
                    element: 'line',
                    color: colorRef.current,
                    size: sizeRef.current,
                    position: [linePoints[0], intersectionPoint],
                    origin: {
                      x: (linePoints[0].x + intersectionPoint.x) / 2,
                      y: (linePoints[0].y + intersectionPoint.y) / 2,
                      z: (linePoints[0].z + intersectionPoint.z) / 2,
                    },
                  },
                  sceneRef,
                  elementsStackRef,
                  cartesianSpaceRef,
                  addElement,
                  false,
                  pushHistory,
                );
                setLinePoints([]);
                setAwaitingSecondClick(false);
              }
              break;

            case 'axis':
              if (axisRef?.current) {
                if (controlsRef?.current?.controlPressed) {
                  lineBetweenPointsRef.current.push(intersectionPoint);

                  if (lineBetweenPointsRef.current.length === 2) {
                    handleCreativityOnSpace(
                      {
                        element: 'line',
                        color: colorRef.current,
                        size: sizeRef.current,
                        position: [
                          lineBetweenPointsRef.current[0],
                          lineBetweenPointsRef.current[1],
                        ],
                        origin: {
                          x: (lineBetweenPointsRef.current[0].x + lineBetweenPointsRef.current[1].x) / 2,
                          y: (lineBetweenPointsRef.current[0].y + lineBetweenPointsRef.current[1].y) / 2,
                          z: (lineBetweenPointsRef.current[0].z + lineBetweenPointsRef.current[1].z) / 2,
                        },
                      },
                      sceneRef,
                      elementsStackRef,
                      cartesianSpaceRef,
                      addElement,
                      false,
                      pushHistory,
                    );
                    lineBetweenPointsRef.current = [];
                  }
                }
              }

              break;
            case 'mountains':
              break;

            default:
              break;
          }
        }
      } else {
        setLinePoints([intersectionPoint]);
        setAwaitingSecondClick(true);
      }

      if (functionRef.current) {
        addFunctionToCartesianSpace(
          functionState,
          sceneRef,
          elementsStackRef,
          intersectionPoint,
        );
        functionRef.current = false;
      }
    },
    [
      elementsIsActive,
      drawerRef,
      elementsRef,
      awaitingSecondClick,
      setIsResizingElement,
      initialElementsCoordinatesRef,
      raycasterRef,
      mouseRef,
      cameraRef,
      colorRef,
      sizeRef,
      sceneRef,
      elementsStackRef,
      cartesianSpaceRef,
      addElement,
      pushHistory,
      linePoints,
      setLinePoints,
      setAwaitingSecondClick,
      functionRef,
      addFunctionToCartesianSpace,
      functionState,
      handleCreativityOnSpace,
      axisRef,
      controlsRef,
      lineBetweenPointsRef,
    ],
  );

  return { handleBoardClick };
};
