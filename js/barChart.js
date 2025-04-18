class BarChart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  // Todo: Add or remove parameters from the constructor as needed
  constructor(_config, data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 240,
      containerHeight: 260,
      margin: {
        top: 30,
        right: 5,
        bottom: 20,
        left: 30
      }
      // Todo: Add or remove attributes from config as needed

    }
    this.genderCounts = Array.from(d3.rollup(data, v => v.length, d => d.gender), ([gender, count]) => ({ gender, count }));
    this.data = data;
    this.dispatcher = d3.dispatch('filterByGender');
    this.initVis();
  }

  initVis() {
    let vis = this;
    // Todo: Create SVG area, initialize scales and axes
    // svg area
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    
    // Calculate inner chart size.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Scales
    vis.xScale = d3.scaleBand()
      .domain(vis.data.map(d => d.gender))
      .range([0, vis.width])
      .padding(0.5);

    vis.yScale = d3.scaleLinear()
      .domain([0, 500])
      .range([0, vis.height]);

    // Axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisGroup = vis.chartArea.append('g');
    vis.yAxisGroup = vis.chartArea.append('g');

    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    // Todo: Prepare data and scales
    // group data by gender and count occurrences

    // update scales
    vis.xScale.domain(vis.genderCounts.map(d => d.gender));
    vis.yScale.domain([0, d3.max(vis.genderCounts, d => d.count)]);

    //call renderVis
    vis.renderVis();
  }

  renderVis() {
    let vis = this;
    // Todo: Bind data to visual elements, update axes
    // Bind data to bars
    const bars = vis.chartArea.selectAll('.bar')
        .data(vis.genderCounts, d => d.gender);

    bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .merge(bars)
        .attr('x', d => vis.xScale(d.gender))
        .attr('y', d => vis.yScale(d.count))
        .attr('width', vis.xScale.bandwidth())
        .attr('height', d => vis.height - vis.yScale(d.count))
        .attr('fill', 'steelblue')
        .on('click', (event, d) => {
          // Emit filter event
          vis.dispatcher.call('filterByGender', null, d.gender);
        });

    bars.exit().remove();

    // Update axes
    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
  }
}