// src/middlewares/logger.js
import { createLogger,transports,format } from "winston";

export const loggerMonitor = createLogger({
  transports:[
    new transports.File({
      filename: 'logs/app.log',
      level:'info',
      format:format.combine(format.timestamp(),format.json())
    }),
    new transports.File({
      filename:'logs/error.log',
      level:'error',
      format:format.combine(format.timestamp(),format.json())
    })
  ]
})

