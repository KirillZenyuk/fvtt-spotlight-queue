import { MODULE_ID, QUEUE_PANEL_POSITION_SETTING_KEY, REQUEST_TYPES } from './constants.js'
import { enablePersistentDrag } from './drag.js'
import { getQueue } from './queue.js'

const PANEL_ID = `${MODULE_ID}-panel`
const RESOLVE_ANIMATION_MS = 160

const REQUEST_META = {
  [REQUEST_TYPES.SPEAK]: {
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeSpeak',
    icon: 'fas fa-comment',
    accent: 'speak',
  },
  [REQUEST_TYPES.ACT]: {
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeAct',
    icon: 'fas fa-bolt',
    accent: 'act',
  },
  [REQUEST_TYPES.REACT]: {
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeReact',
    icon: 'fas fa-reply',
    accent: 'react',
  },
  [REQUEST_TYPES.QUESTION]: {
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.RequestTypeQuestion',
    icon: 'fas fa-question-circle',
    accent: 'question',
  },
}

export function renderSpotlightQueuePanel() {
  const panel = getOrCreatePanel()
  enablePersistentDrag({
    element: panel,
    handle: panel.querySelector('.spotlight-queue-panel__header'),
    settingKey: QUEUE_PANEL_POSITION_SETTING_KEY,
  })
  updateQueuePanel(panel)

  Hooks.on(`${MODULE_ID}.queueChanged`, () => updateQueuePanel(panel))
}

function getOrCreatePanel() {
  const existingPanel = document.getElementById(PANEL_ID)

  if (existingPanel) {
    return existingPanel
  }

  const panel = document.createElement('aside')
  panel.id = PANEL_ID
  panel.className = 'spotlight-queue-panel'
  panel.setAttribute('aria-label', localize('FVTT_SPOTLIGHT_QUEUE.QueueTitle'))

  const header = document.createElement('header')
  header.className = 'spotlight-queue-panel__header'

  const title = document.createElement('h2')
  title.className = 'spotlight-queue-panel__title'
  title.textContent = localize('FVTT_SPOTLIGHT_QUEUE.QueueTitle')

  header.append(title)

  if (game.user.isGM) {
    header.append(createHeaderActions())
  }

  const list = document.createElement('ol')
  list.className = 'spotlight-queue-panel__list'
  list.dataset.spotlightQueueList = 'true'

  panel.append(header, list)
  document.body.append(panel)

  return panel
}

function updateQueuePanel(panel = document.getElementById(PANEL_ID)) {
  if (!panel) {
    return
  }

  const queue = getQueue()
  const clearButton = panel.querySelector('[data-spotlight-clear-queue]')
  const list = panel.querySelector('[data-spotlight-queue-list]')

  if (!list) {
    return
  }

  panel.classList.toggle('is-empty', queue.entries.length === 0)

  if (clearButton) {
    clearButton.disabled = queue.entries.length === 0
  }

  const previousRects = getEntryRects(list)
  list.replaceChildren()

  if (queue.entries.length === 0) {
    list.append(createEmptyState())
    return
  }

  for (const [index, entry] of queue.entries.entries()) {
    list.append(createQueueEntry(entry, index, queue.entries.length))
  }

  animateEntryMoves(list, previousRects)
}

function createQueueEntry(entry, index, totalEntries) {
  const meta = getRequestMeta(entry.requestType)
  const item = document.createElement('li')
  item.className = `spotlight-queue-panel__entry is-${meta.accent}`
  item.dataset.spotlightEntryId = entry.id
  item.classList.toggle('is-urgent', Boolean(entry.urgent))

  const portrait = createPortrait(entry)
  const body = document.createElement('div')
  body.className = 'spotlight-queue-panel__entry-body'

  const name = document.createElement('strong')
  name.className = 'spotlight-queue-panel__entry-name'
  name.textContent = getEntryName(entry)

  const request = document.createElement('span')
  request.className = 'spotlight-queue-panel__request'

  const icon = document.createElement('i')
  icon.className = meta.icon
  icon.setAttribute('aria-hidden', 'true')

  const label = document.createElement('span')
  label.textContent = localize(meta.labelKey)

  request.append(icon, label)
  body.append(name, request)

  const metaColumn = document.createElement('div')
  metaColumn.className = 'spotlight-queue-panel__entry-meta'

  if (entry.urgent) {
    metaColumn.append(createUrgentMarker())
  }

  if (game.user.isGM) {
    metaColumn.append(createEntryActions(entry, index, totalEntries))
  }

  item.append(portrait, body, metaColumn)

  return item
}

function createHeaderActions() {
  const actions = document.createElement('div')
  actions.className = 'spotlight-queue-panel__header-actions'

  actions.append(createIconButton({
    className: 'spotlight-queue-panel__button spotlight-queue-panel__button--danger',
    icon: 'fas fa-broom',
    labelKey: 'FVTT_SPOTLIGHT_QUEUE.ClearQueue',
    datasetKey: 'spotlightClearQueue',
    onClick: onClearQueueClick,
  }))

  return actions
}

function onClearQueueClick() {
  if (!window.confirm(localize('FVTT_SPOTLIGHT_QUEUE.ClearQueueConfirm'))) {
    return
  }

  getApi().clearQueue()
}

