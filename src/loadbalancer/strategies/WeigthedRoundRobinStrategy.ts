import { Request } from "express";
import { ILoadBalancingStrategy } from "../../interfaces/lb-stratgy.interface";
import { Server } from '../../interfaces/server.interface';


export class WeightedRoundRobinStrategy implements ILoadBalancingStrategy{
    private cumulativeWeight: number[] = [];
    private totalWeight: number = 0;
    private currentIndex: number = 0;


    constructor(){
        //this.weightsList = weights;
        //this.totalWeight = this.calculateTotalWeight();
        //this.cumulativeWeight = this.calculateCumulativeWeights();
        console.log('Round Robin Load Balancer initialized.');
    }

    private getHealthyServers(servers: Server[]): Server[]{
        return servers.filter(server => server.isHealthy);
    }

    private calculateTotalWeight(servers: Server[]):number{
        let totalWeight = 0;
        for(let i = 0; i < servers.length; i++){
            totalWeight += servers[i].weight;
            this.cumulativeWeight[i] = totalWeight; 
        }
        return totalWeight;
    }

    private getCumulativeWeightsArray(servers: Server[]): number[]{
        const cumulativeWeights: number[] = new Array(servers.length).fill(0);
        return cumulativeWeights;
    }

    selectServer(req: Request, servers: Server[]): Server | null {
        let server = null;
        const healthyServers = this.getHealthyServers(servers);

        if(healthyServers.length > 0){
            this.cumulativeWeight = this.getCumulativeWeightsArray(healthyServers);
            this.totalWeight = this.calculateTotalWeight(healthyServers);
            const randomValue = Math.floor(Math.random() * this.totalWeight);

            let i = 0;
            let found = false;
            while(i < healthyServers.length && !found){
                if(randomValue < this.cumulativeWeight[i]){
                    found = true;
                    server = servers[i];
                }
                i++;
            }

            if(!server){
                console.warn("Total weight is zero for healthy servers. Falling back to first healthy server");
                server = healthyServers[0];
            }else{
                console.log(`Selected server (Weighted Round Robin): ${server.url} (Random Value: ${randomValue}, Total Weight: ${this.totalWeight})`);
            }
        }else{
            console.error('No healthy servers available for Weighted Round Robin strategy.');
        }
    
        return server;
    }
}