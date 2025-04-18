/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/leaderlist.csv').then(data => {

  // Convert columns to numerical values
  data.forEach(d => {
    Object.keys(d).forEach(attr => {
      if (attr == 'pcgdp') {
        d[attr] = (d[attr] == 'NA') ? null : +d[attr];
      } else if (attr != 'country' && attr != 'leader' && attr != 'gender') {
        d[attr] = +d[attr];
      }
    });
  });

  data.sort((a,b) => a.label - b.label);

  // Initialize views
  const scatterPlot = new ScatterPlot({ parentElement: '#scatter-plot' }, data);
  const lexisChart = new LexisChart({ parentElement: '#lexis-chart' }, data);
  const barChart = new BarChart({ parentElement: '#bar-chart' }, data);

  // Filter data
  function filterData(criteria) {
    const filteredData = data.filter(d => d.gender === criteria || d.country === criteria);
    scatterPlot.updateVis(filteredData);
    lexisChart.updateVis(filteredData);
    barChart.updateVis(filteredData);
  }

  // Listen to events and update views
  barChart.dispatcher.on('filterByGender', gender => {
    filterData(gender);
  });

  // Listen to select box changes
  d3.select('#country-selector').on('change', function() {
    const selectedGroup = d3.select(this).property('value');
    filterData(selectedGroup);
  });
});

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 * - listen to select box changes
 */

