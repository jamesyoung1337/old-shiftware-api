require('dotenv').config()

// TODO: Place all database stuff in separate module
const { Sequelize, Op, DataTypes, Model } = require('sequelize')
const sequelize = new Sequelize(`postgres://${process.env.PG_USER}:${process.env.PG_PASS}@localhost:5432/api`)

// Optional stuff for testing connection
// const connect = async () => {
//     await sequelize.authenticate()
// }
//
// connect()

// TODO: Place in separate module
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.ENUM(['NSW','ACT','QLD','VIC','TAS','SA','WA','NT'])
    },
    postcode: {
        type: DataTypes.STRING
    },
    mobile: {
        type: DataTypes.STRING
    },
    business_name: {
        type: DataTypes.STRING
    },
    abn: {
        type: DataTypes.STRING
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true
})

const Pastes = sequelize.define('Pastes', {
    id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: true
})

const Clients = sequelize.define('Clients', {
    id: { 
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.ENUM(['NSW','ACT','QLD','VIC','TAS','SA','WA','NT'])
    },
    postcode: {
        type: DataTypes.STRING
    },
    mobile: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true
})

const Tags = sequelize.define('Tags', {
        tag: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {}
)

Pastes.User = Pastes.belongsTo(User)
User.Pastes = User.hasMany(Pastes)
User.Clients = User.hasMany(Clients)
Clients.User = Clients.belongsTo(User)
Pastes.Tags = Pastes.belongsToMany(Tags, {through: 'PasteTags'})
Tags.Pastes = Tags.belongsToMany(Pastes, {through: 'PasteTags'})

// if force is true, drop the tables then recreate, otherwise use existing from previous run
sequelize.sync({ force: false }).then(r => console.log("All models were synchronized successfully."))

module.exports = {
    User,
    Clients,
    Pastes,
    Tags,
    sequelize
}