import express from 'express';
import session from "express-session";
import cors from "cors";
import morgan from "morgan";
import passport from './config/passport.js';
import { ENV } from './config/env.js';
import authRoutes from "./routes/auth.js";
import letterRoutes from "./routes/letters.js";
import { errorHandler } from "./middleware/errorHandler.js";
import prisma from './config/prisma.js';
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

const app = express();

app.use(morgan(ENV.NODE_ENV === "production" ? "combined" : "dev")); // change to "combined" in production

app.use(express.json({ limit: "2mb" }))
app.use(
    cors({
        origin: ENV.CLIENT_ORIGIN,
        credentials: true
    })
);

app.set("trust proxy", 1);
app.use(
    session({
        name: "sid",
        secret: ENV.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            // sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
            sameSite: "lax",
            secure: ENV.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
        store: new PrismaSessionStore(prisma, {
            // checkPeriod: 2 * 60 * 1000,
            dbRecordIdIsSessionId: true,
        }),
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/healthz", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/letters", letterRoutes);

app.use(errorHandler);

app.listen(ENV.PORT, () => {
    console.log(`Server listening on http://localhost:${ENV.PORT}`);
});