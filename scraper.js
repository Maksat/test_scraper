var tress = require('tress');
var needle = require('needle');
var cheerio = require('cheerio');
var resolve = require('url').resolve;
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var saleRegex = new RegExp("sale-[0-9]+");
var postedOnRegex = new RegExp("^Posted.+");

var results = [];

class Sale{
	get postDate(){ return this._postDate; }
	set postDate(val){ this._postDate = val; }

	get saleId(){ return this._saleId; }
	set saleId(val){ this._saleId = val; }

	get price(){ return this._price; }
	set price(val){ this._price = val; }

	get link(){ return this._link; }
	set link(val){ this._link = val; }

	get site(){ return this._site; }
	set site(val){ this._site = val; }

	get location(){ return this._location; }
	set location(val){ this._location = val; }

	get propertyType(){ return this._propertyType; }
	set propertyType(val){ this._propertyType = val; }

	get pricePerUnit(){ return this._pricePerUnit; }
	set pricePerUnit(val){ this._pricePerUnit = val; }

	get builtUp(){ return this._builtUp; }
	set builtUp(val){ this._builtUp = val; }
	
	get landArea(){ return this._landArea; }
	set landArea(val){ this._landArea = val; }

	get furnishing(){ return this._furnishing; }
	set furnishing(val){ this._furnishing = val; }
	
	get bedrooms(){ return this._bedrooms; }
	set bedrooms(val){ this._bedrooms = val; }

	get bathrooms(){ return this._bathrooms; }
	set bathrooms(val){ this._bathrooms = val; }

	get parking(){ return this._parking; }
	set parking(val){ this._parking = val; }

	toString()
	{
		return 	this.postDate+"\t"+
				this.saleId+"\t"+
				this.price+"\t"+
				this.link+"\t"+
				this.site+"\t"+
				this.location+"\t"+
				this.propertyType+"\t"+
				this.pricePerUnit+"\t"+
				this.builtUp+"\t"+
				this.landArea+"\t"+
				this.furnishing+"\t"+
				this.bedrooms+"\t"+
				this.bathrooms+"\t"+
				this.parking;
	}
}

var callback = function(url)
{
	console.log("Finished: "+url);
}

