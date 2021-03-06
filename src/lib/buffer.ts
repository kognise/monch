import {
  BufferInvalidByteCountError,
  BufferOverreadError,
  BufferOverwriteError,
  BufferUnderreadError,
  BufferUnderwriteError
} from './error'

/**
 * The superfast buffer class that's the main part of Monch.
 *
 * Here's a simple example to try out:
 * ```js
 * const buffer = new MonchBuffer()
 * buffer.grow(8)
 * buffer.writeUint32BE(0x00, new Uint32Array([ 0xDEADBEEF ]))
 * console.log(buffer.toArray())
 * ```
 */
export class MonchBuffer {
  /**
   * The current read/write position in bytes.
   */
  public byteOffset: number

  /**
   * The current buffer size in bytes.
   */
  public byteCapacity: number

  /**
   * The current read/write position in bits.
   */
  public bitOffset: number

  /**
   * The current buffer size in bits.
   */
  public bitCapacity: number

  /**
   * @ignore
   *
   * The internal data store.
   */
  private typedArray: Uint8Array

  /**
   * @param slices You may optionally pass iterables that will be concatenated to initially populate the buffer
   */
  constructor(...slices: Array<Iterable<number>>) {
    this.byteOffset = 0x00
    this.bitOffset = 0x00

    switch (slices.length) {
      case 0:
        this.typedArray = new Uint8Array()
        break

      case 1:
        this.typedArray = Uint8Array.from(slices[0])
        break

      default:
        // TODO: optimize this case
        this.typedArray = Uint8Array.from(
          slices.reduce<number[]>((p, c) => {
            p.push(...c)
            return p
          }, [])
        )
        break
    }

    this.refresh()
  }

  /**
   * Returns the next byte from the specified offset without modifying the internal position.
   *
   * @param offset An offset
   */
  public readByte(offset: number) {
    return this.readBytes(offset, 1)[0]
  }

