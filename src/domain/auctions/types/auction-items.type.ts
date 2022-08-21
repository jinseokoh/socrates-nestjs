export type AuctionItems = {
  id: number;
  startTime: Date;
  endTime: Date;
  closingTime: Date;
  lastBidderId?: number;
};
