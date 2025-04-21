class BarChart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  // Todo: Add or remove parameters from the constructor as needed
  constructor(_config, data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 300,
      containerHeight: 260,
      margin: {
        top: 30,
        right: 5,
        bottom: 20,
        left: 30
      }
      // Todo: Add or remove attributes from config as needed

    }
    // Calculate and store the original gender counts
    this.originalGenderCounts = Array.from(
      d3.rollup(data, v => v.length, d => d.gender),
      ([gender, count]) => ({ gender, count })
    );

    this.genderCounts = [...this.originalGenderCounts]; // Copy for initial rendering
    this.data = data;
    this.dispatcher = d3.dispatch('filterByGender');
    this.initVis();
  }

  initVis() {
    let vis = this;
    // Todo: Create SVG area, initialize scales and axes
    // svg area
    vis.svg = d3.select(vis.config.parentElement)
      .append('svg')
      .attr('class', 'bar-chart')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    
    // Calculate inner chart size.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Scales
    vis.xScale = d3.scaleBand()
      .domain(vis.originalGenderCounts.map(d => d.gender))
      .range([0, vis.width])
      .padding(0.5);

    vis.yScale = d3.scaleLinear()
      .domain([0, d3.max(vis.originalGenderCounts, d => d.count)])
      .range([vis.height, 0]);

    // Axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisGroup = vis.chartArea.append('g')
      .attr('transform', `translate(0,${vis.height})`);
    vis.yAxisGroup = vis.chartArea.append('g')
      .attr('transform', `translate(${vis.config.margin.left},0)`);
    

    vis.updateVis();
  }

  updateVis(filteredData = this.data) {
    let vis = this;
    // Todo: Prepare data and scales
    // group data by gender and count occurrences
    // recalculate gender counts
    // Group data by gender and count occurrences
    vis.genderCounts = Array.from(
      d3.rollup(filteredData, v => v.length, d => d.gender),
      ([gender, count]) => ({ gender, count })
    );

    // Update scales
    vis.yScale.domain([0, d3.max(vis.genderCounts, d => d.count) || 1]);

    // Call renderVis
    vis.renderVis(filteredData);
  }

  renderVis(filteredData) {
    let vis = this;
    vis.activeFilter = null;

    // Todo: Bind data to visual elements, update axes
    // Bind data to bars
    // Bind data to bars
    const bars = vis.chartArea.selectAll('.bar')
      .data(vis.genderCounts, d => d.gender);

    // Exit selection: Remove old bars
    bars.exit().remove();

    // Enter selection: Append new bars
    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .merge(bars)
      .attr('x', d => vis.xScale(d.gender))
      .attr('y', d => vis.yScale(d.count))
      .attr('width', vis.xScale.bandwidth())
      .attr('height', d => vis.height - vis.yScale(d.count))
      .attr('fill', d => vis.activeFilter === d.gender ? 'orange' : 'blue')
      .on('click', (event, d) => {
        // Toggle filter
        if (vis.activeFilter === d.gender) {
          vis.activeFilter = null; // Reset filter
          vis.dispatcher.call('filterByGender', null, null);
        } else {
          vis.activeFilter = d.gender; // Set new filter
          vis.dispatcher.call('filterByGender', null, d.gender);
        }

        // Update bar colors to reflect active filter
        vis.chartArea.selectAll('.bar')
          .attr('fill', barData => 
            vis.activeFilter === barData.gender ? 'orange' : 'blue'
          );
      });

    // Update axes
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
  }
}