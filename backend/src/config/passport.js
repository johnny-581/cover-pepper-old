import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma.js';
import { ENV } from './env.js';

passport.serializeUser((user, done) => {
    // store only user id in the session
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

console.log("[passport] registering google strategy...");
passport.use(
    new GoogleStrategy(
        {
            clientID: ENV.GOOGLE_CLIENT_ID,
            clientSecret: ENV.GOOGLE_CLIENT_SECRET,
            callbackURL: ENV.GOOGLE_CALLBACK_URL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error("Google account has no email"));

                let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
                if (!user) {
                    user = await prisma.user.upsert({
                        where: { email },
                        update: { googleId: profile.id, name: profile.displayName },
                        create: { email, googleId: profile.id, name: profile.displayName },
                    });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
);

export default passport;