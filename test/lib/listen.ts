import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

export function listen(server: Server, hostname = 'localhost'): Promise<URL> {
  return new Promise((resolve, reject) => {
    server.on('error', reject)

    server.listen(() => {
      const url = new URL('http://' + hostname)
      url.port = String((server.address() as AddressInfo).port)
      resolve(url)
    })
  })
}
