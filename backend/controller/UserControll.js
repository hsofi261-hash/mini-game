const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')



const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        // 2. Check if user exists BEFORE hashing password to save system resources
        const existUser = await User.findOne({ where: { email } });
        if (existUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        // 3. Hash password and create user
        const hashed_password = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: username,
            email: email,
            password: hashed_password
        });

        // 4. Generate Access Token
        const accessToken = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // 5. Generate Refresh Token
        const refreshToken = jwt.sign(
            {
                id: newUser.id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // 6. Set HTTP-only cookie with refresh token
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // 7. Return access token so frontend state matches login state
        return res.status(201).json({
            message: "User registered and logged in successfully",
            accessToken,
            user: {
                id: newUser.id,
                username: newUser.name,
                email: newUser.email
            }
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



const login = async (req, res) => {
    try {
        const { email, password } = req.body;


        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Create access token
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Create refresh token
        const refreshToken = jwt.sign(
            {
                id: user.id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Store refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful",
            accessToken
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};



const jwtverify = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token required"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(403).json({
                message: "Invalid or expired access token"
            });
        }

        console.error(err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;

        if (!cookies?.refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing"
            });
        }

        const token = cookies.refreshToken;

        // Verify the refresh token
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        // Confirm user still exists in DB
        const user = await User.findOne({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // Issue a fresh access token
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m"
            }
        );

        return res.status(200).json({ accessToken });

    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(403).json({
                message: "Invalid or expired refresh token"
            });
        }

        console.error(err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


const checkUser = async (req, res) => {
    try {
        // req.user is populated by the jwtverify middleware ({ id, email })
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // Fetch user from database excluding password
        const user = await User.findOne({
            where: { id: userId },
            attributes: { exclude: ["password"] }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  // 1. Optional: Delete/revoke token from database or Redis
  if (refreshToken) {
    await TokenModel.deleteOne({ token: refreshToken });
  }

  // 2. Clear the HttpOnly cookie by matching path & options
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { register, login, jwtverify, refreshToken, checkUser, logout };

