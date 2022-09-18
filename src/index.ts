import path from "path";

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { dataSource } from "./data-source";

import videoRouter from "./routers/videoRouter";
import { __prod__ } from "./utils/constants";


const app = express();

const main = async () => {

  // __________________________________________   ______________Variables_______________________________________________
  const PORT = process.env.PORT || 4000;

  // ________________________________________________________Connect to Database__________________________________________
  dataSource
    .initialize()
    .then(() => {
      console.log("Data Source has been initialized");
    })
    .catch((err) => {
      console.log(`Error during Data Source initialization ${err}`);
    });

  // ________________________________________________________Config Express___________ _______________________________
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: __prod__
        ? process.env.CORS_ORIGIN_PROD || process.env.CORS_ORIGIN_PROD_2
        : process.env.CORS_ORIGIN_DEV,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // ________________________________________________________Router__________________________________________

  app.use("/api/070699/", videoRouter);


  app.get("/api/0706699/", async (_req: Request, res: Response) => {
    res.send("<h1>Index Page</h1>");
  });

  // ________________________________________________________Run Server_______________________________________________

  app.listen(PORT, () => {
    console.log(`Server started at PORT ${PORT}`);
  });
};

main().catch((error) => {
  console.log(`Server Starting Error: ${error}`);
});

