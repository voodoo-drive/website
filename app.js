const express = require('express')
const app = express()

app.use(express.static('./dist/ngApp'));

app.listen(process.env.PORT || 5000, function () {
});
