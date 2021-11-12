import { After, AfterAll, Before, BeforeAll, setWorldConstructor, World as CucumberWorld } from '@cucumber/cucumber'
import { spawn } from 'child_process'
import { unlinkSync } from 'fs'

import ws from 'ws'
import wrtc from 'wrtc'

import { Player } from './types'

;(global as any).WebSocket = ws
;(global as any).RTCPeerConnection = wrtc.RTCPeerConnection

process.env.NODE_ENV = 'test'

export class World extends CucumberWorld {
  public scenarioRunning: boolean = false

  public signalingURL?: string
  public backend?: {process: ReturnType<typeof spawn>, wait: Promise<void>}

  public players: Map<string, Player> = new Map<string, Player>()

  public print (message: string): void {
    if (this.scenarioRunning) {
      this.log(message) as any
      // console.log(message)
    } else {
      // console.log(message)
    }
  }
}
setWorldConstructor(World)

BeforeAll((cb: Function) => {
  const proc = spawn('go', ['build', '-o', '/tmp/netlib-cucumber-signaling', 'cmd/signaling/main.go'], {
    windowsHide: true,
    stdio: 'pipe'
  })
  proc.on('close', () => {
    if (proc.exitCode !== 0) {
      console.log('failed to compile signaling')
      process.exit(1)
    }
    cb()
  })
})

AfterAll(function (this: World) {
  unlinkSync('/tmp/netlib-cucumber-signaling')
})

Before(function (this: World) {
  this.scenarioRunning = true
})
After(function (this: World) {
  this.scenarioRunning = false
})
