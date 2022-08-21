import { AuctionStatus } from 'src/common/enums';
import { Auction } from 'src/domain/auctions/auction.entity';

import {
  EntitySubscriberInterface,
  EventSubscriber,
  Repository,
  UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class AuctionSubscriber implements EntitySubscriberInterface<Auction> {
  listenTo() {
    return Auction;
  }

  async afterUpdate(event: UpdateEvent<Auction>) {
    // ref) https://stackoverflow.com/questions/62887344/queries-in-afterupdate-are-not-working-as-expected-in-typeorm
    await event.queryRunner.commitTransaction();
    await event.queryRunner.startTransaction();

    const auctionsRepository: Repository<Auction> =
      event.connection.manager.getRepository<Auction>('auction');
    if (event.entity.id) {
      const auction = await auctionsRepository.findOne({
        where: { id: event.entity.id },
        relations: ['packs'],
      });
      if (auction.status === AuctionStatus.ENDED) {
        auction.packs.map(async (pack: any) => {
          const selectQuery =
            'SELECT COUNT(*) AS total FROM pack \
    INNER JOIN pack_auction ON pack.id = pack_auction.packId \
    INNER JOIN auction ON auction.id = pack_auction.auctionId \
    WHERE pack.id = ? AND auction.status = "ENDED"';
          const [row] = await event.connection.manager.query(selectQuery, [
            pack.id,
          ]);
          const updateQuery = 'UPDATE pack SET closed = ? WHERE id = ?';
          await event.connection.manager.query(updateQuery, [
            +row.total,
            pack.id,
          ]);
        });
      }
    }
  }
}
