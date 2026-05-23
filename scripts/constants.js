export const MODULE_ID = 'fvtt-spotlight-queue'
export const SOCKET_NAME = `module.${MODULE_ID}`
export const QUEUE_SETTING_KEY = 'queue'
export const QUEUE_PANEL_POSITION_SETTING_KEY = 'queuePanelPosition'
export const CONTROLS_POSITION_SETTING_KEY = 'controlsPosition'

export const REQUEST_TYPES = Object.freeze({
  SPEAK: 'speak',
  ACT: 'act',
  REACT: 'react',
  QUESTION: 'question',
})

export const QUEUE_ACTIONS = Object.freeze({
  UPSERT: 'upsert',
  REMOVE: 'remove',
  MOVE: 'move',
  CLEAR: 'clear',
})
