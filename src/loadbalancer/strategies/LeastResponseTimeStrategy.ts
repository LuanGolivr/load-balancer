import { Request } from "express";
import { ILoadBalancingStrategy } from "../../interfaces/lb-stratgy.interface";
import { Server } from "../../interfaces/server.interface";

export class LeastResponseTimeStrategy implements ILoadBalancingStrategy{
    constructor(){
        console.log("Least Response Time Load Balancer strategy initialized");
    }

    private getHealthyServers(servers: Server[]): Server[]{
        return servers.filter(server => server.isHealthy);
    }

    selectServer(req: Request, servers: Server[]): Server | null {
        let leastResponseTimeServer = null;
        let minAverageResponseTime = Infinity;
        const healthyServers = this.getHealthyServers(servers);
        
        for(const server of healthyServers){
            const averageResponseTime = server.requestCount > 0 ? server.totalResponseTime : 0;
            if(averageResponseTime < minAverageResponseTime){
                minAverageResponseTime = averageResponseTime;
                leastResponseTimeServer = server;
            }
        }

        if(leastResponseTimeServer)console.log(`Selected server (Least Response Time): ${leastResponseTimeServer.url} with average response time: ${minAverageResponseTime.toFixed(2)}ms`);
        return leastResponseTimeServer;
    }
}