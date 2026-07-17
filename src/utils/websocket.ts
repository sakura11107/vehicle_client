import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import type { MessageResponse } from '../types/message'

let stompClient: Client | null = null
let onMessageCallback: ((msg: MessageResponse) => void) | null = null

export function connectWebSocket(token: string, onMessage: (msg: MessageResponse) => void) {
  if (stompClient?.active) return

  onMessageCallback = onMessage

  stompClient = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: () => {},
    onConnect: () => {
      stompClient?.subscribe('/user/queue/messages', (message) => {
        const msg: MessageResponse = JSON.parse(message.body)
        onMessageCallback?.(msg)
      })
    },
    onStompError: (frame) => {
      console.error('[STOMP] Error:', frame.headers['message'], frame.body)
    },
    onWebSocketError: (event) => {
      console.error('[STOMP] WebSocket error:', event)
    },
  })

  stompClient.activate()
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
  onMessageCallback = null
}
