import {
  CONTROLS_POSITION_SETTING_KEY,
  MODULE_ID,
  QUEUE_PANEL_POSITION_SETTING_KEY,
} from './constants.js'

export function registerUiSettings() {
  registerPositionSetting(QUEUE_PANEL_POSITION_SETTING_KEY)
  registerPositionSetting(CONTROLS_POSITION_SETTING_KEY)
}

export function getStoredPosition(settingKey) {
  const value = game.settings.get(MODULE_ID, settingKey)

  if (!Number.isFinite(value?.left) || !Number.isFinite(value?.top)) {
    return null
  }

  return {
    left: value.left,
    top: value.top,
  }
}

export async function setStoredPosition(settingKey, position) {
  return game.settings.set(MODULE_ID, settingKey, {
    left: Math.round(position.left),
    top: Math.round(position.top),
  })
}

export async function resetStoredPosition(settingKey) {
  return game.settings.set(MODULE_ID, settingKey, {})
}

function registerPositionSetting(settingKey) {
  game.settings.register(MODULE_ID, settingKey, {
    name: settingKey,
    scope: 'client',
    config: false,
    type: Object,
    default: {},
    onChange: () => Hooks.callAll(`${MODULE_ID}.uiPositionChanged`, settingKey),
  })
}