function createEntryActions(entry, index, totalEntries) {
  const actions = document.createElement('div')
  actions.className = 'spotlight-queue-panel__entry-actions'

  actions.append(
    createIconButton({
      className: 'spotlight-queue-panel__button',
      icon: 'fas fa-arrow-up',
      labelKey: 'FVTT_SPOTLIGHT_QUEUE.MoveUp',
      disabled: index === 0,
      onClick: () => getApi().moveRequest(entry.id, 'up'),
    }),
    createIconButton({
      className: 'spotlight-queue-panel__button',
      icon: 'fas fa-arrow-down',
      labelKey: 'FVTT_SPOTLIGHT_QUEUE.MoveDown',
      disabled: index === totalEntries - 1,
      onClick: () => getApi().moveRequest(entry.id, 'down'),
    }),
    createIconButton({
      className: 'spotlight-queue-panel__button spotlight-queue-panel__button--done',
      icon: 'fas fa-check',
      labelKey: 'FVTT_SPOTLIGHT_QUEUE.ResolveRequest',
      onClick: event => onResolveRequestClick(event, entry.id),
    }),
  )

  return actions
}

function onResolveRequestClick(event, entryId) {
  if (prefersReducedMotion()) {
    getApi().removeRequest(entryId)
    return
  }

  const item = event.currentTarget.closest('.spotlight-queue-panel__entry')

  if (!item) {
    getApi().removeRequest(entryId)
    return
  }

  item.classList.add('is-resolving')

  for (const button of item.querySelectorAll('button')) {
    button.disabled = true
  }

  window.setTimeout(() => getApi().removeRequest(entryId), RESOLVE_ANIMATION_MS)
}

function createIconButton({ className, icon, labelKey, datasetKey, disabled = false, onClick }) {
  const label = localize(labelKey)
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.disabled = disabled
  setTooltip(button, label)
  button.setAttribute('aria-label', label)

  if (datasetKey) {
    button.dataset[datasetKey] = 'true'
  }

  const iconElement = document.createElement('i')
  iconElement.className = icon
  iconElement.setAttribute('aria-hidden', 'true')

  button.append(iconElement)
  button.addEventListener('click', onClick)

  return button
}

function createPortrait(entry) {
  const portrait = document.createElement('div')
  portrait.className = 'spotlight-queue-panel__portrait'

  if (entry.actorImg) {
    const image = document.createElement('img')
    image.src = entry.actorImg
    image.alt = ''
    image.loading = 'lazy'
    portrait.append(image)
    return portrait
  }

  const initials = document.createElement('span')
  initials.textContent = getInitials(getEntryName(entry))
  portrait.append(initials)

  return portrait
}

function createUrgentMarker() {
  const marker = document.createElement('span')
  marker.className = 'spotlight-queue-panel__urgent'
  setTooltip(marker, localize('FVTT_SPOTLIGHT_QUEUE.Urgent'))
  marker.setAttribute('aria-label', localize('FVTT_SPOTLIGHT_QUEUE.Urgent'))

  const icon = document.createElement('i')
  icon.className = 'fas fa-exclamation-triangle'
  icon.setAttribute('aria-hidden', 'true')

  marker.append(icon)

  return marker
}

function createEmptyState() {
  const item = document.createElement('li')
  item.className = 'spotlight-queue-panel__empty'
  item.textContent = localize('FVTT_SPOTLIGHT_QUEUE.NoRequests')

  return item
}

function getEntryRects(list) {
  const rects = new Map()

  for (const entry of list.querySelectorAll('[data-spotlight-entry-id]')) {
    rects.set(entry.dataset.spotlightEntryId, entry.getBoundingClientRect())
  }

  return rects
}

function animateEntryMoves(list, previousRects) {
  if (previousRects.size === 0 || prefersReducedMotion()) {
    return
  }

  window.requestAnimationFrame(() => {
    for (const entry of list.querySelectorAll('[data-spotlight-entry-id]')) {
      const previousRect = previousRects.get(entry.dataset.spotlightEntryId)

      if (!previousRect) {
        entry.classList.add('is-entering')
        window.setTimeout(() => entry.classList.remove('is-entering'), 160)
        continue
      }

      const currentRect = entry.getBoundingClientRect()
      const deltaY = previousRect.top - currentRect.top

      if (deltaY === 0) {
        continue
      }

      entry.animate(
        [
          { transform: `translateY(${deltaY}px)` },
          { transform: 'translateY(0)' },
        ],
        {
          duration: 180,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
        },
      )
    }
  })
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getRequestMeta(type) {
  return REQUEST_META[type] ?? REQUEST_META[REQUEST_TYPES.SPEAK]
}

function getEntryName(entry) {
  return entry.actorName || entry.userName || localize('FVTT_SPOTLIGHT_QUEUE.UnknownUser')
}

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map(word => word[0]).join('')

  return initials.toUpperCase() || '?'
}

function localize(key) {
  return game.i18n.localize(key)
}

function getApi() {
  return game.modules.get(MODULE_ID).api
}

function setTooltip(element, text) {
  element.dataset.tooltip = text
  element.dataset.tooltipDirection = 'UP'
}
