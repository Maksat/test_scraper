var tress = require('tress');
var needle = require('needle');
var cheerio = require('cheerio');
var resolve = require('url').resolve;
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var saleRegex = new RegExp("sale-[0-9]+");

var db = new sqlite3.Database('data.sqlite');
var results = [];

var callback = function(url)
{
	console.log("Finished: "+url);
}

var saleCallback = function(url)
{
    console.log("Finished sale: "+url);
}

var crawl = function(link)
{
    needle.get(link, function(err, res){
        if(err) throw err;

        var $ = cheerio.load(res.body);
        $("script").filter(function(){
            var innerText = $(this).html();
            return innerText.indexOf("window.__INITIAL_STATE__") >= 0;
        }).each(function(){
            var innerText = $(this).html();
            var jsonStart = innerText.indexOf("{");
            var jsonEnd = innerText.lastIndexOf("}") + 1;
            var jsonString = innerText.substring(jsonStart, jsonEnd);


            var result = new Array();

            var json = JSON.parse(jsonString);
            var prices = json["detail"]["prices"][0];
            result.push(prices["type"], prices["currency"], prices["min"], prices["max"]);

            var attributes = json["detail"]["attributes"];
            result.push(attributes["bathroom"], 
                        attributes["bedroom"], 
                        attributes["carPark"], 
                        attributes["builtUp"],
                        attributes["landArea"], 
                        attributes["landTitleType"], 
                        attributes["tenure"], 
                        attributes["facingDirection"],
                        attributes["furnishing"], 
                        attributes["unitType"], 
                        attributes["occupancy"], 
                        attributes["titleType"],
                        attributes["completionDate"],
                        attributes["bumiDiscount"]
                        );

            var address = json["detail"]["address"];
            result.push(address["formattedAddress"],
                        address["lat"],
                        address["lng"],
                        address["hasLatLng"]);

            result.push(json["detail"]["isPrimary"]);
            result.push(json["detail"]["id"]);
            result.push(json["detail"]["title"]);
            result.push(json["detail"]["tier"]);
            result.push(json["detail"]["propertyType"]);
            result.push(json["detail"]["description"]);
            result.push(json["detail"]["updatedAt"]);
            result.push(json["detail"]["featureDescription"]);
            result.push(json["detail"]["referenceCode"]);
            result.push(json["detail"]["parentAddress"]);
            result.push(json["detail"]["buildingName"]);
            
            var createTableQuery = "CREATE TABLE IF NOT EXISTS data (type TEXT, currency TEXT, min TEXT, max TEXT, bathroom TEXT, bedroom TEXT, carPark TEXT, builtUp TEXT, landArea TEXT, landTitleType TEXT, tenure TEXT, facingDirection TEXT, furnishing TEXT, unitType TEXT, occupancy TEXT, titleType TEXT, completionDate TEXT, bumiDiscount TEXT, formattedAddress TEXT, lat TEXT, lng TEXT, hasLatLng TEXT, isPrimary TEXT, id TEXT, title TEXT, tier TEXT, propertyType TEXT, description TEXT, updatedAt TEXT, featureDescription TEXT, referenceCode TEXT, parentAddress TEXT, buildingName TEXT)";
            var insertQuery = "INSERT INTO data (type, currency, min, max, bathroom, bedroom, carPark, builtUp, landArea, landTitleType, tenure, facingDirection, furnishing, unitType, occupancy, titleType, completionDate, bumiDiscount, formattedAddress, lat, lng, hasLatLng, isPrimary, id, title, tier, propertyType, description, updatedAt, featureDescription, referenceCode, parentAddress, buildingName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            db.serialize(function(){
                db.run(createTableQuery);
                var stmt = db.prepare(insertQuery);
                stmt.run(result);
                stmt.finalize();
            });
            saleCallback(link);
        });
    })
};
  
var q = tress(function(url, callback){
	needle.get(url, function(err, res){
		if (err) throw err;

        // парсим DOM
        var $ = cheerio.load(res.body);
        // var $ = cheerio.load(fs.readFileSync("page.html"));


        var getLink = function(sale)
        {
        	var link;
        	$(sale).find("a").each(function(){
        		link = $(this).attr("href");
        		return false;
        	});
        	return link;
        }

        var parseSale = function(index, li)
        {
        	var link = "https://www.iproperty.com.my"+getLink(li);
            crawl(link);
        }

        $("li").filter(function(){
        	var className = $(this).attr("class");
        	return saleRegex.test(className);
        }).each(parseSale);

         callback(url);
    });
}, -10000); // запускаем 10 параллельных потоков

q.drain = function(){
	// fs.appendFileSync('./data.json', results.join("\n"));//JSON.stringify(results, null, 4));
    console.log("completed");
}

var URL = 'https://www.iproperty.com.my/sale/kuala-lumpur/all-residential/?page=';
var totalPages = 0;
needle.get(URL+1, function(err, res){
		if (err) throw err;

        var $ = cheerio.load(res.body);
		$(".ant-pagination-item").each(function(){
			totalPages = parseInt($(this).text());
		});

		console.log("total pages: "+totalPages);
        
		for(var i=1;i<totalPages;i++)
		{
			q.push(URL+i, callback);
		}
});