import { Request } from 'express';
import { ILoadBalancingStrategy } from '../../interfaces/lb-stratgy.interface';
import { Server } from '../../interfaces/server.interface';

export class RoundRobinStrategy implements ILoadBalancingStrategy{
    private currentIndex: number = 0;

    constructor(){
        console.log('Round Robin Load Balancer initialized.');
    }

    private getHealthyServers(servers: Server[]): Server[]{
        return servers.filter(server => server.isHealthy);
    }

    selectServer(req: Request, servers: Server[]): Server | null {
        let server = null;
        const healthyServers = this.getHealthyServers(servers);
        if(healthyServers.length > 0){
            server = healthyServers[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % healthyServers.length;
            console.log(`Selected server (Round Robin): ${server.url}`);
        }else{
            console.error('No healthy servers available for Round Robin strategy.');
        }

        return server;
    }
}