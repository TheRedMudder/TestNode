const moment = require('moment');//For Time
const logger = (req,res,next)=>{
    console.log(`//${req.get('host')}${req.originalUrl}: ${moment().format()}`);//Log Time
    next();
};
module.exports=logger;