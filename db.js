var mysql = require('mysql')
var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database : process.env.DB_NAME,
  socketPath: "/var/run/mysqld/mysqld.sock"
})

connection.connect();

connection.query('SELECT 1', function (error, results, fields) {
  if (error) throw error;
  // connected!
});

module.exports = connection;