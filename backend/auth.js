const jwt = require('jsonwebtoken');

function generateToken() {
    // Just create a token; no user info needed since it's a single password
    return jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '2h' });
}

// Middleware to protect /api/admin
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Malformed token' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ msg: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

module.exports = { generateToken, authenticate };
