import express from 'express'
import { newUser, getAllUsers, getUser, deleteUser } from '../controllers/user.js'
import { adminOnly } from '../middlewares/auth.js'
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from '../controllers/stats.js'

const app = express.Router()

//Route - /api/v1/dashboard/stats
app.get("/stats",adminOnly, getDashboardStats)

//Route - /api/v1/dashboard/pie
app.get("/pie",adminOnly, getPieCharts)

//Route - /api/v1/dashboard/bar
app.get("/bar",adminOnly, getBarCharts)

//Route - /api/v1/dashboard/bar
app.get("/line",adminOnly, getLineCharts)


export default app
