const express = require('express')
const passport = require('passport')
const crypto = require('crypto')

const router = express.Router()

const { User, Pastes, Tags } = require('../database')
const { memcached } = require('../memcache')

router.get(
    '/api/v1/profile',
    async (req, res, next) => {
        const email = req.user.email
        // Found the user and password verified, stash in memcached
        try {
            await memcached.get(`${email}_userobject`, function (err, data) {
                if (err) {
                    let data = User.findOne({where: {email: email}})
                }
                let s = JSON.stringify(data, null, 2)
                console.log(`Data from memcached = ${s}`)

                // req.user is the token and not the User model
                res.json({
                    success: true,
                    message: 'You made it to the secure route',
                    user: req.user,
                    object: data
                })
            })
        }
        catch (e) {
            const data = User.findOne({ where: { email: email }})

            // req.user is the token and not the User model
            res.json({
                success: true,
                message: 'You made it to the secure route',
                user: req.user,
                object: data
            })
        }
    }
)

router.patch('/api/v1/profile',
    async (req, res) => {

})

router.get('/api/v1/uuid',
    async (req, res) => {
    const uuid = crypto.randomUUID()
    res.json({ uuid: `${uuid}` })
})


module.exports = router