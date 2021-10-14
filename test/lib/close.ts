import type { Server } from 'node:http'

export function close(server?: Server): Promise<void> {
  if (server != null) {
    return new Promise((resolve, reject) => {
      server.close((error) => {
        if (error != null) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  return Promise.resolve()
}
