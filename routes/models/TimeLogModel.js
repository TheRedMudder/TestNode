const mongoose = require('mongoose');

const TimeLogModelSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    TaskName: String,
    Summary: String,
    StartTime: String,
    IsProductiveTime: String,
    StopTime: String,
    Duration: String
});
module.exports = mongoose.model('TimeLogModel',TimeLogModelSchema);