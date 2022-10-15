const geolib = require('geolib');

const { getDistance } = require('geolib') ;

module.exports =
{
    getDistanceinKm(latAtual, longAtual, latFinal, longFinal) {

    let distanceInKm = getDistance({latitude: latAtual, longitude: longAtual}, {latitude: latFinal, longitude: longFinal})
    const finalDistanceInKm = (distanceInKm / 1000).toFixed(1)
    
    return finalDistanceInKm
    },
}