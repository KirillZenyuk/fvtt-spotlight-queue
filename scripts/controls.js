import { CONTROLS_POSITION_SETTING_KEY, MODULE_ID, REQUEST_TYPES } from './constants.js'
import { enablePersistentDrag } from './drag.js'
import { getQueue } from './queue.js'

const CONTROL_ID = `${MODULE_ID}-controls`
const URGENT_BUTTON_SELECTOR = '[data-spotlight-urgent]'

let pendingUrgent = false

const REQUEST_CONTROLS = [
  {
    type: REQUEST_TYPES.SPEAK,
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeSpeak',
    icon: 'fas fa-comment',
  },
  {
    type: REQUEST_TYPES.ACT,
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeAct',
    icon: 'fas fa-bolt',
  },
  {
    type: REQUEST_TYPES.REACT,
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeReact',
    icon: 'fas fa-reply',
  },
  {
    type: REQUEST_TYPES.QUESTION,
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeQuestion',
    icon: 'fas fa-question-circle',
  },
]

export function renderSpotlightControls() {
  if (game.user.isGM) {
    return
  }

  const controls = getOrCreateControls()
  enablePersistentDrag({
    element: controls,
    handle: controls.querySelector('[data-spotlight-drag-handle]'),
    settingKey: CONTROLS_POSITION_SETTING_KEY,
  })
  updateControls(controls)

  Hooks.on(`${MODULE_ID}.queueChanged`, () => updateControls(controls))
  Hooks.on('userConnected', () => updateControls(controls))
  Hooks.once('canvasReady', () => updateControls(controls))
}

function getOrCreateControls() {
  const existingControls = document.getElementById(CONTROL_ID)

  if (existingControls) {
    return existingControls
  }

  const controls = document.createElement('nav')
  controls.id = CONTROL_ID
  controls.className = 'spotlight-queue-controls'
  controls.setAttribute('aria-label', localize('FVTT_SPOTLIGHT_QUEUE.ControlsLabel'))

  controls.append(createDragHandle())

  const requestGroup = document.createElement('div')
  requestGroup.className = 'spotlight-queue-controls__group'

  for (const requestControl of REQUEST_CONTROLS) {
    requestGroup.append(createRequestButton(requestControl))
  }

  controls.append(requestGroup)
  controls.append(createUrgentButton())
  document.body.append(controls)

  return controls
}

function createDragHandle() {
  const handle = document.createElement('span')
  handle.className = 'spotlight-queue-controls__drag'
  handle.dataset.spotlightDragHandle = 'true'
  handle.setAttribute('aria-hidden', 'true')

  const icon = document.createElement('i')
  icon.className = 'fas fa-grip-lines-vertical'
  icon.setAttribute('aria-hidden', 'true')

  handle.append(icon)

  return handle
}

function createRequestButton({ type, labelKey, icon }) {
  const label = localize(labelKey)
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `spotlight-queue-control-button is-${type}`
  button.dataset.spotlightRequestType = type
  setTooltip(button, label)
  button.setAttribute('aria-label', label)

  const iconElement = document.createElement('i')
  iconElement.className = icon
  iconElement.setAttribute('aria-hidden', 'true')

  button.append(iconElement)
  button.addEventListener('click', () => onRequestButtonClick(type))

  return button
}

function createUrgentButton() {
  const label = localize('FVTT_SPOTLIGHT_QUEUE.Urgent')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'spotlight-queue-control-button spotlight-queue-control-button--urgent'
  button.dataset.spotlightUrgent = 'true'
  setTooltip(button, label)
  button.setAttribute('aria-label', label)
  button.setAttribute('aria-pressed', 'false')

  const iconElement = document.createElement('i')
  iconElement.className = 'fas fa-exclamation-triangle'
  iconElement.setAttribute('aria-hidden', 'true')

  button.append(iconElement)
  button.addEventListener('click', onUrgentButtonClick)

  return button
}

async function onRequestButtonClick(type) {
  const currentEntry = getCurrentUserEntry()
  const api = getApi()

  if (currentEntry?.requestType === type) {
    pendingUrgent = false
    await api.removeRequest()
    updateControls()
    return
  }

  await api.requestSpotlight({
    type,
    urgent: currentEntry?.urgent ?? pendingUrgent,
  })

  pendingUrgent = false
  updateControls()
}

async function onUrgentButtonClick() {
  const currentEntry = getCurrentUserEntry()

  if (!currentEntry) {
    pendingUrgent = !pendingUrgent
    updateControls()
    return
  }

  await getApi().requestSpotlight({
    type: currentEntry.requestType,
    urgent: !currentEntry.urgent,
  })

  updateControls()
}

function updateControls(controls = document.getElementById(CONTROL_ID)) {
  if (!controls) {
    return
  }

  const currentEntry = getCurrentUserEntry()
  const canSubmitRequest = hasActiveGM()

  for (const button of controls.querySelectorAll('[data-spotlight-request-type]')) {
    const isActive = button.dataset.spotlightRequestType === currentEntry?.requestType
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
    button.disabled = !canSubmitRequest
    setTooltip(button, getRequestButtonTitle(button.dataset.spotlightRequestType, isActive, canSubmitRequest))
  }

  const urgentButton = controls.querySelector(URGENT_BUTTON_SELECTOR)

  if (!urgentButton) {
    return
  }

  const isUrgent = Boolean(currentEntry?.urgent ?? pendingUrgent)
  urgentButton.classList.toggle('is-active', isUrgent)
  urgentButton.setAttribute('aria-pressed', String(isUrgent))
  urgentButton.disabled = !canSubmitRequest
  setTooltip(urgentButton, canSubmitRequest
    ? localize('FVTT_SPOTLIGHT_QUEUE.Urgent')
    : localize('FVTT_SPOTLIGHT_QUEUE.NoActiveGM'))
}

function getRequestButtonTitle(type, isActive, canSubmitRequest) {
  if (!canSubmitRequest) {
    return localize('FVTT_SPOTLIGHT_QUEUE.NoActiveGM')
  }

  const requestControl = REQUEST_CONTROLS.find(control => control.type === type)
  const label = localize(requestControl.labelKey)

  if (!isActive) {
    return label
  }

  return `${label} - ${localize('FVTT_SPOTLIGHT_QUEUE.CancelRequest')}`
}

function getCurrentUserEntry() {
  return getQueue().entries.find(entry => entry.userId === game.user.id) ?? null
}

function getApi() {
  return game.modules.get(MODULE_ID).api
}

function localize(key) {
  return game.i18n.localize(key)
}

function hasActiveGM() {
  return Boolean(game.users.activeGM)
}

function setTooltip(element, text) {
  element.dataset.tooltip = text
  element.dataset.tooltipDirection = 'UP'
}
