const cron = require("cron");
const fs = require('fs');
const exec = require('child_process').exec;
console.log("Start request app");
console.log(Date());

var requestCronJob;
// command = "python " + __dirname + "/updateInputRegisters.py > "+ __dirname + "/updateRegisters.log";
command = "python  /home/adappt/Documents/modbus/updateInputRegisters.py > "+ __dirname + "/updateRegisters.log";
requestCronJob = cron.job("0 */1 * * * *", function() {
     exec(command, function(error, stdout, stderr) {
        if (error == null) {
            console.log("Success updating file at ",Date());
        } else {
                console.log("Error updating file at", Date());
        }
     })
});
requestCronJob.start();