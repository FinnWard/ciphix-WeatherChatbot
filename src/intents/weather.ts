import { callGeoApi, callWeatherApi } from '../apiCalls';
import { addWeatherMessag, setCity, setDateTime } from '../utilities';

// Intent name: Huidig weer
export const weather = (conv: any) => {
  
  // merge city input
  const city = setCity(conv.parameters['geo-city'], conv.parameters.airport);

  // basic slotfilling on location
  if (!city) {
    return conv.add('The digital sun is shining over here! But where are you at now?');
  }

  // parsing a date if available.
  const dateTime = setDateTime(conv.parameters.date);

  // getting further data on the city eg lattitude & longtitude
  return callGeoApi(city).then((cityOutput) => {
    const cityData = cityOutput;

    // pass lattitude and longtitude to weather API
    return callWeatherApi(cityData).then((forecast) => {
      // pass the results to the message handeler and return
      conv.add(addWeatherMessag(
        forecast,
        cityData.results[0].address_components[0].short_name,
        dateTime,
      ));
    }).catch(() => conv.add('Darn! i cant seem to find the weather, would you mind taking a peek out of the window?'));
  }).catch(() => conv.add('Darn! Sounds like a swell place but i dont recognise it! Is this a city?'));
};

export default weather;
