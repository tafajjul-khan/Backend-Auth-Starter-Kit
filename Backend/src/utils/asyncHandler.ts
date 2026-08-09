import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiResponse } from "./apiResponse.ts";

// <ReqType = Request> se default Express Request,
export const asyncHandler = <ReqType = Request>(
  fn: (
    req: ReqType,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown> | unknown,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as ReqType, res, next))
      .then((result) => {
        if (result instanceof ApiResponse) {
          result.send(res);
        }
      })
      .catch(next);
  };
};
