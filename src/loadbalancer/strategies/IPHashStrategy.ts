import { Request } from "express";
import { ILoadBalancingStrategy } from "../../interfaces/lb-stratgy.interface";
import { Server } from "../../interfaces/server.interface";

function stringHashCode(str: string): number{
    let hash = 0;
    for(let i = 0; i < str.length; i++){
        const char  = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

export class IPHashStrategy implements ILoadBalancingStrategy{
    constructor(){
        console.log("IP Hash Load Balancer strategy initialized");
    }

    private getHealthyServers(servers: Server[]): Server[]{
        return servers.filter(server => server.isHealthy);
    }

    selectServer(req: Request, servers: Server[]): Server | null {
        let server = null;
        const healthyServers = this.getHealthyServers(servers);
        if(healthyServers.length > 0){
            const clientIP = req.ip || null;

            if(clientIP){
                const ipHash = stringHashCode(clientIP);
                const selectedIndex = ipHash % healthyServers.length;
                server = healthyServers[selectedIndex];
                console.log(`Client IP: ${clientIP}, Hash: ${ipHash}, Selected Server (IP Hash): ${server.url}`);
            }else{
                console.warn("Could not determine client IP for IP Hash strategy.Falling back to first healthy server.");
                server = healthyServers[0];
            }
        }else{
            console.error('No healthy servers available for IP Hash strategy.');
        }
        return server;
    }
}