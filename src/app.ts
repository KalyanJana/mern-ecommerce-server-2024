import express from 'express'
import { connectDB } from './utils/features.js'
import { errorMiddleware } from './middlewares/error.js'

//importing Routes
import userRoute from './routes/user.js'
import productRoute from './routes/products.js'
import orderRoute from './routes/order.js'
import paymentRoute from './routes/payments.js'
import dashboardRoute from './routes/stats.js'


import NodeCache from 'node-cache'
import { config } from 'dotenv'
import morgan from 'morgan'
import Stripe from 'stripe'
import cors from 'cors'


config({
    path: "./.env"
})

const port = process.env.PORT || 4000
const mongoURI = process.env.MONGO_PROD_URL || ''
const stripeKey = process.env.STRIPE_KEY || ''

connectDB(mongoURI)

export const stripe = new Stripe(stripeKey)

export const myCache = new NodeCache()

const app = express()

app.use(express.json())
app.use(morgan("dev"))  // ki ki request krchi seta terminal e dekhabe
// app.use(cors({
//     origin: [""],
//     methods: [],
// }))
app.use(cors())

app.get("/", async(req,res)=>{
    res.send("API working with /api/v1")
})

//using routes
app.use("/api/v1/user", userRoute)
app.use("/api/v1/product", productRoute)
app.use("/api/v1/order", orderRoute)
app.use("/api/v1/payment", paymentRoute)
app.use("/api/v1/dashboard", dashboardRoute)

//api path for images
app.use("/uploads", express.static("uploads"))
//error handling middleware
app.use(errorMiddleware)

app.listen(port, ()=>{
    console.log(`Express is working on http://localhost:${port}`)
})