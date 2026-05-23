import { MODULE_ID } from './constants.js'

const PREFIX = `%c${MODULE_ID}`
const PREFIX_STYLE = [
  'background: #1f6feb',
  'border-radius: 3px',
  'color: #ffffff',
  'font-weight: 700',
  'padding: 2px 5px',
].join('; ')

export function log(message, ...args) {
  console.log(PREFIX, PREFIX_STYLE, `| ${message}`, ...args)
}

export function warn(message, ...args) {
  console.warn(PREFIX, PREFIX_STYLE, `| ${message}`, ...args)
}

export function error(message, ...args) {
  console.error(PREFIX, PREFIX_STYLE, `| ${message}`, ...args)
}

