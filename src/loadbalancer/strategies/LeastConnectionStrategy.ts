import { Request } from "express";
import { ILoadBalancingStrategy } from "../../interfaces/lb-stratgy.interface";
import { Server } from "../../interfaces/server.interface";

export class LeastConnectionStrategy implements ILoadBalancingStrategy{
    constructor(){
        console.log("Least Connection Load Balancer strategy initialized.");
    }

    private getHealthyServers(servers: Server[]): Server[]{
        return servers.filter(server => server.isHealthy);
    }

    selectServer(req: Request, servers: Server[]): Server | null {
        let leastConnectionsServer = null;
        const healthyServers = this.getHealthyServers(servers);

        if(healthyServers.length > 0){
            let minConnections = Infinity;

            for(const server of healthyServers){
                if(server.activeConnections < minConnections){
                    minConnections = server.activeConnections;
                    leastConnectionsServer = server;
                }
            }

            if(leastConnectionsServer)console.log(`Selected server (Least Connection): ${leastConnectionsServer.url} with ${leastConnectionsServer.activeConnections} connections`);
        }else{
            console.error('No healthy servers available for Least Connection strategy.');
        }
        
        return leastConnectionsServer;
    }
}