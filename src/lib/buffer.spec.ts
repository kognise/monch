import { TextDecoder, TextEncoder } from 'util'
import { MonchBuffer } from './buffer'
import {
  BufferInvalidByteCountError,
  BufferOverreadError,
  BufferOverwriteError,
  BufferUnderreadError,
  BufferUnderwriteError
} from './error'

test('instantiation', () => {
  const buffer1 = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  expect(buffer1.byteOffset).toBe(0x00)
  expect(buffer1.byteCapacity).toBe(4)
  expect(buffer1.bitOffset).toBe(0x00)
  expect(buffer1.bitCapacity).toBe(32)

  const buffer2 = new MonchBuffer()
  expect(buffer2.byteOffset).toBe(0x00)
  expect(buffer2.byteCapacity).toBe(0)
  expect(buffer2.bitOffset).toBe(0x00)
  expect(buffer2.bitCapacity).toBe(0)

  const buffer3 = new MonchBuffer(
    [0x00, 0x00, 0x00, 0x00],
    new Uint8Array([0x00, 0x00, 0x00, 0x00])
  )
  expect(buffer3.byteOffset).toBe(0x00)
  expect(buffer3.byteCapacity).toBe(8)
  expect(buffer3.bitOffset).toBe(0x00)
  expect(buffer3.bitCapacity).toBe(64)
})

test('converting to an array', () => {
  const expected: ReadonlyArray<any> = [0x01, 0x02, 0x03, 0x04]
  const buffer = new MonchBuffer(expected)
  expect(buffer.toArray()).toEqual(expected)
})

test('seeking by byte', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])

  buffer.seekByte(0x02)
  expect(buffer.byteOffset).toBe(0x02)

  buffer.seekByte(0x01, true)
  expect(buffer.byteOffset).toBe(0x03)

  buffer.seekByte(0x01)
  expect(buffer.byteOffset).toBe(0x01)
})

test('seeking by bit', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])

  buffer.seekBit(0x0f)
  expect(buffer.bitOffset).toBe(0x0f)

  buffer.seekBit(0x01, true)
  expect(buffer.bitOffset).toBe(0x10)

  buffer.seekBit(0x01)
  expect(buffer.bitOffset).toBe(0x01)
})

test('resetting', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.seekByte(0x02)
  buffer.reset()
  expect(buffer.byteOffset).toBe(0x00)
  expect(buffer.byteCapacity).toBe(0)
  expect(buffer.bitOffset).toBe(0x00)
  expect(buffer.bitCapacity).toBe(0)
})

test('reading bytes', () => {
  const buffer = new MonchBuffer([0x01, 0x02, 0x03, 0x04])
  expect(buffer.readByte(0x00)).toBe(0x01)
  expect(buffer.readByte(0x03)).toBe(0x04)
  expect(buffer.readBytes(0x01, 2)).toEqual(new Uint8Array([0x02, 0x03]))
})

test('reading next bytes', () => {
  const buffer = new MonchBuffer([0x01, 0x02, 0x03, 0x04])
  expect(buffer.readByteNext()).toBe(0x01)
  expect(buffer.readByteNext()).toBe(0x02)
  const temp = buffer.readBytesNext(2)
  expect(temp).toEqual(new Uint8Array([0x03, 0x04]))
})

test.todo('reading bits')

test.todo('reading next bits')

test('reading thicc fancy numbers', () => {
  const buffer = new MonchBuffer([
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00
  ])

  expect(buffer.readUint16BE(0x00)).toEqual(new Uint16Array([0x0100]))
  expect(buffer.readUint16LE(0x00)).toEqual(new Uint16Array([0x0001]))

  expect(buffer.readUint32BE(0x00)).toEqual(new Uint32Array([0x01000000]))
  expect(buffer.readUint32LE(0x00)).toEqual(new Uint32Array([0x00000001]))

  expect(buffer.readUint64BE(0x00)).toEqual(
    new BigUint64Array([BigInt(0x0100000000000000)])
  )
  expect(buffer.readUint64LE(0x00)).toEqual(
    new BigUint64Array([BigInt(0x0000000000000001)])
  )
})

test('reading next thicc fancy numbers', () => {
  const buffer = new MonchBuffer([
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00
  ])

  expect(buffer.readUint16BENext()).toEqual(new Uint16Array([0x0100]))
  expect(buffer.byteOffset).toBe(2)
  buffer.seekByte(0x00)
  expect(buffer.readUint16LENext()).toEqual(new Uint16Array([0x0001]))
  expect(buffer.byteOffset).toBe(2)
  buffer.seekByte(0x00)

  expect(buffer.readUint32BENext()).toEqual(new Uint32Array([0x01000000]))
  expect(buffer.byteOffset).toBe(4)
  buffer.seekByte(0x00)
  expect(buffer.readUint32LENext()).toEqual(new Uint32Array([0x00000001]))
  expect(buffer.byteOffset).toBe(4)
  buffer.seekByte(0x00)

  expect(buffer.readUint64BENext()).toEqual(
    new BigUint64Array([BigInt(0x0100000000000000)])
  )
  expect(buffer.byteOffset).toBe(8)
  buffer.seekByte(0x00)
  expect(buffer.readUint64LENext()).toEqual(
    new BigUint64Array([BigInt(0x0000000000000001)])
  )
  expect(buffer.byteOffset).toBe(8)
})

