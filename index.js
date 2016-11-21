var express = require('express');
var compression = require('compression');
var cors = require('cors');
var request = require('request');
var app = express();


app.use(cors());
app.use(compression());

let ApiKey = '7w0sxl9imubregycnsqerliz';

app.get('/:z/:x/:y', function (req, res) {
    var p = req.params;
    let orthoIgn = 'https://gpp3-wxs.ign.fr/' + ApiKey +
        '/wmts?LAYER=ORTHOIMAGERY.ORTHOPHOTOS&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&&TILEMATRIX='
        + p.z + '&TILECOL=' + p.x + '&TILEROW=' + p.z;


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
});
app.listen(6082);