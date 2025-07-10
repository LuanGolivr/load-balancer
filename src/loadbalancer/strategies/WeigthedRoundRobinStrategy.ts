import { Request } from "express";
import { ILoadBalancingStrategy } from "../../interfaces/lb-stratgy.interface";
import { Server } from '../../interfaces/server.interface';


export class WeightedRoundRobinStrategy implements ILoadBalancingStrategy{
    private serverList: Server[];
    private weightsList: number[];
    private cumulativeWeight: number[];
    private totalWeight: number;
    private currentIndex: number = 0;


    constructor(serverUrls: string[], weights: number[]){
        this.serverList = serverUrls.map((url, index) => ({
            id: `server-${index + 1}`,
            url: url,
            isHealthy: true
        }));
        this.weightsList = weights;
        this.totalWeight = this.calculateTotalWeight(weights);
        this.cumulativeWeight = this.calculateCumulativeWeights(weights);
    }

    private calculateTotalWeight(weights: number[]):number{
        let totalWeight = 0;
        for(const weight of weights){
            totalWeight += weight;
        }
        return totalWeight;
    }

    private calculateCumulativeWeights(weights: number[]): number[]{
        const cumulativeWeights: number[] = new Array(weights.length).fill(0);
        cumulativeWeights[0] = weights[0];
        for(let i = 1; i < weights.length; i++){
            cumulativeWeights[i] = cumulativeWeights[i - 1] + weights[i];
        }
        return cumulativeWeights;
    }

    selectServer(req: Request): Server | null {
        let server = null;
        const randomValue = Math.floor(Math.random() * this.totalWeight);

        let i = 0;
        let found = false;
        while(i < this.cumulativeWeight.length && !found){
            if(randomValue < this.cumulativeWeight[i] && this.serverList[i].isHealthy){
                this.currentIndex = i;
                found = true;
                server = this.serverList[i];
            }
            i++;
        }

        return server;
    }

    setServerHealthy(serverId: string): void {
        const server = this.serverList.find(server => server.id === serverId);
        if(server){
            server.isHealthy = true;
            console.log(`Server ${serverId} marked as healthy.`);
        }
    }

    setServerUnhealthy(serverId: string): void {
        const server = this.serverList.find(server => server.id === serverId);
        if(server){
            server.isHealthy = false;
            console.log(`Server ${serverId} marked as unhealthy.`);
        }
    }

}