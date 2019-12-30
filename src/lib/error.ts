import { CustomError } from 'ts-custom-error'

/**
 * Represents an instance in which a read attempted to read past the buffer itself.
 */
export class BufferOverreadError extends CustomError {
  constructor() {
    super('Read exceeds buffer capacity')
  }
}

/**
 * Represents an instance in which a read attempted to read before the buffer itself.
 */
export class BufferUnderreadError extends CustomError {
  constructor() {
    super('Read offset is less than zero')
  }
}

/**
 * Represents an instance in which a write attempted to write past the buffer itself.
 */
export class BufferOverwriteError extends CustomError {
  constructor() {
    super('Write exceeds buffer capacity')
  }
}

/**
 * Represents an instance in which a write attempted to write before the buffer itself.
 */
export class BufferUnderwriteError extends CustomError {
  constructor() {
    super('Write offset is less than zero')
  }
}

/**
 * Represents an instance in which an invalid byte count was passed to one of the buffer's methods.
 */
export class BufferInvalidByteCountError extends CustomError {
  constructor() {
    super('Invalid byte count requested')
  }
}