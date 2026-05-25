import { Client } from 'discord.js-selfbot-v13'
import { registerMessageCreateEvent } from './message-create.js'
import { registerMessageUpdateEvent } from './message-update.js'
import { registerMessageDeleteEvent } from './message-delete.js'
import { registerVoiceStateUpdateEvent } from './voice-state-update.js'

export function registerAllEvents(client: Client): void {
  registerMessageCreateEvent(client)
  registerMessageUpdateEvent(client)
  registerMessageDeleteEvent(client)
  registerVoiceStateUpdateEvent(client)
}