test('writing thicc fancy numbers', () => {
  const buffer = new MonchBuffer([
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00
  ])

  buffer.writeUint16BE(0x00, new Uint16Array([0x0100, 0x0100]))
  expect(buffer.readByte(0x00)).toBe(0x01)
  expect(buffer.readByte(0x02)).toBe(0x01)
  buffer.writeUint16LE(0x00, new Uint16Array([0x0001, 0x0001]))
  expect(buffer.readByte(0x00)).toBe(0x01)
  expect(buffer.readByte(0x02)).toBe(0x01)

  buffer.writeUint32BE(0x00, new Uint32Array([0x01000000]))
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.writeUint32LE(0x00, new Uint32Array([0x00000001]))
  expect(buffer.readByte(0x00)).toBe(0x01)

  buffer.writeUint64BE(0x00, new BigUint64Array([BigInt(0x0100000000000000)]))
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.writeUint64LE(0x00, new BigUint64Array([BigInt(0x0000000000000001)]))
  expect(buffer.readByte(0x00)).toBe(0x01)
})

test('writing next thicc fancy numbers', () => {
  const buffer = new MonchBuffer([
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00
  ])

  buffer.writeUint16BENext(new Uint16Array([0x0100]))
  expect(buffer.byteOffset).toBe(2)
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.seekByte(0x00)
  buffer.writeUint16LENext(new Uint16Array([0x0001]))
  expect(buffer.byteOffset).toBe(2)
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.seekByte(0x00)

  buffer.writeUint32BENext(new Uint32Array([0x01000000]))
  expect(buffer.byteOffset).toBe(4)
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.seekByte(0x00)
  buffer.writeUint32LENext(new Uint32Array([0x00000001]))
  expect(buffer.byteOffset).toBe(4)
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.seekByte(0x00)

  buffer.writeUint64BENext(new BigUint64Array([BigInt(0x0100000000000000)]))
  expect(buffer.byteOffset).toBe(8)
  expect(buffer.readByte(0x00)).toBe(0x01)
  buffer.seekByte(0x00)
  buffer.writeUint64LENext(new BigUint64Array([BigInt(0x0000000000000001)]))
  expect(buffer.byteOffset).toBe(8)
  expect(buffer.readByte(0x00)).toBe(0x01)
})

test('truncating left', () => {
  const buffer = new MonchBuffer([0x01, 0x02])
  buffer.truncateLeft(1)
  expect(buffer.readByte(0x00)).toBe(0x02)
  expect(buffer.byteCapacity).toBe(1)
})

test('truncating right', () => {
  const buffer = new MonchBuffer([0x01, 0x02])
  buffer.truncateRight(1)
  expect(buffer.readByte(0x00)).toBe(0x01)
  expect(buffer.byteCapacity).toBe(1)
})

test('growing', () => {
  const buffer = new MonchBuffer([0x00, 0x00])
  buffer.grow(2)
  expect(buffer.byteCapacity).toBe(4)
  expect(buffer.readByte(0x02)).toBe(0x00)
})

test('aligning byte', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.seekBit(0x20)
  expect(buffer.byteOffset).toBe(0x00)
  buffer.alignByte()
  expect(buffer.byteOffset).toBe(0x04)
})

test('aligning bit', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.seekByte(0x04)
  expect(buffer.bitOffset).toBe(0x00)
  buffer.alignBit()
  expect(buffer.bitOffset).toBe(0x20)
})

test('getting bytes after', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.seekByte(0x01)
  expect(buffer.afterByte()).toBe(2)
  expect(buffer.afterByte(0x02)).toBe(1)
})

test('getting bits after', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.seekBit(0x0f)
  expect(buffer.afterBit()).toBe(16)
  expect(buffer.afterBit(0x17)).toBe(8)
})

test('writing bytes', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.writeByte(0x03, 0x04)
  buffer.writeBytes(0x00, new Uint8Array([0x01, 0x02]))
  expect(buffer.readBytes(0x00, 4)).toEqual(
    new Uint8Array([0x01, 0x02, 0x00, 0x04])
  )
})

test('writing next bytes', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])
  buffer.writeByteNext(0x01)
  buffer.writeBytesNext(new Uint8Array([0x02, 0x03]))
  expect(buffer.readBytes(0x00, 4)).toEqual(
    new Uint8Array([0x01, 0x02, 0x03, 0x00])
  )
})

test.todo('writing bits')

test.todo('writing next bits')

