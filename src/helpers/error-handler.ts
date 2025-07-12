import { Request, Response, NextFunction } from "express";


class ErrorHandler{
    static notFound(req: Request, res: Response, next: NextFunction){
        const error = new Error(`Not Found - ${req.originalUrl}`);
        res.status(404);
        next(error);
    }

    static serverError(
        error: Error,
        req: Request, 
        res: Response,
        next: NextFunction
    ){
        res.status(500).json({message: error.message});
    }
}

export default ErrorHandler;