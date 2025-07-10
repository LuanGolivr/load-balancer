import { Request } from 'express';
import { ILoadBalancingStrategy } from '../../interfaces/lb-stratgy.interface';
import { Server } from '../../interfaces/server.interface';

export class RoundRobinStrategy implements ILoadBalancingStrategy{
    private servers: Server[];
    private currentIndex: number = 0;

    constructor(serversUrls: string[]){
        this.servers = serversUrls.map((url, index) => ({
            id: `server-${index + 1}`,
            url: url,
            isHealthy: true
        }));
        console.log('Round Robin Load Balancer initialized with backends:', this.servers.map(server => server.url));
    }

    private getHealthyServers(): Server[]{
        return this.servers.filter(server => server.isHealthy);
    }

    selectServer(req: Request): Server | null {
        let server = null;
        const healthyServers = this.getHealthyServers();
        if(healthyServers.length > 0){
            server = healthyServers[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % healthyServers.length;
            console.log(`Selected server (Round Robin): ${server.url}`);
        }

        return server;
    }

    setServerHealthy(serverId: string): void {
        const server = this.servers.find(server => server.id === serverId);
        if(server){
            server.isHealthy = true;
            console.log(`Server ${serverId} marked as healthy.`);
        }
    }

    setServerUnhealthy(serverId: string): void {
        const server = this.servers.find(server => server.id === serverId);
        if(server){
            server.isHealthy = false;
            console.log(`Server ${serverId} marked as unhealthy.`);
        }
    }
}