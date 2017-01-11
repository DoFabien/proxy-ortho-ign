var express = require('express');
var compression = require('compression');
var cors = require('cors');
var request = require('request');
var sharp = require('sharp');
var app = express();


app.use(cors());
app.use(compression());

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

        var left = (ob.x - Math.floor(ob.x)) * 256;
        var top = (ob.y - Math.floor(ob.y)) * 256;

        request(options, function (error, response, body) {
            var buffer = Buffer.from(body, 'binary');
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
        })
    }
    else {
        res.status(404).send('Not found')
    }

});
app.listen(6082);