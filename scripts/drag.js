import { MODULE_ID } from './constants.js'
import { getStoredPosition, resetStoredPosition, setStoredPosition } from './settings.js'

const DRAG_THRESHOLD = 4
const VIEWPORT_MARGIN = 8
const draggableElements = new Map()
let resizeHandlerRegistered = false
let resizeTimeout = null

export function enablePersistentDrag({ element, handle, settingKey }) {
  if (!element || !handle || handle.dataset.dragEnabled === 'true') {
    return
  }

  handle.dataset.dragEnabled = 'true'
  draggableElements.set(settingKey, element)
  registerResizeHandler()
  applyStoredPosition(element, settingKey)

  handle.classList.add('spotlight-queue-drag-handle')
  setTooltip(handle, game.i18n.localize('FVTT_SPOTLIGHT_QUEUE.DragHandleTitle'))
  handle.addEventListener('pointerdown', event => onPointerDown(event, element, settingKey))
  handle.addEventListener('dblclick', event => onDoubleClick(event, element, settingKey))

  Hooks.on(`${MODULE_ID}.uiPositionChanged`, changedSettingKey => {
    if (changedSettingKey === settingKey) {
      applyStoredPosition(element, settingKey)
    }
  })
}

function onPointerDown(event, element, settingKey) {
  if (event.button !== 0 || shouldIgnoreDragTarget(event.target)) {
    return
  }

  const rect = element.getBoundingClientRect()
  const startX = event.clientX
  const startY = event.clientY
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  let isDragging = false
  let latestPosition = {
    left: rect.left,
    top: rect.top,
  }

  function onPointerMove(moveEvent) {
    const deltaX = Math.abs(moveEvent.clientX - startX)
    const deltaY = Math.abs(moveEvent.clientY - startY)

    if (!isDragging && deltaX < DRAG_THRESHOLD && deltaY < DRAG_THRESHOLD) {
      return
    }

    isDragging = true
    element.classList.add('is-dragging')
    latestPosition = clampPosition(element, {
      left: moveEvent.clientX - offsetX,
      top: moveEvent.clientY - offsetY,
    })

    applyAbsolutePosition(element, latestPosition)
    moveEvent.preventDefault()
  }

  async function onPointerUp() {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    element.classList.remove('is-dragging')

    if (isDragging) {
      await setStoredPosition(settingKey, latestPosition)
    }
  }

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp, { once: true })
}

async function onDoubleClick(event, element, settingKey) {
  if (shouldIgnoreDragTarget(event.target)) {
    return
  }

  await resetStoredPosition(settingKey)
  resetElementPosition(element)
}

function applyStoredPosition(element, settingKey) {
  const position = getStoredPosition(settingKey)

  if (!position) {
    resetElementPosition(element)
    return
  }

  applyAbsolutePosition(element, clampPosition(element, position))
}

function applyAbsolutePosition(element, position) {
  element.dataset.customPosition = 'true'
  element.style.left = `${position.left}px`
  element.style.top = `${position.top}px`
  element.style.right = 'auto'
  element.style.bottom = 'auto'
  element.style.transform = 'none'
}

function resetElementPosition(element) {
  delete element.dataset.customPosition
  element.style.left = ''
  element.style.top = ''
  element.style.right = ''
  element.style.bottom = ''
  element.style.transform = ''
}

function clampPosition(element, position) {
  const rect = element.getBoundingClientRect()
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN)
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.height - VIEWPORT_MARGIN)

  return {
    left: Math.min(Math.max(position.left, VIEWPORT_MARGIN), maxLeft),
    top: Math.min(Math.max(position.top, VIEWPORT_MARGIN), maxTop),
  }
}

function registerResizeHandler() {
  if (resizeHandlerRegistered) {
    return
  }

  resizeHandlerRegistered = true
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimeout)
    resizeTimeout = window.setTimeout(() => {
      resizeTimeout = null
      clampStoredPositions()
    }, 120)
  })
}

function clampStoredPositions() {
  for (const [settingKey, element] of draggableElements) {
    applyStoredPosition(element, settingKey)
  }
}

function setTooltip(element, text) {
  element.dataset.tooltip = text
  element.dataset.tooltipDirection = 'UP'
}

function shouldIgnoreDragTarget(target) {
  if (!target.closest) {
    return false
  }

  return Boolean(target.closest('button, a, input, select, textarea'))
}
