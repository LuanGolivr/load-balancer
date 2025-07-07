import { Request } from "express";
import { Server } from "./server.interface";

export interface ILoadBalancingStrategy {
    selectServer(req: Request): Server | null;

    setServerUnhealthy(serverId: string): void;

    setServerHealthy(serverId: string): void;
};