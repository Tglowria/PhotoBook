const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database/db');
const userRouter = require('./routes/authRoutes');

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;


(async () => {
    try {
        await connectDB(process.env.MONGODB_URL);
        console.log("this is the url we are connecting to", process.env.MONGODB_URL)
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
})();

app.get('/', (req, res) => {
    res.send('Welcome to PhotoBook!');
});

app.use('/api/v1/user', userRouter);

app.listen(port, () => {
    console.log(` Server running on port ${port}`);
});
