var tress = require('tress');
var needle = require('needle');
var cheerio = require('cheerio');
var resolve = require('url').resolve;
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var saleRegex = new RegExp("sale-[0-9]+");
var dataRegex = new RegExp("var.+= ({(.|\n)+});");

var db = new sqlite3.Database('data.sqlite');
var results = [];
var httpOptions = {};

var callback = function(url)
{
	process.stdout.write(".");
}

var saleCallback = function(url)
{
    process.stdout.write(",");
}

var createTableQuery = "CREATE TABLE IF NOT EXISTS data (projectId TEXT,projectName TEXT,projectType TEXT,projectLocation TEXT,projectQuotation TEXT,projectDate TEXT,projectAdditionalInfo TEXT,projectFactorLanPass TEXT,projectFinalPrice TEXT,projectPromo TEXT,projectLat TEXT,projectLng TEXT,programName TEXT,productNumber TEXT,productPrice TEXT,productBeds TEXT,productBaths TEXT,productFloors TEXT,productOrientation TEXT,productType TEXT,productUsefulSurface TEXT,productSurface TEXT,productTerraceSurface TEXT)";
var insertQuery = "INSERT INTO data (projectId ,projectName ,projectType ,projectLocation ,projectQuotation ,projectDate ,projectAdditionalInfo ,projectFactorLanPass ,projectFinalPrice ,projectPromo ,projectLat ,projectLng ,programName ,productNumber ,productPrice ,productBeds ,productBaths ,productFloors ,productOrientation ,productType ,productUsefulSurface ,productSurface ,productTerraceSurface) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

var sCookies = "https://www.portalinmobiliario.com/";

var areaLinks = new Array();
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/colina-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/la-reina-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/puente-alto-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/buin-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/coquimbo-coquimbo");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/la-serena-coquimbo");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/penalolen-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/rancagua-bernardo-ohiggins");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/lo-barnechea-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/san-pedro-de-la-paz-biobio");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/machali-bernardo-ohiggins");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/san-bernardo-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/temuco-la-araucania");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/la-florida-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/lampa-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/colina-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/la-reina-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/puente-alto-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/buin-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/coquimbo-coquimbo");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/la-serena-coquimbo");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/penalolen-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/rancagua-bernardo-ohiggins");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/lo-barnechea-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/san-pedro-de-la-paz-biobio");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/machali-bernardo-ohiggins");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/san-bernardo-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/temuco-la-araucania");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/la-florida-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/venta/casa/lampa-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/nunoa-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/providencia-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/san-miguel-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/las-condes-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/santiago-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/concepcion-biobio");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/vina-del-mar-valparaiso");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/antofagasta-antofagasta");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/vitacura-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/estacion-central-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/concon-valparaiso");
areaLinks.push("https://www.portalinmobiliario.com/venta/departamento/macul-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/nunoa-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/providencia-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/san-miguel-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/las-condes-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/santiago-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/concepcion-biobio");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/vina-del-mar-valparaiso");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/antofagasta-antofagasta");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/vitacura-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/estacion-central-metropolitana");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/concon-valparaiso");
areaLinks.push("https://www.portalinmobiliario.com/venta/casa/macul-metropolitana");


