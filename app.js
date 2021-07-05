require('dotenv').config();

const express = require('express')
const path = require('path')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const crypto = require('crypto')
const cors = require('cors')
const argon2 = require('argon2')
const helmet = require('helmet')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const sharp = require('sharp')
const JWTstrategy = require('passport-jwt').Strategy
const localStrategy = require('passport-local').Strategy
const ExtractJWT = require('passport-jwt').ExtractJwt

const { body, validationResult } = require('express-validator')
const { User, Pastes, Tags } = require('./database')
const { memcached } = require('./memcache')


const app = express()

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

if (process.env.NODE_ENV !== 'production') {
    app.use(logger('dev', { stream: accessLogStream }))
}
else {
    app.use(logger('short', { stream: accessLogStream }))
}

if (process.env.NODE_ENV === 'production') {
    app.use(helmet)
}

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors())

// doesn't really matter, just make sure not a privileged port
// and not in use by anything else
const port = process.env.PORT || 3000

// default prefix
const ROUTE_PREFIX = '/api/v1'

passport.use(
    new JWTstrategy(
        {
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
        },
        async (token, done) => {
            try {
                return done(null, token.user)
            }
            catch (error) {
                done(error)
            }
        }
    )
)

passport.use(
    'signup',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const hash = await argon2.hash(password, {type: argon2.argon2id})
                // Reassigned later
                let user = await User.findOne({ where: { email: email }})
                // user already exists on signup
                if (user !== null) {
                    return done(null, false)
                }
                user = User.build({ email: email, password_hash: hash })
                await user.save()
                return done(null, user)
            }
            catch (error) {
                done(error)
            }
        }
    )
)

passport.use(
    'login',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ where: { email: email }})

                if (user === null) {
                    return done(null, false, { success: false, message: 'Incorrect email or password' })
                }

                let validate = await argon2.verify(user.password_hash, password)

                if (!validate) {
                    return done(null, false, { success: false, message: 'Incorrect email or password' })
                }

                // Store it for N seconds
                const N = 60 * 3600
                memcached.set(`${email}_userobject`, user, N, function (err) {
                    // Set the data
                    console.log(`Memcached error: ${err}`)
                })

                return done(null, user, { success: true, message: 'Logged in successfully' })
            }
            catch (error) {
                return done(error)
            }
        }
    )
)

const preauth = require('./routes/preauth')
app.use(preauth)

const routes = require('./routes/secure')

// Plug in the JWT strategy as a middleware so only verified users can access this route
// Unprotect /register, /login/, /forgot-password and the default route
app.use(passport.authenticate('jwt', { session: false }), routes)

app.get('/', (req, res) => {
    res.json({ info: `Node.js, Express, and Postgres API ENV = ${process.env.NODE_ENV} port ${port}` })
})

// app.post(ROUTE_PREFIX + '/register',
//     body('name').notEmpty(),
//     // must be an email
//     body('email').isEmail(),
//     // password must be at least 8 chars long
//     body('password').isLength({ min: 8 }),  async (req, res) => {
//
//     const errors = validationResult(req)
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ success: false, message: errors.array() })
//     }
//
//     let user = await User.findOne({ where: { email: req.body.email }})
//     if (user !== null) {
//         return res.status(409).json({ success: false, message: `Email ${req.body.email} already registered` })
//     }
//
//     const hash = await argon2.hash(req.body.password, {type: argon2.argon2id})
//     user = User.build({ name: req.body.name, email: req.body.email, password_hash: hash })
//
//     await user.save()
//
//     res.status(201).json({ success: true, message: `Successfully created user with email ${req.body.email}` })
// })
//
// app.post(ROUTE_PREFIX + '/login',
//     // must be an email
//     body('email').isEmail(),
//     // password must be at least 8 chars long
//     body('password').isLength({ min: 8 }),
//     async (req, res) => {
//
// })


app.listen(port, () => {
    console.log(`App running on port ${port}`)
})
