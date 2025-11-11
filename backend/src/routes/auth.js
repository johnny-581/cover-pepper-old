import { Router } from "express";
import passport from "passport";

const router = Router();

// entry point to google auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/api/auth/failure" }),
    (req, res) => {
        // on success
        res.redirect(process.env.CLIENT_ORIGIN); // redirect back to frontend
    }
);

router.get("/failure", (req, res) => {
    res.status(401).json({ error: "Google authentication failed!" });
});

router.post("/logout", (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logout sucessful!" });
    });
});

router.get("/me", (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Cookie');
    res.json({ user: req.user || null });
});

export default router;
