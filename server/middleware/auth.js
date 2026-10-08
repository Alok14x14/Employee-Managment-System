import jwt from 'jsonwebtoken'
import Employee from '../models/Employee.js'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({ error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const session = jwt.verify(token, process.env.JWT_SECRET)

        if(!session){
            return res.status(401).json({ error: "Unauthorized" });
        }

        const [user, emp] = await Promise.all([
            User.findById(session.userId).select("role email").lean(),
            Employee.findOne({ userId: session.userId }).select("isDeleted").lean()
        ]);

        if(!user){
            return res.status(401).json({ error: "Unauthorized" });
        }

        if(user.role === "EMPLOYEE" && emp?.isDeleted){
            return res.status(403).json({ error: "Account deactivated" });
        }

        req.session = { ...session, role: user.role };
        next()
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
}

export const protectAdmin = (req, res, next)=>{
    if(req?.session?.role !== "ADMIN"){
        return res.status(403).json({ error: "Admin access required" });
    }
    next()
}