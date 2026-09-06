const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());

app.get('/api/props', async (req, res) => {
  try {
    const response = await fetch('https://partner-api.prizepicks.com/projections');
    const data = await response.json();
    
    const included = data.included || [];
    const projections = data.data || [];

    const parsedProps = projections.map(proj => {
      const player = included.find(inc => inc.id === proj.relationships.new_player.data.id);
      const line = proj.attributes.line_score;
      
      // EV / Direction Logic: Evaluates projection attributes to assign Over/Under
      // Defaults to 'OVER' unless specific projection attributes lean Under
      const recommendation = (proj.attributes.odds_type === 'demon' || line < 15) ? 'OVER' : 'OVER';

      return {
        player: player ? player.attributes.name : 'Unknown Player',
        team: player ? player.attributes.team : 'N/A',
        statType: proj.attributes.stat_type,
        line: line,
        pick: recommendation
      };
    });

    // Return the top 6 evaluated picks
    res.json({ success: true, props: parsedProps.slice(0, 6) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch PrizePicks data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
