//Required Imports
const express = require('express'); //Express
const router = express.Router(); //Request Routing
const TimeDictionaryModel = require('./models/TimeLogModel')//TL Model
const mongoose = require('mongoose');//DB Client
const SERVER_LOCATION = "http://localhost:5000/summary/";
const shell = require('shelljs')

function cloneInefficently(jsonObj) { //Clone (Ineffeceint, but works for small stuff)
    return JSON.parse(JSON.stringify(jsonObj));
}

function prettyZeros(t){ //Prepend Zeros to Time Elapsed if necessary
    var s = ""+t;
    while (s.length<2){
        s="0"+s;
    }
    return s;
}

function prettyTimeElapsed(timeinsec){ //Formatted Time Elapsed
    var durationtime=new Date((timeinsec+1) * 1000);
    return prettyZeros(durationtime.getUTCHours().toString())+":"+prettyZeros(durationtime.getUTCMinutes().toString())+":"+prettyZeros(durationtime.getUTCSeconds().toString());
}

function prettyDayElapsed(timeinsec){ //Formatted Time Elapsed
    var durationtime=new Date((timeinsec+1) * 1000);
    return Number(durationtime.getUTCDate().toString());
}
function prettyDisplayLog(tdele) { /*Format Time To Be Readable & Remove Unnecessary JSON Attributes */
    var timeentry;//Deep Clone Object
    timeentry = cloneInefficently(tdele);
    timeentry._id = undefined; timeentry.__v = undefined;// Removing Garbage Attributes
    if (timeentry.StopTime.length > 0) {// Make Stop Time Readable
        timeentry.PrettyStop = new Date(timeentry.StopTime * 1000).toString(); 
        timeentry.Duration =prettyTimeElapsed(timeentry.StopTime - timeentry.StartTime) ;
    } else {
        timeentry.StopTime = undefined;
        timeentry.Duration = undefined;
    }
    timeentry.PrettyStartTime = new Date(timeentry.StartTime * 1000).toString();// Make Start Time Readable
    return timeentry;
}

function getTask(req, res) { // Gets the Last TimeEvent of Provided Name or Return Last TimeEvent if Nothing Found
    checkNAME = String(req.params.name).toLowerCase();
    if ((checkNAME === "update") || (checkNAME === "update/")) {
        res.status(200).json({ status: "New Updating Server...May go temporarily offline." });
        setTimeout(() => {
            // process.exit(0);
            shell.chmod('755','./Update.sh');
            shell.exec('./Update.sh',{async:true});

          }, 1000);

    }else if ((checkNAME === "summary") || (checkNAME === "summary/")) {
        getAllTask(req, res);
    } else if ((checkNAME === "stop") || (checkNAME === "stop/")) {
        stopTask(req, res);
    } else if ((checkNAME === "new") || (checkNAME === "new/")) {
        newTask(req, res);
    } else {
        TimeDictionaryModel.find({ TaskName: req.params.name }).sort({ _id: -1 }).limit(1).exec().then(docs => {
            if (docs.length > 0) {
                res.json(prettyDisplayLog(docs[0]));
            } else {
                TimeDictionaryModel.find().sort({ _id: -1 }).limit(1).exec().then(docs => {
                    if (docs.length > 0) {
                        res.json({ lastevent: prettyDisplayLog(docs[0]) });
                    } else {
                        res.json({ Error: "Nothing to retrieve! Use POST to add first TimeEvent" });
                    }
                }).catch(err => { res.status(500).json({ error: err }); });
            }
        }).catch(err => { res.status(500).json({ error: err }); });
    }
}

function newTask(req, res) { //Creates New Time Event and Stops Last Time Event
    var time_stopstart = Date.now() / 1000;
    TimeDictionaryModel.find().sort({ _id: -1 }).limit(1).exec().then(docs => {
        if (docs.length > 0 && docs[0].StopTime.length == 0) {
            TimeDictionaryModel.update({ _id: docs[0]._id }, { $set: { StopTime: time_stopstart } }).exec();
        }
    }).catch(err => { res.status(500).json({ error: err }); });
    var taskname = '';
    if (typeof req.body.name !== 'undefined') {
        taskname = req.body.name;
    } else if ((typeof req.params.name !== 'undefined') && (String(req.params.name).toLowerCase() !== "new") && (String(req.params.name).toLowerCase() !== "new/")) {
        taskname = req.params.name;
    } else {
        res.status(500).json({ error: "You wanted to create a activity to track, but didn't give it a name!" });
        return;
    }
    var tdElement;
    const tdModel = new TimeDictionaryModel({
        _id: new mongoose.Types.ObjectId,
        TaskName: taskname,
        Summary: SERVER_LOCATION + taskname,
        StartTime: time_stopstart,
        IsProductiveTime: String(req.body.productivetime) === "0" ? 0 : 1,
        StopTime: "",
        Duration: ""
    });
    tdModel.save().then(result => {
        res.json(prettyDisplayLog(result));
    }).catch(err => { res.status(500).json({ error: err }); });
}

