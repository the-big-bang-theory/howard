/**
 * https://github.com/vert-x3/vertx-service-discovery/blob/master/vertx-service-discovery/src/main/java/io/vertx/servicediscovery/rest/ServiceDiscoveryRestEndpoint.java
 * ```java
 *   ServiceDiscoveryRestEndpoint.create(router, discovery);
 * ```
 * 
 * -> then you can call `/discovery` on each Vert.x microservice
 * eg: http://localhost:8085/discovery -> get the list of the microservices
 */

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const uuidv1 = require('uuid/v1');

let port = process.env.PORT || 8888;
let servicePort = process.env.SERVICE_PORT || 8888;
let serviceName = process.env.SERVICE_NAME || "John Doe";
let serviceRoot = process.env.SERVICE_ROOT || "api";
let serviceHost = process.env.SERVICE_HOST || "localhost";
let discoveryUrl = process.env.DISCOVERY || "http://localhost:8085/discovery"

let app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

let service = {
  record: {
    name: serviceName,
    status: "UP",
    type: "http-endpoint",
    location: {
      endpoint: `http://${serviceHost}:${servicePort}/talk`,
      host: serviceHost,
      port: servicePort,
      root: `/${serviceRoot}`,
      ssl: false
    },
    metadata: {
      description: "Hello 🌍 I'm Howard",
    } 
  }
}

console.log(service)


/**
 * Get the list of the microservices
 */
fetch(discoveryUrl, {
  method:'GET', headers: {"Content-Type": "application/json;charset=UTF-8"}
})
.then(response => {
  return response.json();
})
.then(jsonData => {
  
  let leonard = jsonData.find(item => item.name == "leonard"); 
  console.log("leonard: ", leonard)

  let penny = jsonData.find(item => item.name == "penny"); 
  console.log("penny: ", penny)
  
  /**
   * Registration
   */
  fetch(discoveryUrl, {
    method:'POST', headers: {"Content-Type": "application/json;charset=UTF-8"},
    body: JSON.stringify(service.record) 
  })  
  .then(response => response.json())
  .then(jsonData => {
    let registration = jsonData.registration
    console.log("😀 service registered, registration: ", registration)

    app.get('/talk/leonard', (req, res) => {
      
      fetch(leonard.location.endpoint, {
        method:'GET',
        headers: {"Content-Type": "application/json;charset=UTF-8"},
      })
      .then(response => response.json())
      .then(jsonData => res.send(jsonData))
      .catch(error => {
        console.log("😡 talking to leonard: ", error)
        res.send({error: error})
      });
    })

    app.get('/talk/penny', (req, res) => {
      
      fetch(penny.location.endpoint, {
        method:'GET',
        headers: {"Content-Type": "application/json;charset=UTF-8"},
      })
      .then(response => response.json())
      .then(jsonData => res.send(jsonData))
      .catch(error => {
        console.log("😡 talking to penny: ", error)
        res.send({error: error})
      });
    })

    /**
     * Start the microservice
     */
    app.listen(port)
    console.log(`🌍 ${serviceName} is started - listening on ${port}`)

  })
  .catch(error => {
    console.log("😡 registering: ", error)
  });

})
.catch(error => {
  console.log("😡 fetching services: ", error)
});


