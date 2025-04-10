const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

// Use Express middleware
app.use(express.json())

// Use bodyparser middleware
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// Use cookieParser middleware
const cookieParser = require('cookie-parser')
app.use(cookieParser())

// Use Cors middleware
const cors = require('cors')
app.use(cors())

// Use dotenv
require('dotenv').config({path: 'config.env'})

// Run Database
const connectDB = require('./models/database')
connectDB()

// User routers
const signupRouter = require('./routers/signup-router')
const loginRouter = require('./routers/login-router')
const adminDashboardRouter = require('./routers/admin-dashboard-router')
const userDashboardRouter = require('./routers/user-dashboard-router')

app.use('/e-commerce/account', signupRouter)
app.use('/e-commerce/account', loginRouter)
app.use('/e-commerce/admin-dashboard', adminDashboardRouter)
app.use('/e-commerce/user-dashboard', userDashboardRouter)

app.listen(PORT, ()=> {
    console.log(`Server is Running on PORT ${PORT}`)   
})