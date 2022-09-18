import { Response, NextFunction, Request } from "express";

import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { Admin } from "../entities/Admin";


import { dataSource } from "../data-source";

export type AdminPayload = JwtPayload & {
	account: string
	
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  const token = authHeader && authHeader.split(" ")[1];
   
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Token not found" });
  try {
    const decoded = jwt.verify(
      token,
      process.env.ADMIN_TOKEN_SECRET as Secret
    ) as AdminPayload
    const adminRepository = dataSource.getRepository(Admin);
    const admin = await adminRepository.findOne({
      where: {
        account: decoded.account,
      },
    });
    if (!admin)
        {
            return res
            .status(401)
            .json({ success: false, message: "Admin not found" });
        }else{
            req.body.admin = admin
            return next();
        }

    
  } catch (error) {
    console.log(error);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

export default verifyToken;
