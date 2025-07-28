import express, { Application, Response, Request } from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from "helmet";
import os from 'os';
import ErrorHandler from "../helpers/error-handler";

dotenv.config({
    path: '../../.env'
});

class App {
    private readonly app: Application;
    private port: number;
    private readonly INSTANCE_ID: string;

    constructor(){
        this.app = express();
        this.port = parseInt(process.env.PORT || "3000");
        this.INSTANCE_ID = process.env.INSTANCE_ID || os.hostname();
        this.init();
    }

    private init(){
        this.initMiddlewares();
        this.initRoutes();
        this.initErrorHandling();
    }

    private initMiddlewares(){
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
    }

    private initRoutes(){
        this.app.use("/api/v1/", (req: Request, res: Response)=>{
            req.headers["cache-control"] = "no-cache";
            res.status(200).json({message: `server instance ${this.INSTANCE_ID} listening on port ${this.port}`});
        });
    }

    private initErrorHandling(){
        this.app.use(ErrorHandler.notFound);
        this.app.use(ErrorHandler.serverError);
    }

    public listen(){
        this.app.listen(this.port, ()=>{
            console.log(`Server is running on http://localhost:${this.port}/api/v1`);
        });
    }
};

export default App;