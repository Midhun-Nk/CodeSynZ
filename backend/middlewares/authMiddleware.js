// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded._id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // set minimal user on req (avoid storing full user object in token)
    req.user = {
      _id: decoded._id,
      email: decoded.email,
      username: decoded.username
    };
    next();
  } catch (err) {
    console.error('JWT error', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
