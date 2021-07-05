const express = require('express')
const passport = require('passport')
const crypto = require('crypto')

const router = express.Router()

const { User, Pastes, Clients, Tags } = require('../database')
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
                    message: 'User information',
                    user: data
                })
            })
        }
        catch (e) {
            const data = User.findOne({ where: { email: email }})

            // req.user is the token and not the User model
            res.json({
                success: true,
                message: 'User information',
                user: data
            })
        }
    }
)

router.patch(
    '/api/v1/profile',
    async (req, res, next) => {
        const email = req.body.email
        await User.update( { name: req.body.name, address: req.body.address, state: req.body.state,
            postcode: req.body.postcode, mobile: req.body.mobile, business_name: req.body.business_name,
            abn: req.body.abn },
            { where: { email: email } } )
        // Store it for N seconds
        const N = 60 * 3600
        const user = await User.findOne({ where: { email: email }})
        memcached.replace(`${email}_userobject`, user, N, function (err) {
            if (err) {
                console.log(`Memcached error: ${err}`)
            }
            res.json({ success: true,
                message: 'User profile updated',
                user: user })
        })
    }
)

router.get('/api/v1/uuid',
    async (req, res) => {
    const uuid = crypto.randomUUID()
    res.json({ uuid: `${uuid}` })
})


module.exports = router