test('reading errors', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])

  expect(() => buffer.readBytes(0x00, 8)).toThrow(BufferOverreadError)
  expect(() => buffer.readBytes(0x05, 1)).toThrow(BufferOverreadError)
  expect(() => buffer.readBytes(-0x01, 1)).toThrow(BufferUnderreadError)

  expect(() => buffer.readUint16BE(0x00, 4)).toThrow(BufferOverreadError)
  expect(() => buffer.readUint16BE(-0x02, 1)).toThrow(BufferUnderreadError)
  expect(() => buffer.readUint32BE(0x00, 2)).toThrow(BufferOverreadError)
  expect(() => buffer.readUint32BE(-0x04, 1)).toThrow(BufferUnderreadError)
  expect(() => buffer.readUint64BE(0x00, 1)).toThrow(BufferOverreadError)
  expect(() => buffer.readUint64BE(-0x08, 1)).toThrow(BufferUnderreadError)

  expect(() => buffer.readUint16LE(0x00, 4)).toThrow(BufferOverreadError)
  expect(() => buffer.readUint16LE(-0x02, 1)).toThrow(BufferUnderreadError)
  expect(() => buffer.readUint32LE(0x00, 2)).toThrow(BufferOverreadError)
  expect(() => buffer.readUint32LE(-0x04, 1)).toThrow(BufferUnderreadError)
  expect(() => buffer.readUint64LE(0x00, 1)).toThrow(BufferOverreadError)
  expect(() => buffer.readUint64LE(-0x08, 1)).toThrow(BufferUnderreadError)
})

test('writing errors', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])

  expect(() => buffer.writeByte(0x04, 0x00)).toThrow(BufferOverwriteError)
  expect(() => buffer.writeByte(-0x01, 0x00)).toThrow(BufferUnderwriteError)

  expect(() =>
    buffer.writeBytes(0x00, new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00]))
  ).toThrow(BufferOverwriteError)
  expect(() => buffer.writeBytes(0x05, new Uint8Array([0x00]))).toThrow(
    BufferOverwriteError
  )
  expect(() => buffer.writeBytes(-0x01, new Uint8Array([0x00]))).toThrow(
    BufferUnderwriteError
  )

  expect(() =>
    buffer.writeUint16BE(
      0x00,
      new Uint16Array([0x0000, 0x0000, 0x0000, 0x0000])
    )
  ).toThrow(BufferOverwriteError)
  expect(() => buffer.writeUint16BE(-0x02, new Uint16Array([0x0000]))).toThrow(
    BufferUnderwriteError
  )
  expect(() =>
    buffer.writeUint32BE(0x00, new Uint32Array([0x00000000, 0x00000000]))
  ).toThrow(BufferOverwriteError)
  expect(() =>
    buffer.writeUint32BE(-0x04, new Uint32Array([0x00000000]))
  ).toThrow(BufferUnderwriteError)
  expect(() =>
    buffer.writeUint64BE(0x00, new BigUint64Array([BigInt(0x0000000000000000)]))
  ).toThrow(BufferOverwriteError)
  expect(() =>
    buffer.writeUint64BE(
      -0x08,
      new BigUint64Array([BigInt(0x0000000000000000)])
    )
  ).toThrow(BufferUnderwriteError)

  expect(() =>
    buffer.writeUint16LE(
      0x00,
      new Uint16Array([0x0000, 0x0000, 0x0000, 0x0000])
    )
  ).toThrow(BufferOverwriteError)
  expect(() => buffer.writeUint16LE(-0x02, new Uint16Array([0x0000]))).toThrow(
    BufferUnderwriteError
  )
  expect(() =>
    buffer.writeUint32LE(0x00, new Uint32Array([0x00000000, 0x00000000]))
  ).toThrow(BufferOverwriteError)
  expect(() =>
    buffer.writeUint32LE(-0x04, new Uint32Array([0x00000000]))
  ).toThrow(BufferUnderwriteError)
  expect(() =>
    buffer.writeUint64LE(0x00, new BigUint64Array([BigInt(0x0000000000000000)]))
  ).toThrow(BufferOverwriteError)
  expect(() =>
    buffer.writeUint64LE(
      -0x08,
      new BigUint64Array([BigInt(0x0000000000000000)])
    )
  ).toThrow(BufferUnderwriteError)
})

test('other errors', () => {
  const buffer = new MonchBuffer([0x00, 0x00, 0x00, 0x00])

  expect(() => buffer.truncateLeft(-1)).toThrow(BufferInvalidByteCountError)
  expect(() => buffer.truncateRight(-1)).toThrow(BufferInvalidByteCountError)
  expect(() => buffer.grow(-1)).toThrow(BufferInvalidByteCountError)
})

test('example 1', () => {
  const buffer = new MonchBuffer()
  buffer.grow(12)
  buffer.writeBytesNext(new TextEncoder().encode('hello, world'))
  expect(new TextDecoder().decode(buffer.toUint8Array())).toBe('hello, world')
})

test('example 2', () => {
  const buffer = new MonchBuffer()
  buffer.grow(4)
  buffer.writeUint32BE(0x00, new Uint32Array([0xdeadbeef]))
  expect(buffer.toArray()).toEqual([0xde, 0xad, 0xbe, 0xef])
})