var scrapeLot = function(res)
{
    // var $ = cheerio.load(fs.readFileSync("somepage.html"));
    var $ = cheerio.load(res.body);

    $("script").filter(function(){
        var innerText = $(this).html();
        return innerText.indexOf("var PageOpts = ") >= 0;
    }).each(function(){
        var innerText = $(this).html();

        var lat = innerText.match(/ lat: (([\.0-9]|-)+)/)[1];
        var lng = innerText.match(/ lng: (([\.0-9]|-)+)/)[1];

        if(innerText.indexOf("IdProyecto") > 0)
        {
            var jsonStart = innerText.indexOf("{", innerText.indexOf("};"));
            var jsonEnd = innerText.indexOf("};", jsonStart)+1;
            var jsonString = innerText.substring(jsonStart, jsonEnd);

            var json = JSON.parse(jsonString); //JSON.parse("["+json1String+","+json2String+"]");

            var project = new Array();

            project.push(json["IdProyecto"]); //project id
            project.push(json["NombreProyecto"]); //project name
            project.push(json["TipoProyecto"]); //project type
            project.push(json["DireccionProyecto"]); //project location

            project.push(json["Cotizacion"]); //quotation
            project.push(json["MonedaPublicacionProyecto"]["FechaBase"]); //date
            project.push(json["MonedaPublicacionProyecto"]); // additional info
            project.push(json["FactorLanPass"]); //factorlanpass
            project.push(json["ValorHasta"]); //final price;
            project.push(json["PromoFactorLanPass"]); //promo
            project.push(lat); //latitude
            project.push(lng); //longitude

            json["Programas"].forEach(function(jsonProgram){
                var program = new Array();
                program.push(jsonProgram["Nombre"]); //program name

                jsonProgram["Productos"].forEach(function(jsonProduct){
                    var product = new Array();
                    product.push(jsonProduct["Numero"]); //product number
                    product.push(jsonProduct["Precio"]); //product price
                    product.push(jsonProduct["Dormitorios"]); //product beds
                    product.push(jsonProduct["Banos"]); //product baths
                    product.push(jsonProduct["Piso"]); //product floors
                    product.push(jsonProduct["Orientacion"]); //product orientation
                    product.push(jsonProduct["Tipo"]); //product type
                    product.push(jsonProduct["SuperficieUtil"]); //product useful surface
                    product.push(jsonProduct["SuperficieTotal"]); //product surface
                    product.push(jsonProduct["SuperficieTerraza"]); //product terrace surface
                    
                    var result = new Array();
                    var pushToResult = function(prop){
                        result.push(prop);
                    }
                    project.forEach(pushToResult);
                    program.forEach(pushToResult);
                    product.forEach(pushToResult);

                    db.serialize(function(){
                        db.run(createTableQuery);
                        var stmt = db.prepare(insertQuery);
                        stmt.run(result);
                        stmt.finalize();
                    });
                });
            });
        }else{

            var result = [];
            function pushEmpty(n)
            {
                for(var i=0;i<n;i++)
                {
                    result.push("");
                }
            }

            pushEmpty(1);
            $("[itemprop=\"address\"]").each(function(){
                var address = $(this).text().trim().replace("\n", "");
                result.push(address);
                return false;
            });
            pushEmpty(8);
            result.push(lat);
            result.push(lng);
            pushEmpty(2);

            $(".price-real").each(function(){
                var price = $(this).text();
                result.push(price);
            });

            $(".data-sheet-column-programm").each(function(){
                var bedBaths = $(this).find(":contains('Dormitorios')").text();
                var match = bedBaths.match(/(\d+)/gi);
                var beds = match[0];
                var baths = match[1];
                result.push(beds);
                result.push(baths);
            });
            pushEmpty(3);

            $(".data-sheet-column-area").each(function(){
                var area = $(this).find("p").text();
                result.push(area);
            });
            pushEmpty(2);
            db.serialize(function(){
                        db.run(createTableQuery);
                        var stmt = db.prepare(insertQuery);
                        stmt.run(result);
                        stmt.finalize();
                    });
        }
    });
   
}


var scrapePaginator = function(res)
{
    var $ = cheerio.load(res.body);
    var totalPages = 1;
    var pageLink = "";

    $(".pagination-right [href]").each(function(){
        var attr = $(this).attr("href");
        
        var page = attr.substring(attr.indexOf("&pg=")+4);
        pageLink = "https://www.portalinmobiliario.com"+attr.substring(0,attr.indexOf("&pg=")+4);

        if(totalPages < page)
        {
            totalPages = page;
        }
    });

    console.log("total pages: "+totalPages);
    for(var i=1;i<=totalPages;i++)
    {
        q.push(pageLink+i);
    }
}

var crawl = function(link, callback)
{
    needle.get(link, httpOptions, function(err, res){
        if (err || res.statusCode !== 200)
        {
            console.log((err || res.statusCode) + ' - ' + link);
            return callback(true);
        }

        if(link == sCookies)
        {
            setCookies(res);
            callback();
            return;
        }

        if(link.indexOf("&") == -1)
        {
            scrapePaginator(res);
            callback();
            return;
        }

        if(link.indexOf("tp=") != -1)
        {
            try{
                scrapeLot(res);
            }catch(error)
            {
                console.error(error);
                fs.writeFileSync("error.html", res.body);
            }
            callback();
            return;
        }

        var $ = cheerio.load(res.body);
        $(".product-item-summary [href]").each(function(){
            var attr = $(this).attr("href");
            var lotLink = "https://www.portalinmobiliario.com"+attr;
            q.unshift(lotLink);
        })
        saleCallback(link);        
        callback();
    })
};


var setCookies = function(res)
{
    // устанавливаем куки
    httpOptions.cookies = res.cookies;
    console.log("cookies set");
}
  
var q = tress(crawl, 10); // запускаем 10 параллельных потоков

q.drain = function(){
    console.log("completed");
}

q.retry = function(){
    q.pause();
    // в this лежит возвращённая в очередь задача.
    console.log('Paused on:', this);
    setTimeout(function(){
        q.resume();
        console.log('Resumed');
    }, 300000); // 5 минут
}

areaLinks.forEach(function(link)
{
    q.push(link);
    
});

