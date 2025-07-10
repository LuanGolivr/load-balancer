import { Request, Response } from "express";
import axios from "axios";
import { ILoadBalancingStrategy } from "../interfaces/lb-stratgy.interface";

export class LoadBalancer {
    private strategy: ILoadBalancingStrategy;

    constructor(strategy: ILoadBalancingStrategy){
        this.strategy = strategy;
        console.log("Load balancer initialized with provided strategy.");
    }

    async distribute(req: Request, res: Response): Promise<void>{
        const server = this.strategy.selectServer(req);

        if(server){
            const targetUrl = `${server.url}/api/v1${req.originalUrl}`;
            console.log(`Forwarding request to: ${targetUrl}`);

            try {
                const axiosConfig = {
                    method: req.method,
                    url: targetUrl,
                    headers: { ...req.headers, host: new URL(server.url).hostname },
                    data: req.body,
                    responseType: 'stream'
                };

                const serverResponse = await axios(axiosConfig);

                for(const header in serverResponse.headers){
                    if(serverResponse.headers.hasOwnProperty(header)){
                        res.setHeader(header, serverResponse.headers[header] as string);
                    }
                }

                res.status(serverResponse.status);
                serverResponse.data.pipe(res);

                serverResponse.data.on('end', ()=>{
                    console.log(`Request to ${targetUrl} completed.`);
                });

                serverResponse.data.on('error', (err: Error)=>{
                    console.error(`Error piping response from ${targetUrl}:`, err.message);
                    if (!res.headersSent) {
                        res.status(500).send('Internal Server Error during response streaming.');
                    } else {
                        res.end();
                    }
                });
            } catch (error: any) {
                console.error(`Error forwarding request to ${targetUrl} `, error.message);
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
                    this.strategy.setServerUnhealthy(server.id);
                }
                if (!res.headersSent) {
                    res.status(500).send(`Error forwarding request: ${error.message}`);
                } else {
                    res.end();
                }
            }
        }else{
            res.status(503).send('Service Unavailable: No healthy backend servers.');
        }
        
    }


}