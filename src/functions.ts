//grouping used functions for intents to access indevidually without creating interdependancies
import axios from 'axios';


export function calculateFlightTime(departureCity: string,destinationCity: string){
    
    return new Promise<number>((resolve, reject) => {
    callGeoApi(departureCity).then((cityOutput) => {
        let departureCityData: any = cityOutput;
        callGeoApi(destinationCity).then((cityOutput) => {
            let destinationCityData: any = cityOutput;
            
            let departureLat = departureCityData['latt'];
            let departureLon = departureCityData['longt'];
            let destinationLat = destinationCityData['latt'];
            let destinationLon = destinationCityData['longt'];
        
            //below calculation for flight distance provided by: https://www.movable-type.co.uk/scripts/latlong.html
            let R = 6371e3; // metres
            let φ1 = departureLat * Math.PI/180; // φ, λ in radians
            let φ2 = destinationLat * Math.PI/180;
            let Δφ = (destinationLat-departureLat) * Math.PI/180;
            let Δλ = (destinationLon-departureLon) * Math.PI/180;
        
            let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            let flightDistance = R * c; // in metres
            console.log('distance: '+ flightDistance);
            // we calculate the flight time with a rough estimation calculation 30 min plus 1 hour per every 500 miles. calculation provided by https://openflights.org/faq 
            let flightTime = 0.5 + (flightDistance/(500*1609.34));
            console.log('time: ' + flightTime);
            console.log('Hours: ' + Math.floor(flightTime));
            console.log('Minutes: '+ Math.floor((flightTime - Math.floor(flightTime))*60));
            resolve(flightTime);

        }).catch((error: any) => {
            console.log('encountered the following error in calling destinationCity geodata: ' + error);
            reject();
        });
    }).catch((error: any) => {
        console.log('encountered the following error in calling departureCity geodata: ' + error);
        reject();
    });


});
}


//A function that outputs weather data based on location and time. if you provide a empty date vaiable it will output current weather at location
export function callWeatherApi(cityData: any,dateTime: Date) {
    
    //Setting the API data:
    const openweathermap = new Map();
    openweathermap.set('host', 'https://api.openweathermap.org/data/2.5/onecall')
    openweathermap.set('apiKey', '483ddfa2413a8028b5b145c7c93c2775')

    console.log('Im grabbing weather data!')
    console.log(dateTime)
    
    return new Promise((resolve, reject) => {
        const params = {
            lat: cityData['latt'],
            lon: cityData['longt'],
            appid: openweathermap.get('apiKey'),
            units: 'metric',
            lang: 'nl'
        };

        axios.get(openweathermap.get('host'), { params })
            .then((response: { data: any; }) => {
                
                let unixDateTime : any;
                let currentTime = new Date();
                unixDateTime = (dateTime.getTime() / 1000).toFixed(0);
                //checking if we have also recieved a timestamp. 
                if(dateTime.getTime()> (currentTime.getTime()+5000)){
                    let closestDate = 0; // we will store the closest date here as we iterate
                    for (var i =0; i< response.data['hourly'].length ;i++) {// as we have hourly and daily date we will need to loop twice.
                        if (Math.abs(unixDateTime - response.data['hourly'][i]['dt']) < Math.abs(unixDateTime - closestDate)){
                            closestDate = response.data['hourly'][i]['dt'];
                        }   
                        console.log(closestDate);               
                    };
                    for (var i =0; i< response.data['daily'].length ;i++) {
                        if (Math.abs(unixDateTime - response.data['daily'][i]['dt']) < Math.abs(unixDateTime - closestDate)){
                            closestDate = response.data['daily'][i]['dt'];
                        }  
                        console.log(closestDate);
                    }
                    
                    // now that we have the closest timestamp to the ask lets find the index. we will first check the hourly dataset
                    let indexClosestDate = null;
                    let hourlyDaily = 'hourly';
                    console.log(indexClosestDate);
                    indexClosestDate = response.data['hourly'].map(function(e: { dt: any; }) { return e.dt; }).indexOf(closestDate);
                    let forecastTemp = response.data[hourlyDaily][indexClosestDate]; //need to diclare this before as the format changes with hourly/daily
                    console.log(indexClosestDate + hourlyDaily);
                    // if the index is still NULL the closest date will be in the days
                    if(indexClosestDate = -1){
                        indexClosestDate = response.data['daily'].map(function(e: { dt: any; }) { return e.dt; }).indexOf(closestDate);
                        hourlyDaily = 'daily';
                        forecastTemp = response.data[hourlyDaily][indexClosestDate]['temp']['day'];
                    }
                    console.log(indexClosestDate + hourlyDaily);
                    console.log(forecastTemp);                    
                    
                    //now we know where the data is in the dataset we can start filling out our responses
                    let forecastWind = response.data[hourlyDaily][indexClosestDate]['wind_speed'];
                    let conditions = response.data[hourlyDaily][indexClosestDate]['weather'][0];
                    let readableDate = dateTime.toDateString().split(' ')//breaking up the datetime for output


                    // Create response
                    let output = `Op ${readableDate[2]} ${readableDate[1]} in ${cityData['standard']['city']} 
                    is het ${conditions['description']} met een tempratuur van
                    ${forecastTemp}°C en een windsnelheid van
                    ${forecastWind} knopen.`;

                    // Resolve the promise with the output text
                    console.log(output);
                    console.log('Im done grabbing weather data!')
                    resolve(output);

                    
                }
                else{//if no datetime was provided we respond with current weather
                let forecast = response.data['current'];
                let conditions = response.data['current']['weather'][0];

                // Create response
                let output = `op het moment in ${cityData['standard']['city']} 
                is het ${conditions['description']} met een tempratuur van
                ${forecast['temp']}°C en een windsnelheid van
                ${forecast['wind_speed']} knopen.`;

                // Resolve the promise with the output text
                console.log(output);
                console.log('Im done grabbing weather data!')
                resolve(output);
                };
            }).catch((error: any) => {
                console.log(`Error calling the weather API: ${error}`)
                reject();
            });
        });
}


//a function that provides Geodata on a city string you provide
export function callGeoApi(city: string) {

    //setting API data
    const geocode = new Map();
    geocode.set('host', 'https://geocode.xyz/')
    geocode.set('apiKey', '146630500381958569682x18325')
    
    console.log('Im grabbing geo data!')
    return new Promise<any>((resolve, reject) => {
        const params = {
            auth: geocode.get('apiKey'),
            locate: city,
            json: '1'
        }
        axios.get(geocode.get('host'), { params })
            .then((response: { data: any; }) => {
                if(response.data['standard']['city']==null){
                    resolve(`stad niet gevonden!`);
                }
                console.log(response.data);
                resolve(response.data);
            }).catch((error: any) => {
                reject(error);
            });
    });
}
