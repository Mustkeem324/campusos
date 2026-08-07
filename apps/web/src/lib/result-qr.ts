const VERSION = 6;
const SIZE = 17 + VERSION * 4;
const DATA_CODEWORDS = 136;
const DATA_BLOCKS = 2;
const DATA_CODEWORDS_PER_BLOCK = 68;
const ECC_CODEWORDS_PER_BLOCK = 18;

const GF_EXP = new Array<number>(512).fill(0);
const GF_LOG = new Array<number>(256).fill(0);
initializeGaloisField();

/**
 * Creates a standards-compliant QR Code Model 2 matrix using Version 6-L,
 * byte mode and mask pattern 0. Version 6-L provides enough capacity for the
 * signed CampusOS verification URL while keeping the implementation small and
 * dependency-free for both the browser and server PDF renderer.
 */
export function createResultQrMatrix(text: string): boolean[][] | null {
  const bytes = new TextEncoder().encode(text);
  // Version 6-L byte-mode capacity is 134 bytes.
  if (bytes.length > 134) return null;

  const matrix: Array<Array<boolean | null>> = Array.from({ length: SIZE }, () => Array<boolean | null>(SIZE).fill(null));
  const functionModules: boolean[][] = Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false));

  const setFunction = (row: number, column: number, value: boolean) => {
    if (row < 0 || row >= SIZE || column < 0 || column >= SIZE) return;
    matrix[row][column] = value;
    functionModules[row][column] = true;
  };

  drawFinder(0, 0, setFunction);
  drawFinder(0, SIZE - 7, setFunction);
  drawFinder(SIZE - 7, 0, setFunction);

  for (let index = 8; index < SIZE - 8; index += 1) {
    const value = index % 2 === 0;
    setFunction(6, index, value);
    setFunction(index, 6, value);
  }

  // Version 6 alignment centres are 6 and 34. Three candidate patterns
  // overlap finder regions; the bottom-right pattern is the only one drawn.
  const alignmentCentres = [6, 34];
  for (const row of alignmentCentres) {
    for (const column of alignmentCentres) {
      if (functionModules[row][column]) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(row + dy, column + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Reserve and write format information for error-correction level L, mask 0.
  const format = formatBits(0b01, 0);
  for (let index = 0; index < 15; index += 1) {
    const bit = ((format >>> index) & 1) === 1;

    let verticalRow: number;
    if (index < 6) verticalRow = index;
    else if (index < 8) verticalRow = index + 1;
    else verticalRow = SIZE - 15 + index;
    setFunction(verticalRow, 8, bit);

    let horizontalColumn: number;
    if (index < 8) horizontalColumn = SIZE - index - 1;
    else if (index < 9) horizontalColumn = 15 - index;
    else horizontalColumn = 15 - index - 1;
    setFunction(8, horizontalColumn, bit);
  }
  setFunction(SIZE - 8, 8, true);

  const codewords = encodeCodewords(bytes);
  const dataBits: number[] = [];
  for (const byte of codewords) {
    for (let bit = 7; bit >= 0; bit -= 1) dataBits.push((byte >>> bit) & 1);
  }

  let bitIndex = 0;
  let row = SIZE - 1;
  let direction = -1;

  for (let right = SIZE - 1; right > 0; right -= 2) {
    if (right === 6) right -= 1;
    while (true) {
      for (const column of [right, right - 1]) {
        if (functionModules[row][column]) continue;
        let bit = bitIndex < dataBits.length ? dataBits[bitIndex] : 0;
        bitIndex += 1;
        // Mask pattern 0.
        if ((row + column) % 2 === 0) bit ^= 1;
        matrix[row][column] = bit === 1;
      }
      row += direction;
      if (row < 0 || row >= SIZE) {
        row -= direction;
        direction = -direction;
        break;
      }
    }
  }

  return matrix.map((matrixRow) => matrixRow.map(Boolean));
}

export function resultQrSvgDataUri(text: string, moduleSize = 4) {
  const matrix = createResultQrMatrix(text);
  if (!matrix) return null;
  const quiet = 4;
  const dimension = (matrix.length + quiet * 2) * moduleSize;
  const paths: string[] = [];
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix.length; column += 1) {
      if (!matrix[row][column]) continue;
      const x = (column + quiet) * moduleSize;
      const y = (row + quiet) * moduleSize;
      paths.push(`M${x} ${y}h${moduleSize}v${moduleSize}h-${moduleSize}z`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${paths.join('')}" fill="#111827"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function drawFinder(
  top: number,
  left: number,
  setFunction: (row: number, column: number, value: boolean) => void,
) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const inside = dy >= 0 && dy <= 6 && dx >= 0 && dx <= 6;
      const value = inside && (dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4));
      setFunction(top + dy, left + dx, value);
    }
  }
}

