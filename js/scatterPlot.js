class ScatterPlot {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   */
  // Todo: Add or remove parameters from the constructor as needed
  constructor(_config, data, Selection) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 720,
      containerHeight: 260,
      margin: {
        top: 30,
        right: 15,
        bottom: 40, // Adjusted for x-axis label
        left: 60    // Adjusted for y-axis label
      }
      // Todo: Add or remove attributes from config as needed
    };
    this.data = data; // Store the data
    this.dispatcher = d3.dispatch('selectionChanged'); // event dispatcher
    this.sharedSelection = Selection;
    this.initVis();   // Initialize the visualization
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Create SVG area
    vis.svg = d3.select(vis.config.parentElement)
      .append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append a group element to the SVG and apply margins
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Initialize scales
    vis.xScale = d3.scaleLinear()
      .range([0, vis.width]); // Dynamic domain will be set in updateVis

    vis.yScale = d3.scaleLinear()
      .domain([25, 95]) // Static domain for y-axis
      .range([vis.height, 0]); // Inverted range for correct orientation

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append x-axis group
    vis.xAxisGroup = vis.chartArea.append('g')
      .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisGroup = vis.chartArea.append('g');

    // Add axis labels
    vis.svg.append('text')
      .attr('x', vis.config.margin.left)
      .attr('y', vis.config.margin.top - 10)
      .attr('class', 'axis-label')
      .text('Age'); // Label for y-axis

    vis.svg.append('text')
      .attr('x', vis.config.containerWidth - vis.config.margin.right - 100)
      .attr('y', vis.config.containerHeight - 10)
      .attr('class', 'axis-label')
      .text('GDP per Capita (US$)'); // Label for x-axis

    // Initialize tooltip
    vis.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Call updateVis to render the initial visualization
    vis.updateVis();
  }

  updateVis(filteredData = this.data) {
    let vis = this;

    // Filter data to include only points where GDP is known
    vis.filteredData = filteredData.filter(d => d.pcgdp !== null);

    // Update x-axis domain dynamically based on filtered data
    vis.xScale.domain([0, d3.max(vis.filteredData, d => d.pcgdp)]);

    // Call renderVis to update the visualization
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Bind data to circles
    const circles = vis.chartArea.selectAll('.point')
      .data(vis.filteredData, d => d.id); // Use unique ID for data binding

    // Enter selection: Append new circles
    circles.enter()
      .append('circle')
      .attr('class', 'point')
      .merge(circles) // Merge with update selection
      .attr('cx', d => vis.xScale(d.pcgdp)) // Position based on GDP
      .attr('cy', d => vis.yScale(d.start_age)) // Position based on start age
      .attr('r', 5) // Set radius
      .attr('fill', d => vis.sharedSelection.has(d.id) ? 'red' : 'steelblue') // Highlight selected points
      .attr('fill-opacity', d => vis.activeFilter && d.gender !== vis.activeFilter ? 0.15 : 0.7) // Set fill opacity
      .on('mouseover', (event, d) => {
        if (!d3.select(event.target).classed('inactive')) { // Only show tooltip for active points
          vis.tooltip
            .style('opacity', 1)
            .html(`Leader: ${d.leader}<br>Country: ${d.country}<br>GDP: ${d.pcgdp}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        }
      })
      .on('mouseout', () => {
        vis.tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        if (vis.sharedSelection.has(d.id)) {
          vis.sharedSelection.delete(d.id); // Deselect point
        } else {
          vis.sharedSelection.add(d.id); // Select point
        }
        vis.dispatcher.call('selectionChanged', null, Array.from(vis.sharedSelection));
      });

    // Exit selection: Remove old circles
    circles.exit().remove();

    // clear selection when clicking on visualization
    vis.svg.on('click', function(event) {
      if (event.target.tagName.toLowerCase() !== 'circle') {
        vis.sharedSelection.clear();
        vis.dispatcher.call('selectionChanged', null, Array.from(vis.sharedSelection));
      }
    });

    // Update axes
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
  }

  updateSelection(Selection) {
    let vis = this;
    vis.sharedSelection = Selection;
    vis.renderVis(); // Re-render to update selection
  }
}

