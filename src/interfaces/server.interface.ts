import { Request, Response } from "express";

export interface Server {
    id: string;
    url: string;
    isHealthy: boolean;
    activeConnections: number;
    totalResponseTime: number;
    requestCount: number;
    currentLoad: number;
    weight: number;
    queue:  {req: Request; res: Response; startTime: bigint}[];
    isProcessingQueue: boolean;
};