// import { Injectable, NestMiddleware } from '@nestjs/common';
// import { NextFunction, Request, Response } from 'express';
// import { EventData } from 'express-sse-middleware/dist/EventBuilder';
// import { MsgData } from 'src/services/sse/msg-data';
// import { SseService } from 'src/services/sse/sse.service';

// @Injectable()
// export class SseMiddleware implements NestMiddleware {
//   idCounter = 0;
//   clientId = 0;
//   clients = new Map<number, any>();

//   constructor(readonly sseService: SseService) {
//     sseService.sseMsg$.subscribe((data: MsgData) => {
//       [...this.clients.values()].forEach((sse) => {
//         this.idCounter += 1;
//         const eventData: EventData<MsgData> = {
//           id: String(this.idCounter),
//           data: data,
//         };
//         sse.send(eventData); // <- Push EventData with typed payload
//       });
//     });
//   }

//   use(req: Request, res: Response, next: NextFunction) {
//     console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
//     const sse = res.sse();
//     this.clientId = Date.now();
//     const clientId = this.clientId;
//     this.clients.set(clientId, sse);
//     req.on('close', () => {
//       sse.close();
//       this.clients.delete(clientId);
//     });
//     console.log(
//       `sse middleware, counter: ${this.idCounter}, clientId: ${this.clientId}`,
//     );
//     // next();
//   }
// }
