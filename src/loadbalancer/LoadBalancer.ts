import { Request, Response } from "express";
import axios from "axios";
import { ILoadBalancingStrategy } from "../interfaces/lb-stratgy.interface";
import { Server } from "../interfaces/server.interface";

const MAX_CONCURRENT_REQUESTS_PER_SERVER = 10;

export class LoadBalancer {
    private strategy: ILoadBalancingStrategy;
    private servers: Server[];

    constructor(strategy: ILoadBalancingStrategy, serversUrl: string[], initialWeights?: number[]){
        this.servers = serversUrl.map((url, index) => ({
            url: url,
            id: `server-${index + 1}`,
            isHealthy: true,
            activeConnections: 0,
            totalResponseTime: 0,
            requestCount: 0,
            currentLoad: 0,
            weight: initialWeights && initialWeights[index] !== undefined ? initialWeights[index] : 1,
            queue: [],
            isProcessingQueue: false
        }));

        this.strategy = strategy;
        console.log("Load balancer initialized with provided strategy and servers", this.servers.map(server => server.url));
    
        
        this.startQueue();
    }

    public setServerHealthy(serverId: string): void {
        const server = this.servers.find(server => server.id === serverId);
        if(server){
            server.isHealthy = true;
            console.log(`Server ${serverId} marked as healthy.`);
        }
    }

    public setServerUnhealthy(serverId: string): void {
        const server = this.servers.find(server => server.id === serverId);
        if(server){
            server.isHealthy = false;
            console.log(`Server ${serverId} marked as unhealthy.`);
        }
    }

    private startQueue(){
        setInterval(()=>{
            this.servers.forEach(server => {
                if(
                    server.queue.length > 0 && 
                    server.activeConnections < MAX_CONCURRENT_REQUESTS_PER_SERVER && 
                    server.isHealthy && 
                    !server.isProcessingQueue
                ){
                    this.processServerQueue(server);
                }
            });
        }, 100);
    }

    private async processServerQueue(server: Server): Promise<void>{
        if(
            server.isProcessingQueue || 
            server.queue.length === 0 || 
            server.activeConnections >= MAX_CONCURRENT_REQUESTS_PER_SERVER || 
            !server.isHealthy
        )return;

        server.isProcessingQueue = true;
        while(
            server.queue.length > 0 && 
            server.activeConnections < MAX_CONCURRENT_REQUESTS_PER_SERVER && 
            server.isHealthy
        ){
            const queuedRequest = server.queue.shift();
            if(queuedRequest){
                console.log(`Processing queued request for ${server.id}. Queue size: ${server.queue.length}`);
                await this.forwardRequestToServer(queuedRequest.req, queuedRequest.res, server, queuedRequest.startTime);
            }
        }

        server.isProcessingQueue = false;
    }


    async distribute(req: Request, res: Response): Promise<void>{
        const startTime = process.hrtime.bigint();
        const server = this.strategy.selectServer(req, this.servers);

        if(server){
            if(server.activeConnections >= MAX_CONCURRENT_REQUESTS_PER_SERVER){
                server.queue.push({req, res, startTime});
                console.log(`Server ${server.id} is overload. Request queued. Queue size: ${server.queue.length}`);
                res.status(202).send("Request accepted and queued.Please wait for processing");
                return;
            }

            await this.forwardRequestToServer(req, res, server, startTime);
        }else{
            res.status(503).send('Service Unavailable: No healthy backend servers.');
        }
    }

    async forwardRequestToServer(req: Request, res: Response,  server: Server, startTime: bigint){
        server.activeConnections++;
        const targetUrl = `${server.url}/api/v1${req.originalUrl}`;
        console.log(`Forwarding request to: ${targetUrl}`);

        try {
            req.headers["cache-control"] = "no-cache";

            const axiosConfig = {
                method: req.method,
                url: targetUrl,
                headers: { ...req.headers, host: new URL(server.url).hostname },
                data: req.body,
                responseType: 'stream'
            };

            const serverResponse = await axios(axiosConfig);
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            server.totalResponseTime += durationMs;
            server.requestCount++;


            for(const header in serverResponse.headers){
                if(serverResponse.headers.hasOwnProperty(header)){
                    res.setHeader(header, serverResponse.headers[header] as string);
                }
            }

            res.status(serverResponse.status);
            serverResponse.data.pipe(res);

            serverResponse.data.on('end', ()=>{
                server.activeConnections--;
                console.log(`Request to ${targetUrl} completed.Durantion: ${durationMs.toFixed(2)}ms. (Active Connections: ${server.activeConnections}`);
                this.processServerQueue(server);
            });

            serverResponse.data.on('error', (err: Error)=>{
                server.activeConnections--;
                console.error(`Error piping response from ${targetUrl}:`, err.message);
                if (!res.headersSent) {
                    res.status(500).send('Internal Server Error during response streaming.');
                } else {
                    res.end();
                }
                this.processServerQueue(server);
            });
        } catch (error: any) {
            server.activeConnections--;
            console.error(`Error forwarding request to ${targetUrl} `, error.message);
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
                this.setServerUnhealthy(server.id);
            }

            if (!res.headersSent) {
                res.status(500).send(`Error forwarding request: ${error.message}`);
            } else {
                res.end();
            }
            this.processServerQueue(server);
        }
    }
}