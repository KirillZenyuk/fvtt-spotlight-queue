import { MODULE_ID, QUEUE_ACTIONS, QUEUE_SETTING_KEY, REQUEST_TYPES } from './constants.js'

export function registerQueueSettings() {
  game.settings.register(MODULE_ID, QUEUE_SETTING_KEY, {
    name: 'Spotlight Queue',
    hint: 'Stores the current spotlight queue entries.',
    scope: 'world',
    config: false,
    type: Object,
    default: {
      entries: [],
    },
    onChange: queue => {
      Hooks.callAll(`${MODULE_ID}.queueChanged`, normalizeQueue(queue))
    },
  })
}

export function getQueue() {
  return normalizeQueue(game.settings.get(MODULE_ID, QUEUE_SETTING_KEY))
}

export async function setQueue(queue) {
  return game.settings.set(MODULE_ID, QUEUE_SETTING_KEY, normalizeQueue(queue))
}

export async function applyQueueAction(action) {
  const queue = getQueue()

  switch (action.type) {
    case QUEUE_ACTIONS.UPSERT:
      return setQueue(upsertEntry(queue, action.entry))
    case QUEUE_ACTIONS.REMOVE:
      return setQueue(removeEntry(queue, action.entryId))
    case QUEUE_ACTIONS.MOVE:
      return setQueue(moveEntry(queue, action.entryId, action.direction))
    case QUEUE_ACTIONS.CLEAR:
      return setQueue({ entries: [] })
    default:
      throw new Error(`Unknown spotlight queue action: ${action.type}`)
  }
}

export function createUpsertAction({ type, urgent = false } = {}) {
  if (!isRequestType(type)) {
    throw new Error(`Unknown spotlight request type: ${type}`)
  }

  const now = Date.now()
  const user = game.user
  const actor = getCurrentActor()

  return {
    type: QUEUE_ACTIONS.UPSERT,
    entry: {
      id: user.id,
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      actorImg: actor?.img ?? null,
      requestType: type,
      urgent: Boolean(urgent),
      createdAt: now,
      updatedAt: now,
    },
  }
}

export function createRemoveAction(entryId = game.user.id) {
  return {
    type: QUEUE_ACTIONS.REMOVE,
    entryId,
  }
}

export function createMoveAction(entryId, direction) {
  return {
    type: QUEUE_ACTIONS.MOVE,
    entryId,
    direction,
  }
}

export function createClearAction() {
  return {
    type: QUEUE_ACTIONS.CLEAR,
  }
}

function upsertEntry(queue, nextEntry) {
  const entries = [...queue.entries]
  const index = entries.findIndex(entry => entry.id === nextEntry.id)

  if (index === -1) {
    return {
      entries: [...entries, nextEntry],
    }
  }

  const previousEntry = entries[index]
  entries[index] = {
    ...previousEntry,
    ...nextEntry,
    createdAt: previousEntry.createdAt,
    updatedAt: Date.now(),
  }

  return { entries }
}

function removeEntry(queue, entryId) {
  return {
    entries: queue.entries.filter(entry => entry.id !== entryId),
  }
}

function moveEntry(queue, entryId, direction) {
  if (!['up', 'down'].includes(direction)) {
    return queue
  }

  const entries = [...queue.entries]
  const index = entries.findIndex(entry => entry.id === entryId)

  if (index === -1) {
    return queue
  }

  const offset = direction === 'up' ? -1 : 1
  const nextIndex = index + offset

  if (nextIndex < 0 || nextIndex >= entries.length) {
    return queue
  }

  const [entry] = entries.splice(index, 1)
  entries.splice(nextIndex, 0, entry)

  return { entries }
}

function normalizeQueue(queue) {
  if (!queue || !Array.isArray(queue.entries)) {
    return { entries: [] }
  }

  return {
    entries: queue.entries.filter(Boolean),
  }
}

function getCurrentActor() {
  return game.user.character ?? globalThis.canvas?.tokens?.controlled?.[0]?.actor ?? null
}

function isRequestType(type) {
  return Object.values(REQUEST_TYPES).includes(type)
}
