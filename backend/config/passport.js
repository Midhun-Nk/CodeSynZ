import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

export default function initPassport() {

  // GOOGLE STRATEGY
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:4000/api/auth/google/callback",
      },
      async (_, __, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            const existingEmail = await User.findOne({
              email: profile.emails[0].value
            });

            if (existingEmail) {
              existingEmail.googleId = profile.id;
              existingEmail.authProvider = "google";
              user = await existingEmail.save();
            } else {
              user = await User.create({
                username: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                authProvider: "google",
              });
            }
          }

          return done(null, user);

        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // GITHUB STRATEGY
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:4000/api/auth/github/callback",
      },
      async (_, __, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (!user) {
            user = await User.create({
              username: profile.username,
              email: `${profile.username}@github.com`,
              githubId: profile.id,
              authProvider: "github",
            });
          }

          return done(null, user);

        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // IMPORTANT FIX
  passport.serializeUser((user, done) => done(null, user._id));

  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then(user => done(null, user))
      .catch(err => done(err, null));
  });
}
