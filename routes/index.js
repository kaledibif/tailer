let express = require('express');
let router = express.Router();
let SSH = require('simple-ssh');
const JSONdb = require('simple-json-db');
const {encrypt,decrypt} = require("../crypto");


router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});


router.get('/server/:name', function (req, res, next) {
    const db = new JSONdb('db.json');
    let servers = db.get('servers');
    if (typeof servers === 'undefined') {
        res.send([]);
    } else {
        if (req.params.name in servers) {
            res.send(servers[req.params.name]);
        } else {
            res.send([]);
        }
    }

})
router.get('/logFiles/:name', function (req, res, next) {
    const db = new JSONdb('db.json');
    let servers = db.get('servers');
    if (typeof servers === 'undefined') {
        res.send({
            'error': 'not found'
        });
    } else {
        if (req.params.name in servers) {
            let server = servers[req.params.name];
            let ssh = new SSH({
                user: server.user,
                host: server.host,
                pass: decrypt(server.pass),
                port: server.port
            });
            ssh.on('error', function (err) {
                res.send({
                    'error': 'cannot connect!'
                });
                ssh.end();
            });

            ssh.exec('ls -hlt --full-time /var/log/httpd', {
                out: function (stdout) {
                    let files = [];
                    stdout.split('\n').forEach(item => {
                        let itemArray = item.split(/\s+/g);
                        if (itemArray.length > 6) files.push({
                            'size': itemArray[4],
                            'date': itemArray[5] + ' ' + itemArray[6] + ' ' + itemArray[7],
                            'name': '/var/log/httpd/' + itemArray[8],
                        })
                    })
                    res.send(files);
                    ssh.end();
                },
                err: function (error) {
                    res.send({
                        'error': 'ssh error'
                    });
                    console.log('error: ' + error);
                },
                exit: function () {
                    console.log(req.params.name + ' ssh exited!');
                    console.log('ssh closed');
                },
            }).start();

        } else {
            console.log('name not found');
            res.send({
                'error': 'name not found'
            });
        }
    }

})


router.get('/server', function (req, res, next) {
    const db = new JSONdb('db.json');
    let servers = db.get('servers');
    if (typeof servers === 'undefined') {
        res.send([]);
    } else {
        let servers2 = servers;
        for (let i in servers2) {
            delete servers2[i]['user'];
            delete servers2[i]['pass'];
            delete servers2[i]['port'];
        }
        res.send(servers2);
    }
})

router.delete('/server', function (req, res, next) {
    const db = new JSONdb('db.json');
    let servers = db.get('servers');
    if (typeof servers === 'undefined') {
        servers = {};
    }
    delete servers[req.body.host];
    db.set('servers', servers);
    db.sync();
    res.send(servers);
})

router.post('/server', function (req, res, next) {

    if (!(req.body.name && req.body.user && req.body.pass && req.body.host && req.body.port)) {
        res.send({'status': 'missing params'});
        return;
    }
    let ssh = new SSH({
        user: req.body.user,
        host: req.body.host,
        pass: req.body.pass,
        port: req.body.port
    });
    ssh.on('error', function (err) {
        res.send({
            'status': 'cannot connect to server'
        });
        ssh.end();
    });

    ssh.on('ready', function (err) {

        const db = new JSONdb('db.json');
        let server = {
            name: req.body.name,
            user: req.body.user,
            pass: encrypt(req.body.pass),
            host: req.body.host,
            port: req.body.port
        };

        let servers = db.get('servers');
        if (typeof servers === 'undefined') {
            servers = {};
        }

        servers[req.body.name] = server;
        db.set('servers', servers);
        db.sync();
        res.send({
            'status': 'ok'
        });
        ssh.end();
    });
    ssh.start();
});

module.exports = router;
