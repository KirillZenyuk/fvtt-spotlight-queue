import { MODULE_ID, REQUEST_TYPES, SOCKET_NAME } from './constants.js'
import {
  applyQueueAction,
  createClearAction,
  createMoveAction,
  createRemoveAction,
  createUpsertAction,
  getQueue,
} from './queue.js'

export function registerQueueSocket() {
  game.socket.on(SOCKET_NAME, async action => {
    if (!isPrimaryGM()) {
      return
    }

    await applyQueueAction(action)
  })
}

export function exposeQueueApi() {
  game.modules.get(MODULE_ID).api = {
    REQUEST_TYPES,
    getQueue,
    requestSpotlight: ({ type, urgent = false } = {}) => dispatchQueueAction(createUpsertAction({ type, urgent })),
    removeRequest: entryId => dispatchQueueAction(createRemoveAction(entryId)),
    moveRequest: (entryId, direction) => dispatchQueueAction(createMoveAction(entryId, direction)),
    clearQueue: () => dispatchQueueAction(createClearAction()),
  }
}

async function dispatchQueueAction(action) {
  if (isPrimaryGM()) {
    return applyQueueAction(action)
  }

  if (!game.users.activeGM) {
    return false
  }

  game.socket.emit(SOCKET_NAME, action)
  return true
}

function isPrimaryGM() {
  return Boolean(game.user.isActiveGM)
}