var q = tress(function(url, callback){
	needle.get(url, function(err, res){
		if (err) throw err;

        // парсим DOM
        var $ = cheerio.load(res.body);
        // var $ = cheerio.load(fs.readFileSync("page.html"));


        var getPostedOn = function(sale)
        {
        	var date;

			$(sale).find("p").filter(function(){
        		var text = $(this).text();
        		return postedOnRegex.test(text);
        	}).each(function()
        	{
        		date = $(this).text();

        		var match = date.match(/Posted( on)* (.+)/);
        		date = match[2];
        		var options = { day: 'numeric', month: 'short', year: 'numeric' };

        		var d = new Date();
        		var today = d.toLocaleDateString("en-US", options);
        		d.setDate(d.getDate() - 1);
        		var yesterday = d.toLocaleDateString("en-US", options);


        		date = new Date(date.replace("yesterday", yesterday).replace("today", today));
        	});

        	return date;
        }

        var getSaleId = function(sale)
        {
        	var saleClass = $(sale).attr("class");
        	var match = saleClass.match(/-([0-9]+) /);
        	var saleId = match[1];        	
        	return saleId;
        }

        var getPrice = function(sale)
        {
        	var price;

        	$(sale).find('.listing-primary-price-item').each(function(){
        		price = $(this).text();
        	});
        	return price;
        }

        var getLink = function(sale)
        {
        	var link;
        	$(sale).find("a").each(function(){
        		link = $(this).attr("href");
        		return false;
        	});
        	return link;
        }

        var getSite = function(sale)
        {
        	var site;

        	$(sale).find("h3").each(function(){
        		site = $(this).text();
        	});
        	return site;
        }

        var getLocation = function(sale)
        {
        	var location;
        	$(sale).find("h3").each(function(){
        		location = $(this).parent().next().text();
        	});
        	return location;
        }

        var getPropertyType = function(sale)
        {
        	var propertyType;
        	$(sale).find("h3").each(function(){
        		var div = $(this).parent().parent().parent().next();
        		div.find("a").each(function()
        		{
        			propertyType = $(this).text();
        			return false;
        		});
        		return false;
        	});
        	return propertyType;
        }

        var getBuiltUp = function(sale)
        {
        	var pricePerUnit;
        	$(sale).find(".builtUp-attr").each(function(){

        		pricePerUnit = $(this).find(".attrs-price-per-unit-desktop").text();
        		if(pricePerUnit)
        		{
        			var match = pricePerUnit.match(/ [0-9]+(,[0-9]+)*/);
        			pricePerUnit = match[0].trim();
        		}
        		return false;
        	});
        	return pricePerUnit;
        }

        var getLandArea = function(sale)
        {
        	var landArea;
        	$(sale).find(".landArea-attr").each(function(){
        		landArea = $(this).find(".attrs-price-per-unit-desktop").text();
        		return false;
        	});        	
        	return landArea;
        }

        var getFurnishing = function(sale)
        {
        	var furnishing;
        	$(sale).find(".furnishing-attr").each(function(){
        		furnishing = $(this).find(".attrs-price-per-unit-desktop").text();
        		return false;
        	});
        	return furnishing;
        }

        var getBedrooms = function(sale)
        {
        	var bedrooms;
        	$(sale).find(".bedroom-facility").each(function(){
        		bedrooms = $(this).text();
        	});
        	
        	return bedrooms;
        }

        var getBathrooms = function(sale)
        {
        	var bathrooms;
        	$(sale).find(".bathroom-facility").each(function(){
        		bathrooms = $(this).text();
        	});
        	return bathrooms;
        }

        var getParking = function(sale)
        {
        	var parking;
        	$(sale).find(".carPark-facility").each(function(){
        		parking = $(this).text();
        	});
        	return parking;
        }

        var parseSale = function(index, li)
        {
        	var sale = new Sale();

        	sale.postDate = getPostedOn(li);
        	sale.saleId = getSaleId(li);
        	sale.price = getPrice(li);
        	sale.link = getLink(li);
        	sale.site = getSite(li);
        	sale.location = getLocation(li);
        	sale.propertyType = getPropertyType(li);
        	sale.builtUp = getBuiltUp(li);
        	sale.landArea = getLandArea(li);
        	sale.furnishing = getFurnishing(li);
        	sale.bedrooms = getBedrooms(li);
        	sale.bathrooms = getBathrooms(li);
        	sale.parking = getParking(li);

        	results.push([sale.postDate.toString(), sale.saleId, sale.price, sale.link, sale.site, sale.location, sale.propertyType, sale.builtUp, sale.landArea, sale.furnishing, sale.bedrooms, sale.bathrooms, sale.parking]);
        }

        $("li").filter(function(){
        	var className = $(this).attr("class");
        	return saleRegex.test(className);
        }).each(parseSale);

         callback(url);
    });
}, 10); // запускаем 10 параллельных потоков

q.drain = function(){
	fs.appendFileSync('./data.json', results.join("\n"));//JSON.stringify(results, null, 4));

	var db = new sqlite3.Database('data.sqlite');
    db.serialize(function(){
        // db.run('DROP TABLE IF EXISTS data');
        db.run("CREATE TABLE IF NOT EXISTS data (postDate TEXT, saleId TEXT, price TEXT, link TEXT, site TEXT, location TEXT, propertyType TEXT, pricePerUnit TEXT, builtUp TEXT, landArea TEXT, furnishing TEXT, bedrooms TEXT, bathrooms TEXT, parking TEXT)");
        var stmt = db.prepare('INSERT INTO data (postDate, saleId, price, link, site, location, propertyType, pricePerUnit, builtUp, landArea, furnishing, bedrooms, bathrooms, parking) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        for (var i = 0; i < results.length; i++) {
            stmt.run(results[i]);
        };
        stmt.finalize();
        db.close();
    });
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





