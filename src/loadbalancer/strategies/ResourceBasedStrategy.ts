import { Request } from "express";
import { ILoadBalancingStrategy } from "../../interfaces/lb-stratgy.interface";
import { Server } from "../../interfaces/server.interface";

export class ResourceBasedStrategy implements ILoadBalancingStrategy{
    constructor(){
        console.log("Resource Based Load Balancer strategy initialized");
    }

    private getHealthyServers(servers: Server[]): Server[]{
        return servers.filter(server => server.isHealthy);
    }

    selectServer(req: Request, servers: Server[]): Server | null {
        let bestServer = null;
        let minLoad = Infinity;
        const healthyServers = this.getHealthyServers(servers);

        if(healthyServers.length > 0){
            for(const server of healthyServers){
                if(server.currentLoad < minLoad){
                    minLoad = server.currentLoad;
                    bestServer = server;
                }
            }

            if(bestServer)console.log(`Selected server (Resource Based): ${bestServer.url} with load ${bestServer.currentLoad}`);
        }else{
            console.error('No healthy servers available for Resource Based strategy.');
        }
        
        return bestServer;
    }
}