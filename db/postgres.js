
const pgp = require('pg-promise')();

// const connection = {
//     host: process.env.DB_HOST,
//     port: 5432,
//     database: process.env.DB_NAME,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS
// };

const connection = pgp(process.env.DATABASE_URL);

// db.any('SELECT * FROM gamestates where uuid = \'13b0f464-cd17-4e66-b002-f06bcf0f36ff\'', [true])
//     .then(function(data) {
//         // success;
//         console.table(data);
//     })
//     .catch(function(error) {
//         // error;
//         //console.log('error in the db or query')
//         console.error(error)
//     });

module.exports = connection;