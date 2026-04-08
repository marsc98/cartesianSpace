import * as math from 'mathjs';

interface WorkerRequest {
  expression: string;
}

interface WorkerResponse {
  result?: string;
  error?: string;
}

// Degree-based trig scope — override built-ins so the calculator works in degrees
const scope = {
  sin: (x: number) => Math.sin(x * Math.PI / 180),
  cos: (x: number) => Math.cos(x * Math.PI / 180),
  tan: (x: number) => Math.tan(x * Math.PI / 180),
  asin: (x: number) => Math.asin(x) * 180 / Math.PI,
  acos: (x: number) => Math.acos(x) * 180 / Math.PI,
  atan: (x: number) => Math.atan(x) * 180 / Math.PI,
};

self.addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { expression } = e.data;
  try {
    const computed = math.evaluate(expression, scope);
    let formatted: string;
    if (typeof computed === 'number') {
      if (Math.abs(computed) > 1e-10 && Math.abs(computed) < 1e10) {
        formatted = Number(computed.toPrecision(12)).toString();
      } else {
        formatted = computed.toExponential(8);
      }
    } else {
      formatted = computed.toString();
    }
    const response: WorkerResponse = { result: formatted };
    self.postMessage(response);
  } catch {
    const response: WorkerResponse = { error: 'Expressão inválida' };
    self.postMessage(response);
  }
});
