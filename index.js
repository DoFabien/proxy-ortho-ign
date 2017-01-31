var express = require('express');
var compression = require('compression');
var cors = require('cors');
var request = require('request');
var fs = require('fs');
var path = require('path');
var sharp = require('sharp');
var app = express();
var cron = require('node-cron');



app.use(cors());
app.use(compression());

cron.schedule('0,30 * * * *', function () { // on supprime le cache toute les 30 minutes
    fs.readdir('cache/', function (err, files) {
        files.forEach(function (file, index) {
            fs.unlink(path.join('cache/', file));
        })
     })
});


let ApiKey = '7w0sxl9imubregycnsqerliz';

app.get('/:z/:x/:y', function (req, res) {
    var p = req.params;

    if (p.z < 20) {
        let orthoIgn = 'https://gpp3-wxs.ign.fr/' + ApiKey +
            '/wmts?LAYER=ORTHOIMAGERY.ORTHOPHOTOS&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&&TILEMATRIX='
            + p.z + '&TILECOL=' + p.x + '&TILEROW=' + p.y;

        let options = {
            url: orthoIgn,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.100 Safari/537.36',
                'Referer': 'dogeo.fr'
            }
        };
        let x = request(options)
        req.pipe(x)
        x.pipe(res)
    }

    else if (p.z >= 20) {
        var factor = (p.z - 19) * 2;
        var ob = { z: 19, x: parseFloat(p.x) / factor, y: parseFloat(p.y) / factor }
        var left = (ob.x - Math.floor(ob.x)) * 256;
        var top = (ob.y - Math.floor(ob.y)) * 256;

        var tile19Path = 'cache/' + 19 + '-' + Math.floor(ob.x) + '-' + Math.floor(ob.y)+'.jpg';

        if (fs.existsSync(tile19Path)) { // => dans le cache
            fs.readFile(tile19Path, (err, buffer) => {
                serveResizeTile(buffer, left, top, factor, res);
            })


        }
        else {
            let orthoIgn = 'https://gpp3-wxs.ign.fr/' + ApiKey +
                '/wmts?LAYER=ORTHOIMAGERY.ORTHOPHOTOS&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&&TILEMATRIX='
                + 19 + '&TILECOL=' + Math.floor(ob.x) + '&TILEROW=' + Math.floor(ob.y);

            let options = {
                url: orthoIgn,
                encoding: 'binary',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.100 Safari/537.36',
                    'Referer': 'dogeo.fr'
                }
            };

            request(options, function (error, response, body) {
                var buffer = Buffer.from(body, 'binary');
                fs.writeFile(tile19Path, buffer, { encoding: 'binary' }, (err) => {
                })
                serveResizeTile(buffer, left, top, factor, res);

            })
        }


    }
    else {
        res.status(404).send('Not found')
    }

});


function serveResizeTile(buffer, left, top, factor, res) {
    sharp(buffer)
        .extract({ left: left, top: top, width: 256 / factor, height: 256 / factor })
        .resize(256)
        .toBuffer()
        .then(data => {
            res.contentType('jpeg')
            res.end(data, 'binary');
        })
        .catch(err => {
            res.status(404).send('Not found')
        });
}

app.listen(6082);