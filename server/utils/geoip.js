import https from 'https';

export function getGeoLocation(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return Promise.resolve({
      country: 'Local',
      countryCode: 'XX',
      region: 'Local',
      city: 'Local',
      timezone: 'UTC',
      lat: 0,
      lon: 0
    });
  }

  return new Promise((resolve) => {
    https.get(`https://ipapi.co/${ip}/json/`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            country: parsed.country_name || 'Unknown',
            countryCode: parsed.country_code || 'XX',
            region: parsed.region || 'Unknown',
            city: parsed.city || 'Unknown',
            timezone: parsed.timezone || 'UTC',
            lat: parsed.latitude || 0,
            lon: parsed.longitude || 0
          });
        } catch (err) {
          resolve({
            country: 'Unknown',
            countryCode: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'UTC',
            lat: 0,
            lon: 0
          });
        }
      });
    }).on('error', () => {
      resolve({
        country: 'Unknown',
        countryCode: 'XX',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC',
        lat: 0,
        lon: 0
      });
    });
  });
}

export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip ||
         '127.0.0.1';
}
