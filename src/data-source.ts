import { DataSource } from "typeorm";
import { Admin } from "./entities/Admin";
import { Suggest } from "./entities/Suggest";
import { Topic } from "./entities/Topic";
import { Video } from "./entities/Video";
import { __prod__ } from "./utils/constants";





export const dataSource = new DataSource({

  host: __prod__ ? process.env.HOST_DEV : process.env.HOST_PROD,
  type: "postgres",
  port: 5432,
  ...(__prod__
    ? {
        username: process.env.PG_USERNAME_PROD,
        password: 'Loc@754825',
        database: 'noname',
        
      }
    : {
        username: process.env.PG_USERNAME_DEV,
        password: process.env.PG_PASSWORD_DEV,
        database: process.env.PG_DATABASE_DEV,
      }),   
  ...(__prod__
    ? {
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
        ssl: true,
      }   
    : {}),
  ...(__prod__ ? { migrationsRun: true } : { synchronize:true }),
 
  entities: [Admin,Video,Topic,Suggest],
  migrations: [__dirname + "/migrations/*{.js,.ts}"],
});
