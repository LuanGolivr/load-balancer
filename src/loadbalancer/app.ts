import express, { Application, Request, Response } from "express";
import dotenv from 'dotenv';
import { LoadBalancer } from "./LoadBalancer";
import { ILoadBalancingStrategy } from "../interfaces/lb-stratgy.interface";
import { RoundRobinStrategy } from "./strategies/RoundRobinStrategy";

dotenv.config();

class LoadBalancerApp{
    private readonly app: Application;
    private readonly port: number;
    private readonly serverUrls: string[];
    private loadBalancer: LoadBalancer;
    private loadBalancerStratergy: ILoadBalancingStrategy;


    constructor(serverUrls: string[]){
        this.app = express();
        this.port = parseInt(process.env.LB_PORT || "8080");
        this.serverUrls = serverUrls;
        this.loadBalancerStratergy = new RoundRobinStrategy(this.serverUrls);
        this.loadBalancer = new LoadBalancer(this.loadBalancerStratergy);
        this.init();
    }

    private init(){
        this.initMiddlewares();
        this.initRoutes();

    };

    private initMiddlewares(){
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
    }

    private initRoutes(){
        this.app.use("/", (req: Request, res: Response) => {
            this.loadBalancer.distribute(req, res);
        });
    }

    public listen(){
        this.app.listen(this.port, ()=>{
            console.log(`Load Balancer is running on http://localhost:${this.port}`);
        });
    }
}


const serverUrls: string[] = [
    'http://backend1:3000',
    'http://backend2:3000',
    'http://backend3:3000',
];

const loadBalancerApp = new LoadBalancerApp(serverUrls);
loadBalancerApp.listen();

