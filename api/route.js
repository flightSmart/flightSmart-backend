const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { departure, arrival } = req.body;

    if (!departure || !arrival) {
        return res.status(400).json({ error: 'Departure and arrival ICAO codes are required.' });
    }

    try {
        const API_KEY = process.env.API_KEY;

        // Generate flight plan
        const generateResponse = await axios.post(
            'https://api.flightplandatabase.com/auto/generate',
            {
                fromICAO: departure,
                toICAO: arrival,
                useNats: true,
                usePacots: true,
                useAwyHigh: true,
                useAwyLow: true,
            },
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const planId = generateResponse.data.id;

        // Fetch the detailed plan
        const planResponse = await axios.get(
            `https://api.flightplandatabase.com/plan/${planId}`,
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
                },
            }
        );

        const waypoints = planResponse.data.route?.nodes?.map((node) => ({
            identifier: node.ident || 'Unknown',
            name: node.name || '',
            latitude: node.lat,
            longitude: node.lon,
        }));

        res.json({
            ...planResponse.data,
            route: waypoints || [],
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch route. Please try again later.' });
    }
};
