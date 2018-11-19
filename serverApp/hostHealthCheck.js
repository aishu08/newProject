process.env.TZ = 'Asia/Kolkata';
var cron = require('cron');
var mongoose = global.mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var FloorModel = require('./models/floors');
var HostModel = require('./models/hosts');
var HostLogs = require('./models/hostLogs');

var nodemailer = require('nodemailer');
var SMTPTransport = require("nodemailer-smtp-transport")
var smtpTransport = nodemailer.createTransport(SMTPTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'info@arraystorm.com',
        pass: 'arraystorm@2016'
    }
}));
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://root:adapptroot@localhost/occupancy?authSource=admin', function (err) {
    if (err)
        console.log("Failed to establish a connection to Mongo DB");
    else {
        console.log("Connection established to Mongo DB");
    }
});

var mailOptions = {
        from: "Adappt info <info@arraystorm.com>",
        to: 'rajiv.sharma3@barclays.com, rajendra.phand@barclays.com',
        cc: 'govardhan@arraystorm.com,akshay.davasam@arraystorm.com',
        subject: 'Barclays Host status update',
        html: ''
    }
var cronJob = cron.job("0 */30 * * * *", function(){

    mailOptions.html = '<html>\
    <head>\
        <meta charset="utf-8">\
        <meta http-equiv="X-UA-Compatible" content="IE=edge">\
        <title></title>\
        <link rel="stylesheet" href="">\
    </head>\
    <body>\
        <header id="header" class="">\
        </header>\
        <content>\
            <div style="background:#f9f9f9;color:#373737;font-family:Helvetica,Arial,sans-serif;font-size:17px;line-height:24px;max-width:100%;width:100%!important;margin:0 auto;padding:0">\
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;line-height:24px;margin:0;padding:0;width:100%;font-size:17px;color:#373737;background:#f9f9f9">\
                    <tbody>\
                        <tr>\
                            <td valign="top" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">\
                                    <tbody>\
                                        <tr>\
                                            <td valign="bottom" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse;padding:20px 16px 12px">\
                                                <div style="text-align:center">\
                                                    <a href="#" style="color:#439fe0;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank" data-saferedirecturl="#">\
                                                    <img src="http://barclaysdemo.adapptonline.com/img/adappt.png" width="150" height="56" style="outline:none;text-decoration:none;border:none" class="CToWUd"></a>\
                                                </div>\
                                            </td>\
                                        </tr>\
                                    </tbody>\
                                </table>\
                            </td>\
                        </tr>\
                        <tr>\
                            <td valign="top" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                <table cellpadding="32" cellspacing="0" border="0" align="center" style="border-collapse:collapse;background:white;border-radius:0.5rem;margin-bottom:1rem">\
                                    <tbody>\
                                        <tr>\
                                            <td width="650" valign="top" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                                <div style="max-width:650px;margin:0 auto">\
                                                    <h2 style="color:#3a3b3c;line-height:30px;margin-bottom:12px;margin:0 auto 2rem;font-size:1.8rem;text-align:center">\
                                                        Host Status Update:\
                                                    </h2>\
                                                    <h3 style="color:#3a3b3c;line-height:26px;margin-bottom:2rem;font-size:1.2rem;text-align:center;margin:0 auto 1rem">\
                                                        The hosts mentioned below need to be checked\
                                                    </h3>\
                                                        <ul style="display: inline-block;">';
    var flag = false;
    HostLogs.aggregate([
        {$group:{_id:"$hostId", lastResponseTime: {$max: "$lastUpdated"}}},
        {$lookup: {from:'hosts',localField: '_id',foreignField:'_id', as: 'host'}},
        {$unwind:"$host"},{$project:{hostName: "$host.name", floorId: "$host.floorId", lastResponseTime: "$lastResponseTime"}},
        {$lookup: {from:"floors", localField: "floorId", foreignField:"_id", as: "floor"}}, {$unwind: "$floor"}
    ], function(err, hosts){
        hosts.forEach(function(host){
            var now = new Date().getTime()
            var halfHourBefore = now - 1800000;
            var hostTime = new Date(host.lastResponseTime).getTime();
            var notResponding = []
            if(hostTime <= halfHourBefore)
            {
                flag = true;
                mailOptions.html += '<li><b>' + host.hostName + '</b></li>'
                mailOptions.html += '<ul style="display: inline-block;"><li> Floor: <b>' + host.floor.name + '</b></li>'
                mailOptions.html += '<li> Last Response Time: <b>' + host.lastResponseTime + '</b></li></ul><br/><br/>'
            }
        })
        mailOptions.html += '                           </ul>\
                                                    </div>\
                                                </td>\
                                            </tr>\
                                        </tbody>\
                                    </table>\
                                </td>\
                            </tr>\
                            <tr>\
                                <td style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse">\
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin-top:1rem;background:white;color:#989ea6">\
                                        <tbody>\
                                            <tr>\
                                                <td style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse;height:5px;background-image:url("#");background-repeat:repeat-x;background-size:auto 5px"></td>\
                                            </tr>\
                                            <tr>\
                                                <td valign="top" align="center" style="font-family:Helvetica,Arial,sans-serif!important;border-collapse:collapse;padding:16px 8px 24px">\
                                                    <div style="max-width:600px;margin:0 auto">\
                                                        <p style="font-size:12px;line-height:20px;margin:0 0 16px;margin-top:16px">\
                                                            Made by <a href="www.adappt.com" style="color:#439fe0;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank" data-saferedirecturl="www.adappt.com">Adappt Intelligence</a><br/>\
                                                            <a href="www.adappt.com" style="color:#439fe0;font-weight:bold;text-decoration:none;word-break:break-word;text-align: center;" target="_blank" data-saferedirecturl="www.adappt.com" >\
                        All Rights Reserved by &copy; Adappt </a>\
                                                        </p>\
                                                    </div>\
                                                </td>\
                                            </tr>\
                                        </tbody>\
                                    </table>\
                                </td>\
                            </tr>\
                        </tbody>\
                    </table>\
                </div>\
            </content>\
        </body>\
    </html>';
        if(flag)
        {
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                }else{
                    console.log("Done");
                }
            });
        }
        else
        {
            console.log("All hosts active")
            //console.log(hosts)
        }
    })
})
cronJob.start();