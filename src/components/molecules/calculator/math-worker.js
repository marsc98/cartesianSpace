import * as math from 'mathjs';

const scope = {
  sin: (x) => math.sin(math.unit(x, 'deg')),
  cos: (x) => math.cos(math.unit(x, 'deg')),
  tan: (x) => math.tan(math.unit(x, 'deg')),
  asin: (x) => math.number(math.asin(x), 'deg'),
  acos: (x) => math.number(math.acos(x), 'deg'),
  atan: (x) => math.number(math.atan(x), 'deg'),
};

self.onmessage = ({ data: { expression } }) => {
  try {
    const computed = math.evaluate(expression, scope);
    let formatted;
    if (typeof computed === 'number') {
      if (Math.abs(computed) > 1e-10 && Math.abs(computed) < 1e10) {
        formatted = Number(computed.toPrecision(12)).toString();
      } else {
        formatted = computed.toExponential(8);
      }
    } else {
      formatted = computed.toString();
    }
    self.postMessage({ result: formatted });
  } catch {
    self.postMessage({ error: 'Expressão inválida' });
  }
};
