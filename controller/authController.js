const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const User = require("../models/userModels");
const dotenv = require('dotenv');

dotenv.config();

exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, password, email, phoneNumber } = req.body;

        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

    
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            firstName,
            lastName,
            password: hashedPassword,
            email,
            phoneNumber
        });

        await newUser.save();

        return res.status(201).json({ message: "User registered successfully", newUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error registering user", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please input your email and password" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User Not Found, Please Signup" });
        }

        const correctPassword = await bcrypt.compare(password, user.password);
        if (!correctPassword) {
            return res.status(400).json({ message: "Incorrect Password" });
        }

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

        user.refreshToken = refreshToken;
        user.markModified("refreshToken"); 
        await user.save();


        return res.status(200).json({
            message: "User is Logged In Successfully",
            accessToken,
            refreshToken,
            user
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error Logging In User", error: err.message });

    }
};

exports.updateUser = async (req, res) => {
    try {
        
        const userId = req.user.id;

        const { firstName, lastName, email, phoneNumber, password } = req.body;

        const updates = {};

        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (email) updates.email = email;
        if (phoneNumber) updates.phoneNumber = phoneNumber;

        if (password) {
            const saltRounds = 10;
            updates.password = await bcrypt.hash(password, saltRounds);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { 
            new: true, 
            runValidators: true 
        });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", updatedUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error updating user", error: err.message });
    }
};


exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.header("Authorization");

        if (!refreshToken) {
            return res.status(403).json({ message: "Refresh Token is required" });
        }
        const token = refreshToken.split(" ")[1];
        jwt.verify(token, process.env.REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or Expired Refresh Token" });
            }

            const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: "5m" });

            return res.status(200).json({
                message: "Access Token Refreshed Successfully",
                accessToken: newAccessToken
            });
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error refreshing token", error: err.message });
    }
};