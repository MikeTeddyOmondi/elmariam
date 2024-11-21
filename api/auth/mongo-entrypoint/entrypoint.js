var db = connect("mongodb://mongo:password@localhost:27017/admin")

db = db.getSiblingDB('auth_db'); // we can not use "use" statement here to switch db

db.createUser(
    {
        user: "user",
        pwd: "password",
        roles: [ { role: "readWrite", db: "auth_db"} ],
        passwordDigestor: "server",
    }
)
