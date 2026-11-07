// PTS1 (little-endian): 16-byte header ("PTS1", uint32 N, float32 spacing, uint32 reserved),
// then N records of 16 bytes: float32 x, y, z (Z up) + uint8 r, g, b, intensity.
const HEADER = 16;
const RECORD = 16;

export interface Cloud {
  count: number;
  positions: Float32Array; // x, y, z per point
  colors: Uint8Array; // r, g, b per point (normalized by three.js on the GPU, no float copy)
}

export class CloudFormatError extends Error {}

export function parsePts1(buffer: ArrayBuffer): Cloud {
  if (buffer.byteLength < HEADER)
    throw new CloudFormatError("The point cloud file is empty or damaged.");
  const view = new DataView(buffer);
  const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
  if (magic !== "PTS1")
    throw new CloudFormatError("This is not a PTS1 point cloud.");
  const count = view.getUint32(4, true);
  // The header announces N: fewer bytes means the download or the file was cut off.
  if (buffer.byteLength !== HEADER + count * RECORD)
    throw new CloudFormatError(
      "The point cloud file is incomplete (truncated).",
    );

  const positions = new Float32Array(count * 3);
  const colors = new Uint8Array(count * 3);
  const bytes = new Uint8Array(buffer);
  for (let i = 0, o = HEADER; i < count; i++, o += RECORD) {
    positions[i * 3] = view.getFloat32(o, true);
    positions[i * 3 + 1] = view.getFloat32(o + 4, true);
    positions[i * 3 + 2] = view.getFloat32(o + 8, true);
    colors[i * 3] = bytes[o + 12]!;
    colors[i * 3 + 1] = bytes[o + 13]!;
    colors[i * 3 + 2] = bytes[o + 14]!;
  }
  return { count, positions, colors };
}
