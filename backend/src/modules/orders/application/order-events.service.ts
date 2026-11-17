import { Injectable } from '@nestjs/common'
import { interval, merge, map, Observable } from 'rxjs'
import type { MessageEvent } from '@nestjs/common'
import { Subject } from 'rxjs'

@Injectable()
export class OrderEventsService {
  private readonly created = new Subject<void>()

  emitCreated() {
    this.created.next()
  }

  stream(): Observable<MessageEvent> {
    const created = this.created.pipe(map(() => ({ type: 'order-created', data: { changed: true } })))
    const keepAlive = interval(25_000).pipe(map(() => ({ type: 'keep-alive', data: 'connected' })))
    return merge(created, keepAlive)
  }
}
