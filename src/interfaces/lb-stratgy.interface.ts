import { Request } from "express";
import { Server } from "./server.interface";

export interface ILoadBalancingStrategy {
    selectServer(req: Request, servers: Server[]): Server | null;
};