import express, { Application, Request, Response } from "express";
import dotenv from 'dotenv';
import { LoadBalancer } from "./LoadBalancer";
import { ILoadBalancingStrategy } from "../interfaces/lb-stratgy.interface";
import { RoundRobinStrategy } from "./strategies/RoundRobinStrategy";
import { IPHashStrategy } from "./strategies/IPHashStrategy";
import { LeastConnectionStrategy } from "./strategies/LeastConnectionStrategy";
import { LeastResponseTimeStrategy } from "./strategies/LeastResponseTimeStrategy";
import { ResourceBasedStrategy } from "./strategies/ResourceBasedStrategy";

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
        this.loadBalancerStratergy = this.choseStrategy(0);
        this.loadBalancer = new LoadBalancer(this.loadBalancerStratergy, serverUrls);
        this.init();
    }

    private choseStrategy(strategyCode: number): ILoadBalancingStrategy{
        let strategy: ILoadBalancingStrategy;
        switch (strategyCode) {
            case 1:
                strategy = new RoundRobinStrategy();
                break;
            
            case 2:
                strategy = new RoundRobinStrategy();
                break;

            case 3:
                strategy = new IPHashStrategy();
                break;

            case 4:
                strategy = new LeastConnectionStrategy();
                break;

            case 5:
                strategy = new LeastResponseTimeStrategy();
                break;
            
            case 6:
                strategy = new ResourceBasedStrategy();
                break;
        
            default:
                strategy = new RoundRobinStrategy();
                break;
        }
        return strategy;
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

