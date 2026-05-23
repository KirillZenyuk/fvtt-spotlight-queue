import { log } from './logger.js'
import { renderSpotlightControls } from './controls.js'
import { renderSpotlightQueuePanel } from './queue-panel.js'
import { registerQueueSettings } from './queue.js'
import { registerUiSettings } from './settings.js'
import { exposeQueueApi, registerQueueSocket } from './socket.js'

Hooks.once('init', () => {
  log('Initializing')

  registerQueueSettings()
  registerUiSettings()
})

Hooks.once('ready', () => {
  log('Ready')

  registerQueueSocket()
  exposeQueueApi()
  renderSpotlightControls()
  renderSpotlightQueuePanel()
})