function encodeCodewords(data: Uint8Array) {
  const bits: number[] = [];
  pushBits(bits, 0b0100, 4); // byte mode
  pushBits(bits, data.length, 8); // version 1-9 byte count
  for (const byte of data) pushBits(bits, byte, 8);

  const capacityBits = DATA_CODEWORDS * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  for (let index = 0; index < terminator; index += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let offset = 0; offset < 8; offset += 1) value = (value << 1) | bits[index + offset];
    dataCodewords.push(value);
  }
  let padIndex = 0;
  const pads = [0xec, 0x11];
  while (dataCodewords.length < DATA_CODEWORDS) {
    dataCodewords.push(pads[padIndex % 2]);
    padIndex += 1;
  }

  const blocks = Array.from({ length: DATA_BLOCKS }, (_, blockIndex) =>
    dataCodewords.slice(blockIndex * DATA_CODEWORDS_PER_BLOCK, (blockIndex + 1) * DATA_CODEWORDS_PER_BLOCK),
  );
  const errorCorrection = blocks.map((block) => reedSolomonRemainder(block, ECC_CODEWORDS_PER_BLOCK));

  const output: number[] = [];
  for (let index = 0; index < DATA_CODEWORDS_PER_BLOCK; index += 1) {
    for (const block of blocks) output.push(block[index]);
  }
  for (let index = 0; index < ECC_CODEWORDS_PER_BLOCK; index += 1) {
    for (const block of errorCorrection) output.push(block[index]);
  }
  return output;
}

function pushBits(target: number[], value: number, width: number) {
  for (let bit = width - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1);
}

function initializeGaloisField() {
  let value = 1;
  for (let exponent = 0; exponent < 255; exponent += 1) {
    GF_EXP[exponent] = value;
    GF_LOG[value] = exponent;
    value <<= 1;
    if ((value & 0x100) !== 0) value ^= 0x11d;
  }
  for (let exponent = 255; exponent < GF_EXP.length; exponent += 1) GF_EXP[exponent] = GF_EXP[exponent - 255];
}

function gfMultiply(left: number, right: number) {
  if (left === 0 || right === 0) return 0;
  return GF_EXP[GF_LOG[left] + GF_LOG[right]];
}

function reedSolomonGenerator(degree: number) {
  let generator = [1];
  for (let exponent = 0; exponent < degree; exponent += 1) {
    const next = new Array<number>(generator.length + 1).fill(0);
    for (let index = 0; index < generator.length; index += 1) {
      next[index] ^= generator[index];
      next[index + 1] ^= gfMultiply(generator[index], GF_EXP[exponent]);
    }
    generator = next;
  }
  return generator;
}

function reedSolomonRemainder(data: number[], degree: number) {
  const generator = reedSolomonGenerator(degree);
  const remainder = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    for (let index = 0; index < degree - 1; index += 1) remainder[index] = remainder[index + 1];
    remainder[degree - 1] = 0;
    for (let index = 0; index < degree; index += 1) remainder[index] ^= gfMultiply(generator[index + 1], factor);
  }
  return remainder;
}

function formatBits(errorCorrectionBits: number, maskPattern: number) {
  const data = (errorCorrectionBits << 3) | maskPattern;
  let remainder = data << 10;
  const generator = 0x537;
  while (bitLength(remainder) >= bitLength(generator)) {
    remainder ^= generator << (bitLength(remainder) - bitLength(generator));
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function bitLength(value: number) {
  let length = 0;
  let remaining = value;
  while (remaining !== 0) {
    length += 1;
    remaining >>>= 1;
  }
  return length;
}
