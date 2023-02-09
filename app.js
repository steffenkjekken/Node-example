const http = require('http');
let url = require('url');
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://testuser:golden123@gettingstarted.tuonkuh.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const hostname = '127.0.0.1';
const port = 3000;

let sendData = (res, body) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(body));
    res.end();
}

const server = http.createServer((req, res) => {
    let reqUrlString = req.url;
    let path = url.parse(reqUrlString, true).pathname;
    //console.log({reqUrlString, path});

    if (path === "/") {
        sendData (res, "Use endpoints GET /list or POST /add");
    } else if (path === "/list") {
        // Find and list all movies
        console.log ("Will list all movies");
        connectToDB(res, "list", {});
    } else if (path === "/add") {
        // Check POST data and use update one 
        // with upstream set to true 
        // to insert (or update) movie
        let method = req.method;
        if (method === "POST" || method === "PUT") {
            console.log ("Will add movie, if data object is posted correctly");
            let body = [];
            req .on('error', (err) => { console.error(err); })
                .on('data', (chunk) => { body.push(chunk); })
                .on('end', () => { 
                    body = JSON.parse(Buffer.concat(body).toString()); 
                    connectToDB(res, "add", body);
                });
        } else {
            sendData (res, "You need to use POST (or PUT) here..."); 
        }
    } else {
        // Catch all for un-recognized paths
        sendData (res, { 404: path});
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

async function connectToDB (res, method, body) {
    console.log ({method, body});
    try {
        await client.connect();
        // console.log("Connected correctly to server");
        // Connect to this database
        const db = client.db("node_testing");
        // Use this collection
        const col = db.collection("movies");
        
        // Do stuff here
        if (method === "list") {
            const query = {};
            const opt = {};
            const cursor = col.find(query, opt);
            
            let results = await cursor.toArray();
            //console.log(results);
            if (results.length > 0) {
                sendData(res, results);    
            } else {
                sendData(res, {});  
            }    
        } else if (method === "add") {
            const filter = { title: body.title };
            const movie = {
                $set: {
                    title: body.title, 
                    year: body.year, 
                    imdb_url: body.imdb_url,
                    rt_url: body.rt_url,
                    rating: body.rating
                }
            };
            const options = { upsert: true };
            const result = await col.updateOne(filter, movie, options);
            //console.log(`${result.matchedCount} document(s) matched the filter`);
            sendData(res, `${result.matchedCount} document(s) matched the filter`);
        }
    } catch (err) {
        console.log(err.stack);
    }
    finally {
        await client.close();
    }
}