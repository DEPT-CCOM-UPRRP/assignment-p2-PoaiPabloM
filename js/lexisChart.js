class LexisChart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  // Todo: Add or remove parameters from the constructor as needed
  constructor(_config, data, Selection) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 380,
      margin: {
        top: 15,
        right: 15,
        bottom: 20,
        left: 25
      }
      // Todo: Add or remove attributes from config as needed
    }
    this.data = data; // Store the data
    this.dispatcher = d3.dispatch('selectionChanged'); // Event dispatcher
    this.sharedSelection = Selection;
    this.initVis();   // Initialize the visualization 
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
      .append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Apply clipping mask to 'vis.chart' to clip arrows
    vis.chart = vis.chartArea.append('g')
      .attr('clip-path', 'url(#chart-mask)');

    // Initialize clipping mask that covers the whole chart
    vis.chart.append('defs')
      .append('clipPath')
      .attr('id', 'chart-mask')
      .append('rect')
      .attr('width', vis.config.width + 5)
      .attr('y', -vis.config.margin.top)
      .attr('height', vis.config.height);

    // Helper function to create the arrows and styles for our various arrow heads
    vis.createMarkerEnds();

    // Initialize scales
    vis.xScale = d3.scaleLinear()
      .domain([1950, 2021]) // Static domain for x-axis (year)
      .range([0, vis.config.width]);

    vis.yScale = d3.scaleLinear()
      .domain([25, 95]) // Static domain for y-axis (age)
      .range([vis.config.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale).ticks(10);
    vis.yAxis = d3.axisLeft(vis.yScale).ticks(10);

    // Append x-axis group
    vis.xAxisGroup = vis.chartArea.append('g')
      .attr('transform', `translate(0,${vis.config.height})`);

    // Append y-axis group
    vis.yAxisGroup = vis.chartArea.append('g');

    // Add axis labels
    vis.svg.append('text')
      .attr('x', vis.config.margin.left)
      .attr('y', vis.config.margin.top - 5)
      .attr('class', 'axis-label')
      .text('Age'); // Label for y-axis

    vis.svg.append('text')
      .attr('x', vis.config.width - 50)
      .attr('y', vis.config.containerHeight - 5)
      .attr('class', 'axis-label')
      .text('Year'); // Label for x-axis

    // Initialize tooltip
    vis.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    vis.updateVis();
  }

  updateVis(filteredData = this.data) {
    let vis = this;

    // Filter data if needed
    vis.filteredData = filteredData;

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Bind data to arrows
    const arrows = vis.chart.selectAll('.arrow')
      .data(vis.filteredData, d => d.id);

    // Enter selection: Append new arrows
    arrows.enter()
      .append('line')
      .attr('class', 'arrow')
      .merge(arrows) // Merge with update selection
      .attr('x1', d => vis.xScale(d.start_year))
      .attr('x2', d => vis.xScale(d.end_year))
      .attr('y1', d => vis.yScale(d.start_age))
      .attr('y2', d => vis.yScale(d.end_age))
      .attr('stroke', d => vis.sharedSelection.has(d.id) ? 'orange' : 'grey') // Highlight selected arrows
      .attr('stroke-width', d => d.label === 1 ? 3 : 1.5) // Thicker stroke for highlighted
      .attr('marker-end', 'url(#arrow-head)') // Add arrowhead
      .on('mouseover', (event, d) => {
        // Show tooltip on hover
        vis.tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.leader}</strong><br>
            Country: ${d.country}<br>
            Start Year: ${d.start_year}<br>
            End Year: ${d.end_year}<br>
            Start Age: ${d.start_age}<br>
            End Age: ${d.end_age}<br>
            Duration: ${d.duration} years<br>
            GDP per Capita: ${d.pcgdp ? d.pcgdp.toFixed(2) : 'N/A'}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        // Hide tooltip on mouseout
        vis.tooltip.style('opacity', 0);
      })
      .on('click', function(event, d) {
        if (vis.sharedSelection.has(d.id)) {
          vis.sharedSelection.delete(d.id); // Deselect arrow
        } else {
          vis.sharedSelection.add(d.id); // Select arrow
        }
        vis.dispatcher.call('selectionChanged', null, Array.from(vis.sharedSelection));
      });

    // Exit selection: Remove old arrows
    arrows.exit().remove();

    // Update axes
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
  }

  /**
   * Create all of the different arrow heads.
   * Styles: default, hover, highlight, highlight-selected
   * To switch between these styles you can switch between the CSS class.
   * We populated an example css class with how to use the marker-end attribute.
   * See link for more info.
   * https://observablehq.com/@stvkas/interacting-with-marker-ends
   */
  createMarkerEnds() {
    let vis = this;
    // Default arrow head
    // id: arrow-head
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#ddd')
      .attr('fill', 'none');

    // Hovered arrow head
    // id: arrow-head-hovered
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-hovered')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#888')
      .attr('fill', 'none');

    // Highlight arrow head
    // id: arrow-head-highlighted
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-highlighted')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#aeaeca')
      .attr('fill', 'none');

    // Highlighted-selected arrow head
    // id: arrow-head-highlighted-selected
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-highlighted-selected')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#e89f03')
      .attr('fill', 'none');
  }

  updateSelection(Selection) {
    let vis = this;
    vis.sharedSelection = Selection;
    vis.renderVis(); // Re-render to update selection
  }
}