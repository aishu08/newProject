process.env.TZ = 'Asia/Kolkata';
var cron = require('cron');

var nodemailer = require('nodemailer');
var SMTPTransport = require("nodemailer-smtp-transport")
const path = require('path');
const util = require('util');
const exec = require('child_process').exec;

var smtpTransport = nodemailer.createTransport(SMTPTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'info@arraystorm.com',
        pass: 'arraystorm@2016'
    }
}));
var cronJob = cron.job("00 59 23 * * *", function(){
    console.log("Job Started!");
    var now = new Date();
    var filename = "/home/ubuntu/occupancy_new/reports/noida-3.2-report-on-" + (now.getDate()) + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + '.pdf';
    var filename1 = "/home/ubuntu/occupancy_new/reports/pune-bolt-report-on-" + (now.getDate()) + '-' + (now.getMonth() + 1) + '-' + now.getFullYear() + '.pdf';
    var url1 = `http://barclays.adapptonline.com/reports/index_pune.html?sday=${now.getDate()}&smonth=${(now.getMonth() + 1)}&syear=${now.getFullYear()}&eday=${now.getDate()}&emonth=${(now.getMonth() + 1)}&eyear=${now.getFullYear()}` 
    var url = `http://barclays.adapptonline.com/reports/?sday=${now.getDate()}&smonth=${(now.getMonth() + 1)}&syear=${now.getFullYear()}&eday=${now.getDate()}&emonth=${(now.getMonth() + 1)}&eyear=${now.getFullYear()}` 
    var child = exec("phantomjs /home/ubuntu/occupancy_new/rasterize.js '" + url + "' " + filename + ' A4', function (error, stdout, stderr) {
        var child1 = exec("phantomjs /home/ubuntu/occupancy_new/rasterize.js '" + url1 + "' " + filename1 + ' A4', function (error, stdout, stderr) {
            console.log(error, stdout, stderr)
            var mailOptions = {
                from: "Adappt info <info@arraystorm.com>",
                to: 'rajiv.sharma3@barclays.com, anant.kulkarni@barclays.com, jeremy.yew@barclays.com, kongchuan.yu@barclays.com, rajendra.phand@barclays.com',
                cc: "govardhan@arraystorm.com, akshay.davasam@arraystorm.com, amith@arraystorm.com",
                subject: 'Barclays occupancy daily report',
                html: '<html>\
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
                                                            Barclays occupancy daily report\
                                                        </h2>\
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
        </html>',
                attachments: [
                    {
                        filename: path.basename(filename),
                        contentType: 'application/pdf',
                        path: filename
                    },
                    {
                        filename: path.basename(filename1),
                        contentType: 'application/pdf',
                        path: filename1
                    }
                ]
            };
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                }else{
                    console.log("Done");
                }
            });
        });
    })
});
cronJob.start();