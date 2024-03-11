import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FriendAttachedEvent } from 'src/domain/users/events/friend-attached.event';

@Injectable()
export class UsersFriendshipListener {
  @OnEvent('friend.attached')
  handleOrderCreatedEvent(event: FriendAttachedEvent) {
    // handle and process "OrderCreatedEvent" event
    console.log(event);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ');
    console.log(event.token);
    console.log(event.options);
    console.log(event.notification);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ');
  }
}
