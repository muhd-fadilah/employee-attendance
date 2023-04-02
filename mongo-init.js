db.createUser(
    {
        user: "attendance_user",
        pwd: "password",
        roles: [
            {
                role: "readWrite",
                db: "attendance_db"
            }
        ]
    }
);