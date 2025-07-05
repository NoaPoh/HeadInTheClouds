import dotenv from 'dotenv';
import serverPromise from './server';
import { ServerInfo } from './types/types';
dotenv.config();

serverPromise.then(({ server, port, link }: ServerInfo) => {
  server.listen(port, () => {
    console.log(`Server is running on ${link}/api`);
    console.log(`Client is running on ${link}`);
  });
});