  /**
   * Returns the next n bytes from the specified offset without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many bytes to read
   */
  public readBytes(offset: number, count: number) {
    if (offset + count > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    return this.typedArray.slice(offset, offset + count)
  }

  /**
   * Returns the next byte from the current offset and moves the offset forward a byte.
   */
  public readByteNext() {
    // TODO: explore possible optimizations
    const temp = this.readByte(this.byteOffset)
    this.seekByte(1, true)
    return temp
  }

  /**
   * Returns the next n bytes from the current offset and moves the offset forward the amount of bytes read.
   *
   * @param count How many bytes to read
   */
  public readBytesNext(count: number) {
    // TODO: explore possible optimizations
    const temp = this.readBytes(this.byteOffset, count)
    this.seekByte(count, true)
    return temp
  }

  /**
   * Reads a `Uint16Array` from the buffer at the specified offset in big-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many uint16s to read
   */
  public readUint16BE(offset: number, count = 1) {
    if (offset + count * 2 > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    const temp = new Uint16Array(count)
    for (let i = 0; i < count; i++) {
      temp[i] =
        this.typedArray[offset + (1 + i * 2)] |
        (this.typedArray[offset + i * 2] << 8)
    }
    return temp
  }

  /**
   * Reads a `Uint16Array` from the buffer at the specified offset in little-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many uint16s to read
   */
  public readUint16LE(offset: number, count = 1) {
    if (offset + count * 2 > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    const temp = new Uint16Array(count)
    for (let i = 0; i < count; i++) {
      temp[i] =
        this.typedArray[offset + i * 2] |
        (this.typedArray[offset + (1 + i * 2)] << 8)
    }
    return temp
  }

  /**
   * Reads a `Uint16Array` from current offset in big-endian and moves the offset forward the amount of bytes read.
   *
   * @param count How many uint16s to read
   */
  public readUint16BENext(count = 1) {
    const temp = this.readUint16BE(this.byteOffset, count)
    this.seekByte(count * 2, true)
    return temp
  }

  /**
   * Reads a `Uint16Array` from current offset in little-endian and moves the offset forward the amount of bytes read.
   *
   * @param count How many uint16s to read
   */
  public readUint16LENext(count = 1) {
    const temp = this.readUint16LE(this.byteOffset, count)
    this.seekByte(count * 2, true)
    return temp
  }

  /**
   * Reads a `Uint32Array` from the buffer at the specified offset in big-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many uint32s to read
   */
  public readUint32BE(offset: number, count = 1) {
    if (offset + count * 4 > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    const temp = new Uint32Array(count)
    for (let i = 0; i < count; i++) {
      temp[i] =
        this.typedArray[offset + (3 + i * 4)] |
        (this.typedArray[offset + (2 + i * 4)] << 8) |
        (this.typedArray[offset + (1 + i * 4)] << 16) |
        (this.typedArray[offset + i * 4] << 24)
    }
    return temp
  }

  /**
   * Reads a `Uint32Array` from the buffer at the specified offset in little-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many uint32s to read
   */
  public readUint32LE(offset: number, count = 1) {
    if (offset + count * 4 > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    const temp = new Uint32Array(count)
    for (let i = 0; i < count; i++) {
      temp[i] =
        this.typedArray[offset + i * 4] |
        (this.typedArray[offset + (1 + i * 4)] << 8) |
        (this.typedArray[offset + (2 + i * 4)] << 16) |
        (this.typedArray[offset + (3 + i * 4)] << 24)
    }
    return temp
  }

  /**
   * Reads a `Uint32Array` from current offset in big-endian and moves the offset forward the amount of bytes read.
   *
   * @param count How many uint32s to read
   */
  public readUint32BENext(count = 1) {
    const temp = this.readUint32BE(this.byteOffset, count)
    this.seekByte(count * 4, true)
    return temp
  }

  /**
   * Reads a `Uint32Array` from current offset in little-endian and moves the offset forward the amount of bytes read.
   *
   * @param count How many uint32s to read
   */
  public readUint32LENext(count = 1) {
    const temp = this.readUint32LE(this.byteOffset, count)
    this.seekByte(count * 4, true)
    return temp
  }

  /**
   * Reads a `BigUint64Array` from the buffer at the specified offset in big-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many uint64s to read
   */
  public readUint64BE(offset: number, count = 1) {
    if (offset + count * 8 > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    const temp = new BigUint64Array(count)
    for (let i = 0; i < count; i++) {
      // TODO: look into BigInt optimization opportunities
      temp[i] =
        BigInt(this.typedArray[offset + (7 + i * 8)]) |
        (BigInt(this.typedArray[offset + (6 + i * 8)]) << BigInt(8)) |
        (BigInt(this.typedArray[offset + (5 + i * 8)]) << BigInt(16)) |
        (BigInt(this.typedArray[offset + (4 + i * 8)]) << BigInt(24)) |
        (BigInt(this.typedArray[offset + (3 + i * 8)]) << BigInt(32)) |
        (BigInt(this.typedArray[offset + (2 + i * 8)]) << BigInt(40)) |
        (BigInt(this.typedArray[offset + (1 + i * 8)]) << BigInt(48)) |
        (BigInt(this.typedArray[offset + i * 8]) << BigInt(56))
    }
    return temp
  }

  /**
   * Reads a `BigUint64Array` from the buffer at the specified offset in little-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param count  How many uint64s to read
   */
  public readUint64LE(offset: number, count = 1) {
    if (offset + count * 8 > this.byteCapacity) {
      throw new BufferOverreadError()
    }
    if (offset < 0x00) {
      throw new BufferUnderreadError()
    }

    const temp = new BigUint64Array(count)
    for (let i = 0; i < count; i++) {
      temp[i] =
        BigInt(this.typedArray[offset + i * 8]) |
        (BigInt(this.typedArray[offset + (1 + i * 8)]) << BigInt(8)) |
        (BigInt(this.typedArray[offset + (2 + i * 8)]) << BigInt(16)) |
        (BigInt(this.typedArray[offset + (3 + i * 8)]) << BigInt(24)) |
        (BigInt(this.typedArray[offset + (4 + i * 8)]) << BigInt(32)) |
        (BigInt(this.typedArray[offset + (5 + i * 8)]) << BigInt(40)) |
        (BigInt(this.typedArray[offset + (6 + i * 8)]) << BigInt(48)) |
        (BigInt(this.typedArray[offset + (7 + i * 8)]) << BigInt(56))
    }
    return temp
  }

  /**
   * Reads a `BigUint64Array` from current offset in big-endian and moves the offset forward the amount of bytes read.
   *
   * @param count How many uint64s to read
   */
  public readUint64BENext(count = 1) {
    const temp = this.readUint64BE(this.byteOffset, count)
    this.seekByte(count * 8, true)
    return temp
  }

  /**
   * Reads a `BigUint64Array` from current offset in little-endian and moves the offset forward the amount of bytes read.
   *
   * @param count How many uint64s to read
   */
  public readUint64LENext(count = 1) {
    const temp = this.readUint64LE(this.byteOffset, count)
    this.seekByte(count * 8, true)
    return temp
  }

  // TODO: check if offsets should be BigInts

  /**
   * Writes a `Uint16Array` to the buffer at the specified offset in big-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeUint16BE(offset: number, data: Uint16Array) {
    if (offset + data.length * 2 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    for (let i = 0; i < data.length; i++) {
      this.typedArray[offset + i * 2] = data[i] >> 8
      this.typedArray[offset + i * 2 + 1] = data[i]
    }
  }

  /**
   * Writes a `Uint16Array` to the buffer at the specified offset in little-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeUint16LE(offset: number, data: Uint16Array) {
    if (offset + data.length * 2 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    for (let i = 0; i < data.length; i++) {
      this.typedArray[offset + i * 2] = data[i]
      this.typedArray[offset + i * 2 + 1] = data[i] >> 8
    }
  }

  /**
   * Writes a `Uint16Array` to the buffer at the specified offset in big-endian and moves the internal position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeUint16BENext(data: Uint16Array) {
    const temp = this.writeUint16BE(this.byteOffset, data)
    this.seekByte(data.length * 2, true)
    return temp
  }

  /**
   * Writes a `Uint16Array` to the buffer at the specified offset in little-endian and moves the internal position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeUint16LENext(data: Uint16Array) {
    const temp = this.writeUint16LE(this.byteOffset, data)
    this.seekByte(data.length * 2, true)
    return temp
  }

  /**
   * Writes a `Uint32Array` to the buffer at the specified offset in big-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeUint32BE(offset: number, data: Uint32Array) {
    if (offset + data.length * 4 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    for (let i = 0; i < data.length; i++) {
      this.typedArray[offset + i * 4] = data[i] >> 24
      this.typedArray[offset + i * 4 + 1] = data[i] >> 16
      this.typedArray[offset + i * 4 + 2] = data[i] >> 8
      this.typedArray[offset + i * 4 + 3] = data[i]
    }
  }

  /**
   * Writes a `Uint32Array` to the buffer at the specified offset in little-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeUint32LE(offset: number, data: Uint32Array) {
    if (offset + data.length * 4 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    for (let i = 0; i < data.length; i++) {
      this.typedArray[offset + i * 4] = data[i]
      this.typedArray[offset + i * 4 + 1] = data[i] >> 8
      this.typedArray[offset + i * 4 + 2] = data[i] >> 16
      this.typedArray[offset + i * 4 + 3] = data[i] >> 24
    }
  }

  /**
   * Writes a `Uint32Array` to the buffer at the specified offset in big-endian and moves the internal position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeUint32BENext(data: Uint32Array) {
    const temp = this.writeUint32BE(this.byteOffset, data)
    this.seekByte(data.length * 4, true)
    return temp
  }

  /**
   * Writes a `Uint32Array` to the buffer at the specified offset in little-endian and moves the internal position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeUint32LENext(data: Uint32Array) {
    const temp = this.writeUint32LE(this.byteOffset, data)
    this.seekByte(data.length * 4, true)
    return temp
  }

  /**
   * Writes a `BigUint64Array` to the buffer at the specified offset in big-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeUint64BE(offset: number, data: BigUint64Array) {
    if (offset + data.length * 8 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    for (let i = 0; i < data.length; i++) {
      // TODO: look into potential speed improvements
      this.typedArray[offset + i * 8] = Number(data[i] >> BigInt(56))
      this.typedArray[offset + i * 8 + 1] = Number(data[i] >> BigInt(48))
      this.typedArray[offset + i * 8 + 2] = Number(data[i] >> BigInt(40))
      this.typedArray[offset + i * 8 + 3] = Number(data[i] >> BigInt(32))
      this.typedArray[offset + i * 8 + 4] = Number(data[i] >> BigInt(24))
      this.typedArray[offset + i * 8 + 5] = Number(data[i] >> BigInt(16))
      this.typedArray[offset + i * 8 + 6] = Number(data[i] >> BigInt(8))
      this.typedArray[offset + i * 8 + 7] = Number(data[i])
    }
  }

  /**
   * Writes a `BigUint64Array` to the buffer at the specified offset in little-endian without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeUint64LE(offset: number, data: BigUint64Array) {
    if (offset + data.length * 8 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    for (let i = 0; i < data.length; i++) {
      this.typedArray[offset + i * 8] = Number(data[i])
      this.typedArray[offset + i * 8 + 1] = Number(data[i] >> BigInt(8))
      this.typedArray[offset + i * 8 + 2] = Number(data[i] >> BigInt(16))
      this.typedArray[offset + i * 8 + 3] = Number(data[i] >> BigInt(24))
      this.typedArray[offset + i * 8 + 4] = Number(data[i] >> BigInt(32))
      this.typedArray[offset + i * 8 + 5] = Number(data[i] >> BigInt(40))
      this.typedArray[offset + i * 8 + 6] = Number(data[i] >> BigInt(48))
      this.typedArray[offset + i * 8 + 7] = Number(data[i] >> BigInt(56))
    }
  }

  /**
   * Writes a `BigUint64Array` to the buffer at the specified offset in big-endian and moves the internal position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeUint64BENext(data: BigUint64Array) {
    const temp = this.writeUint64BE(this.byteOffset, data)
    this.seekByte(data.length * 8, true)
    return temp
  }

  /**
   * Writes a `BigUint64Array` to the buffer at the specified offset in little-endian and moves the internal position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeUint64LENext(data: BigUint64Array) {
    const temp = this.writeUint64LE(this.byteOffset, data)
    this.seekByte(data.length * 8, true)
    return temp
  }

  /**
   * Counts the amount of bytes located after the current position or the specified one.
   *
   * @param offset An offset
   */
  public afterByte(offset?: number) {
    if (offset) {
      return this.byteCapacity - offset - 1
    }
    return this.byteCapacity - this.byteOffset - 1
  }

  /**
   * Counts the amount of bits located after the current position or the specified one.
   *
   * @param offset An offset
   */
  public afterBit(offset?: number) {
    if (offset) {
      return this.bitCapacity - offset - 1
    }
    return this.bitCapacity - this.bitOffset - 1
  }

  /**
   * Seeks to a position by an offset either relative to the current position or not.
   * This will not update the bit offset unless you call [[alignBit]].
   *
   * @param offset   An offset
   * @param relative Whether or not to seek relative to the current position
   */
  public seekByte(offset: number, relative = false) {
    if (relative) {
      this.byteOffset += offset
    } else {
      this.byteOffset = offset
    }
  }

  /**
   * Seeks to a position by an offset either relative to the current position or not.
   * This will not update the bit offset unless you call [[alignByte]].
   *
   * @param offset   An offset
   * @param relative Whether or not to seek relative to the current position
   */
  public seekBit(offset: number, relative = false) {
    if (relative) {
      this.bitOffset += offset
    } else {
      this.bitOffset = offset
    }
  }

  /**
   * Removes n items from the left of the buffer.
   *
   * ```js
   * const buffer = new MonchBuffer([ 0x01, 0x02, 0x03, 0x04 ])
   * buffer.truncateLeft(2)
   * console.log(buffer) // [ 0x03, 0x04 ]
   * ```
   *
   * @param amount The amount of items to remove
   */
  public truncateLeft(amount: number) {
    if (amount < 0) {
      throw new BufferInvalidByteCountError()
    }

    this.typedArray = this.typedArray.slice(amount, this.byteCapacity)
    this.refresh()
  }

  /**
   * Removes n items from the right of the buffer.
   *
   * ```js
   * const buffer = new MonchBuffer([ 0x01, 0x02, 0x03, 0x04 ])
   * buffer.truncateRight(2)
   * console.log(buffer) // [ 0x01, 0x02 ]
   * ```
   *
   * @param amount The amount of items to remove
   */
  public truncateRight(amount: number) {
    if (amount < 0) {
      throw new BufferInvalidByteCountError()
    }

    this.typedArray = this.typedArray.slice(0x00, this.byteCapacity - amount)
    this.refresh()
  }

  /**
   * Writes bytes to the buffer at the specified offset without modifying the internal position.
   *
   * @param offset An offset
   * @param data   The bytes to write
   */
  public writeBytes(offset: number, data: Uint8Array) {
    if (offset + data.length > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }

    // TODO: could a for loop speed this up?
    this.typedArray.set(data, offset)
  }

  /**
   * Writes bytes to the buffer at the current offset and moves the current position forward the amount of bytes written.
   *
   * @param data The bytes to write
   */
  public writeBytesNext(data: Uint8Array) {
    this.writeBytes(this.byteOffset, data)
    this.seekByte(data.length, true)
  }

  /**
   * Writes a byte to the buffer at the specified offset without modifying the internal position.
   *
   * @param offset An offset
   * @param byte   The byte to write
   */
  public writeByte(offset: number, byte: number) {
    if (offset + 1 > this.byteCapacity) {
      throw new BufferOverwriteError()
    }
    if (offset < 0x00) {
      throw new BufferUnderwriteError()
    }
    this.typedArray[offset] = byte
  }

  /**
   * Writes a byte to the buffer at the current offset and moves the current position forward a byte.
   *
   * @param byte The byte to write
   */
  public writeByteNext(byte: number) {
    this.writeByte(this.byteOffset, byte)
    this.seekByte(1, true)
  }

  /**
   * Increases the buffer's capacity bigger by n bytes. The new spaces are intialized to `0x00`.
   *
   * @param amount The amount to increase the capacity by
   */
  public grow(amount: number) {
    if (amount < 0) {
      throw new BufferInvalidByteCountError()
    }

    this.byteCapacity += amount
    this.bitCapacity += amount * 8

    const temp = new Uint8Array(this.byteCapacity)
    temp.set(this.typedArray)
    this.typedArray = temp
  }

  /**
   * Empties the buffer and resets the read/write offsets to the beginning.
   */
  public reset() {
    this.typedArray = new Uint8Array()
    this.byteOffset = 0x00
    this.byteCapacity = 0
    this.bitOffset = 0x00
    this.bitCapacity = 0
  }

  /**
   * Moves the bit offset to the the byte offset.
   */
  public alignBit() {
    this.bitOffset = this.byteOffset * 8
  }

  /**
   * Moves the byte offset to the the bit offset, truncating the position if it isn't a whole number.
   */
  public alignByte() {
    // The ~~ truncates the number to be whole
    this.byteOffset = ~~(this.bitOffset / 8)
  }

  /**
   * @ignore
   * Forcefully updates the cached internal statistics of the buffer.
   */
  public refresh() {
    this.byteCapacity = this.typedArray.length
    this.bitCapacity = this.typedArray.length * 8
  }

  /**
   * Returns the buffer converted to an array.
   */
  public toArray() {
    return Array.from(this.typedArray)
  }

  /**
   * Returns a copy of the buffer's internal `Uint8Array`.
   */
  public toUint8Array() {
    return this.typedArray.slice()
  }
}
