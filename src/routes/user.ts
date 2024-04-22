import express from 'express'
import { newUser, getAllUsers, getUser, deleteUser } from '../controllers/user.js'
import { adminOnly } from '../middlewares/auth.js'

const app = express.Router()

//Route - /api/v1/user/new
app.post("/new", newUser)

//Route - /api/v1/user/all
app.get("/all",adminOnly, getAllUsers)

//Route - /api/v1/user/dynamicID
app.get("/:id", getUser)

//Route - /api/v1/user/dynamicID
app.delete("/:id", adminOnly, deleteUser)

// app.route("/:id").get(getUser).delete(adminOnly, deleteUser)



export default app