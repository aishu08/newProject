var router = global.express.Router();
var fs = require('fs');
var http = require('http');
var pool = global.pool;
var vpnCertificate = require('../models/vpn.js');
const exec = require('child_process').exec;
var path = require("path");
var nodemailer = require('nodemailer');
var SMTPTransport = require("nodemailer-smtp-transport");
var smtpTransport = nodemailer.createTransport(SMTPTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'info@arraystorm.com',
        pass: 'arraystorm@2016'
    }
}));


var sortAlphaNumrevIpaddress = function(a, b) {
    aa = a.ipAddress.split(".");
    bb = b.ipAddress.split(".");
    var resulta = aa[0] * 0x1000000 + aa[1] * 0x10000 + aa[2] * 0x100 + aa[3] * 1;
    var resultb = bb[0] * 0x1000000 + bb[1] * 0x10000 + bb[2] * 0x100 + bb[3] * 1;

    return resultb - resulta;
}


router.get('/getCertificate', function(req, res, next) {
    vpnCertificate.find({ status: true }, function(err, details) {
        if (!err) {
            res.status(200).json(details)
        } else {
            res.status(400).json({ err })
        }
    })
})

router.post('/script', function(req, res, next) {
    var data = req.body;
    var newipa;
    vpnCertificate.findOne({ name: data.certificateName }, function(err, vpnData) {
        if (vpnData) {
            res.status(400).json({ err: "Data already present" });
        } else {
            exec('sh /home/aishwarya/test.sh create ' + data.certificateName, function(err, stdout, stdErr) {
                if (stdout) {
                    var condition = {};
                    if (data.type == "host") {
                        condition = { name: /^((?!demo).)*$/, type: "host", status: "true" };
                    } else if (data.type == "pcs") {
                        condition = { type: "pcs", status: "true" };
                    }
                    vpnCertificate.find(condition, { ipAddress: 1 }, function(err, result) {

                        var value = result.sort(sortAlphaNumrevIpaddress) //ip address in descending order 
                        var ipValue = value[0].ipAddress
                        var ipasplit = ipValue.split("."); //auto increment of ip address
                        ipasplit[3]++;
                        if (ipasplit[3] > 255) {
                            ipasplit[3] = 0;
                            ipasplit[2]++;
                        }
                        if (ipasplit[2] > 255) {
                            ipasplit[2] = 0;
                            ipasplit[1]++;
                        }
                        if (ipasplit[1] > 255) {
                            ipasplit[1] = 0;
                            ipasplit[0]++;
                        }
                        newipa = ipasplit.join(".") //new ip address
                        var cmd = 'echo Aishwarya123 | sudo -S echo "ifconfig-push ' + newipa + ' 10.8.0.1" > ' + data.certificateName;
                        console.log(cmd)
                        exec(cmd, function(err, stdout, stdErr) {
                            console.log("hgjhgjh");
                            if (!err) {
                                exec('echo Aishwarya123 | sudo -S mv ' + data.certificateName + ' /etc/openvpn/static_clients/', function(err, stdout, stdErr) {
                                    var vpnData = new vpnCertificate({
                                        name: data.certificateName,
                                        ipAddress: newipa,
                                        status: "true",
                                        type: data.type
                                    });
                                    vpnData.save(function(err, doc) {
                                        if (!err)
                                            res.status(200).json({ msg: "Done" });
                                        else
                                            res.status(500).json(err)
                                    })
                                })
                            } else {
                                console.log("error", err, stdErr)
                            }
                        })
                    })

                } else {
                    res.status(400).json({ err })
                }


            });


        }
    })
})



router.post('/deletion', function(req, res, next) {
    data = req.body
    console.log("data", data)
    exec('sh /home/aishwarya/test.sh revoke ' + data.certificateName, function(err, stdout, stdErr) {
        if (stdout) {

            vpnCertificate.findOneAndUpdate({ _id: data.id }, { status: false }, function(err, update) {
                    if (update) {
                        console.log("updateeeeed")
                        res.status(200).json(update);
                    } else {
                        res.status(500).json(err);
                    }
                }

            )

        }
    })
})


router.get('/download/:name', function(req, res, next) {
    var file = req.params.name + ".ovpn"
    filePath = "/home/aishwarya/client-configs/files/";
    fs.exists(filePath, function(exists) {
        if (exists) {
            res.writeHead(200, {
                "Content-Type": "application/octet-stream",
                "Content-Disposition": "attachment; filename=" + file
            });
            fs.createReadStream(filePath + file).pipe(res);

        } else {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("ERROR File does NOT Exists.ipa");
        }
    });

});


router.post('/emailCertificate', function(req, res, next) {
    value = req.body
    var filename = "/home/aishwarya/client-configs/files/" + value.name + ".ovpn"
    var file = value.name + ".ovpn"
    fs.readFile(filename, function(err, data) {
        var mailOptions = {
            from: "Adappt info <info@arraystorm.com>",
            to: value.emailid,
            subject: 'certificate',
            attachments: [{
                'filename': file,
                'content': data
            }]
        }
        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                console.log("Mail error")
                console.log(error);
            } else {
                console.log("Done");
                res.status(200).json({ msg: "Sent successfully" });
            }
        });
    });
})




module.exports = router;