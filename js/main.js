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
  const sharedSelection = new Set();

  const scatterPlot = new ScatterPlot({ parentElement: '#scatterPlot' }, data, sharedSelection);
  const lexisChart = new LexisChart({ parentElement: '#lexisChart' }, data, sharedSelection);
  const barChart = new BarChart({ parentElement: '#barChart' }, data);

  // make sure default is first option
  filterData('oecd');

  // Filter data
  function filterData(criteria) {
    let filteredData;

    if (criteria === 'Male' || criteria === 'Female') {
      // Filter by gender
      filteredData = data.filter(d => d.gender === criteria);
    } else if (['oecd', 'eu27', 'brics', 'gseven', 'gtwenty'].includes(criteria)) {
      // Filter by group (e.g., OECD, EU27, etc.)
      filteredData = data.filter(d => d[criteria] === 1);
    } else {
      // Filter by country
      filteredData = data.filter(d => d.country === criteria);
    }

    scatterPlot.updateVis(filteredData);
    lexisChart.updateVis(filteredData);
    barChart.updateVis(filteredData);
  }

  // Listen to events and update views
  barChart.dispatcher.on('filterByGender', gender => {
    let filteredData;

    if (gender) {
      // Filter data by gender
      filteredData = lexisChart.filteredData.filter(d => d.gender === gender);
    } else {
      // Reset filter
      filteredData = data.filter(d => {
        // Apply the current country or group filter
        const currentFilter = d3.select('#country-selector').property('value');
        if (['oecd', 'eu27', 'brics', 'gseven', 'gtwenty'].includes(currentFilter)) {
          return d[currentFilter] === 1;
        } else if (currentFilter) {
          return d.country === currentFilter;
        }
        return true; // No country or group filter applied
      });
    }
  
    // Update LexisChart with filtered data
    lexisChart.updateVis(filteredData);
  });

  scatterPlot.dispatcher.on('selectionChanged', selectedIds => {
    sharedSelection.clear();
    selectedIds.forEach(id => sharedSelection.add(id));
    lexisChart.updateSelection(sharedSelection);
  });
  
  lexisChart.dispatcher.on('selectionChanged', selectedIds => {
    sharedSelection.clear();
    selectedIds.forEach(id => sharedSelection.add(id));
    scatterPlot.updateSelection(sharedSelection);
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