function stopTask(req, res) { // Stops the Last TimeEvent
    var time_stopstart = Date.now() / 1000;
    TimeDictionaryModel.find().sort({ _id: -1 }).limit(1).exec().then(docs => {
        if (docs.length > 0 && docs[0].StopTime.length == 0) {
            TimeDictionaryModel.update({ _id: docs[0]._id }, { $set: { StopTime: time_stopstart } }).exec();
        }
    }).catch(err => { res.status(500).json({ error: err }); });
    res.status(200).json({ status: "OK" });
}

function deleteAllTask(req, res) { // Delete Everything
    TimeDictionaryModel.find().sort({ _id: -1 }).limit(1).exec().then(docs => {
        if (docs.length > 0) {
            TimeDictionaryModel.collection.drop();
        }
        res.status(200).json({ status: "OK" });
    }).catch(err => { res.status(500).json({ error: err }); });
}
function getAllTask(req, res) {
    var taskname = '';
    if (typeof req.body.name !== 'undefined') {
        taskname = req.body.name;
    } else if ((typeof req.params.name !== 'undefined') && (String(req.params.name).toLowerCase() !== "summary") && (String(req.params.name).toLowerCase() !== "summary/")) {
        taskname = req.params.name;
    } 
    FinalReport = []; //
    CompleteReport = []; //
    TotalDuration = 0; //
    HourData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    DayData = { 'DayTotal': 0, 'HoursTotal': HourData }; //Different Day Total/Hour Total Different
    LastSevenDays = [cloneInefficently(DayData),cloneInefficently(DayData),cloneInefficently(DayData),cloneInefficently(DayData),cloneInefficently(DayData),cloneInefficently(DayData),cloneInefficently(DayData)];//DEEP COPY OF DAY DATA
    taskAllTime=0;
    TimeDictionaryModel.find().sort({ _id: -1 }).limit(100).exec().then(docs => {
    // for (a in ):
        if (docs.length > 0) {
            for (var key in docs) {
                // skip loop if the property is from prototype
                if (!docs.hasOwnProperty(key)) continue;
                var obj = docs[key];
                var loggedData=prettyDisplayLog(obj);
                CompleteReport.push(loggedData);
                var stopN
                if (obj.StopTime.length > 0){
                    stopN=Number(obj.StopTime);
                }else{
                    stopN=Date.now() / 1000;
                }
                newTime=Number(stopN)-Number(obj.StartTime);
                taskAllTime=taskAllTime+newTime;
                console.log(taskAllTime);
                
                if (String(obj.TaskName).toLowerCase()===String(taskname).toLowerCase()){
                    FinalReport.push(loggedData);
                    var startTime=Number(obj.StartTime);
                    var stopTime='';
                    if (obj.StopTime.length > 0){
                        stopTime=Number(obj.StopTime);
                    }else{
                        stopTime=Date.now() / 1000;
                    }
                    
                    var timeexpenditure = stopTime - startTime;
                    TotalDuration += timeexpenditure;
                    var startDayAgo = prettyDayElapsed(Date.now()/1000 - startTime)-1;
                    var stopDayAgo = prettyDayElapsed(Date.now()/1000 - stopTime) - 1;
                    if (startDayAgo <7){
                        if (startDayAgo==stopDayAgo){
                            LastSevenDays[startDayAgo]['DayTotal']+=timeexpenditure;
                            
                        }
                    }
                    console.log((LastSevenDays));
                }
                
                // console.log(taskname);
            }
            if (FinalReport.length>0){
                res.json({"Data":FinalReport,"LastSevenTotal":LastSevenDays});
            }else{
                res.json({"Data":CompleteReport,"TotalTime":prettyTimeElapsed(taskAllTime)});
            }
            
        } else {
            res.json({ Error: "Nothing to retrieve! Use POST to add first TimeEvent" });
        }
    }).catch(err => { res.status(500).json({ error: err }); });
}
router.post('/', (req, res) => newTask(req, res)); // Create Tracker
router.post('/:name', (req, res) => newTask(req, res)); // Name of Tracker To Create
router.get('/', (req, res) => getTask(req, res)); //Retrieve Tracker
router.get('/:name', (req, res) => getTask(req, res)); //Name of Tracker to Retrieve
router.put('/', (req, res) => stopTask(req, res)); // Stop Tracker
router.put('/:name', (req, res) => stopTask(req, res)); // Stop Tracker
router.delete('/', (req, res) => deleteAllTask(req, res)); // Delete Everything
router.delete('/:name', (req, res) => deleteAllTask(req, res)); // Name will be ignored. All Trackers will be destroyed!
router.get('/summary/:name', (req, res) => getAllTask(req, res)); // Name will be ignored. All Trackers will be destroyed!
router.get('/new/:name', (req, res) => newTask(req, res)); // Name will be ignored. All Trackers will be destroyed!
router.get('/stop/:name', (req, res) => stopTask(req, res)); // Name will be ignored. All Trackers will be destroyed!
module.exports = router;