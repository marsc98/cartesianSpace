interface Touch2D {
  x: number;
  y: number;
}

interface PinchDelta {
  zoom: number;
  panX: number;
  panY: number;
}

export function calcPinchDelta(
  curr1: Touch2D,
  curr2: Touch2D,
  prev1: Touch2D,
  prev2: Touch2D,
): PinchDelta {
  const currDist = Math.hypot(curr2.x - curr1.x, curr2.y - curr1.y);
  const prevDist = Math.hypot(prev2.x - prev1.x, prev2.y - prev1.y);

  const currMidX = (curr1.x + curr2.x) / 2;
  const currMidY = (curr1.y + curr2.y) / 2;
  const prevMidX = (prev1.x + prev2.x) / 2;
  const prevMidY = (prev1.y + prev2.y) / 2;

  return {
    zoom: (currDist - prevDist) * 0.002,
    panX: currMidX - prevMidX,
    panY: currMidY - prevMidY,
  };
}
