import morgan, { StreamOptions } from 'morgan';
import Logger from '../utils/logger.ts';


const stream: StreamOptions = {
  write: (message) => Logger.http(message.trim()),
};


const skip = (): boolean => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

const morganMiddleware = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default morganMiddleware;
