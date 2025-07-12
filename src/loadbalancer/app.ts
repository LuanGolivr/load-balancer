import express, { Application, Request, Response } from "express";
import dotenv from 'dotenv';
import { LoadBalancer } from "./LoadBalancer";
import { ILoadBalancingStrategy } from "../interfaces/lb-stratgy.interface";
import { RoundRobinStrategy } from "./strategies/RoundRobinStrategy";
import { IPHashStrategy } from "./strategies/IPHashStrategy";
import { LeastConnectionStrategy } from "./strategies/LeastConnectionStrategy";
import { LeastResponseTimeStrategy } from "./strategies/LeastResponseTimeStrategy";
import { ResourceBasedStrategy } from "./strategies/ResourceBasedStrategy";
import { WeightedRoundRobinStrategy } from "./strategies/WeigthedRoundRobinStrategy";

dotenv.config();

class LoadBalancerApp{
    private readonly app: Application;
    private readonly port: number;
    private readonly serverUrls: string[];
    private loadBalancer: LoadBalancer;
    private loadBalancerStratergy: ILoadBalancingStrategy;


    constructor(serverUrls: string[], strategyChoice: number, weights?: number[]){
        this.app = express();
        this.port = parseInt(process.env.LB_PORT || "8080");
        this.serverUrls = serverUrls;
        this.loadBalancerStratergy = this.choseStrategy(strategyChoice, weights);
        this.loadBalancer = new LoadBalancer(this.loadBalancerStratergy, serverUrls, weights);
        this.init();
    }

    private choseStrategy(strategyCode: number, weights?: number[]): ILoadBalancingStrategy{
        let strategy: ILoadBalancingStrategy;
        switch (strategyCode) {
            case 1:
                strategy = new RoundRobinStrategy();
                break;
            
            case 2:
                strategy = new WeightedRoundRobinStrategy();
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
            console.log(`Servers URLs: ${this.serverUrls.join(', ')}`);
        });
    }
}


const serverUrls: string[] = [
    'http://backend1:3000',
    'http://backend2:3000',
    'http://backend3:3000',
];

const args = process.argv.slice(2);
const strategyChoice = parseInt(process.env.STRATEGY_CHOICE || "1"); 
const weightsString = process.env.WEIGHTS;
let weights: number[] | undefined;

console.log("DEBUG args 0: ", strategyChoice);

if(weightsString){
    weights = weightsString.split(',').map(weight => parseInt(weight.trim())).filter(weight => !isNaN(weight));
    if(weights.length !== serverUrls.length){
        console.warn(`Provided weights count (${weights.length}) does not match server count (${serverUrls.length}).Using  default weights.`);
        weights = undefined;
    }
}


const loadBalancerApp = new LoadBalancerApp(serverUrls, 4, weights);
loadBalancerApp.listen();

