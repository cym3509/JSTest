const margin = {top: 60, right: 40, bottom:50, left: 100}, 
width =750, 
height = 400

const svg = d3
  .select("#linechart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.right})`);

Promise.all([
    d3.csv("cases.csv"),
    d3.csv("deaths.csv")
]).then(([casesData, deathsData]) => {
    // set strat date
    let startIdx = casesData.columns.indexOf('1/26/20')

    // render x-Axis
    function scalexAxis(startIdx = 5) {
        const x = d3
          .scaleTime()
          .domain(
            d3.extent(casesData.columns.slice(startIdx), (d) => new Date(d))
          )
          .range([0, width])
          .nice();
        const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b %d"));

        return { x, xAxis }
    }

    let { x, xAxis } = scalexAxis(startIdx);

    svg
      .append("g")
      .attr("class", "xaxis")
      .call(xAxis)
      .style("font-family", "Courier New")
      .attr("transform", `translate(0, ${height})`);

    //set country and amp
    let selectedCountry = "Taiwan*";
    function getCountryData(country = 'Taiwan*') {
        let countryCase = d => {
            return casesData.find(item => item.Country == country);
        };
        let countryDeath = d => {
            return deathsData.find(item => item.Country == country);
        };
        console.log(startIdx);
        let cases_data = d3.map(countryCase()).entries().slice(startIdx);
        let deaths_data = d3.map(countryDeath()).entries().slice(startIdx);

        return { cases_data, deaths_data}
    }

    let { cases_data, deaths_data} = getCountryData();
    
    function scaleyAxis(cases_data) {
        //render y-axis
        let y = d3.scaleLinear()
            .domain([0, d3.max(cases_data, d => +d.value)])
            .range([height, 0])
            .nice(5);
        let yAxis = d3.axisLeft(y)
            .ticks(5);  // number of ticks
        return {y, yAxis};

    }
    let { y, yAxis } = scaleyAxis(cases_data);

    svg
      .append("g")
      .attr("class", "yaxis")
      .style("font-family", "Courier New")
      .call(yAxis);

    // Country & Axis Label 
    svg
      .append("text")
      .attr("x", width / 2 -40)
      .attr("y", -20)
      .attr("class", "seCountry")
      .attr("font-size", "20px")
      .attr("font-family", "Courier New")
      .style("font-weight", "bold")
      .text(selectedCountry);
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", -margin.left+20)
      .attr("dy", "1em")
      .style("font-family", "Courier New")
      .text("Cases");
    svg
      .append("text")
      .attr("transform", "translate(" + width / 2 + " ," + (height + 50) + ")")
      .style("text-anchor", "middle")
      .style("font-family", "Courier New")
      .text("Date");

    // grid lines
    svg.append("g")
        .attr("class", "grid")
        .style("stroke-dasharray", ("3,3"))
        .call(d3.axisLeft(y).ticks(5)
            .tickSize(-width)
            .tickFormat("")
        )

    
    //render line and dots
        // cases line
    let lineValue = d3.line()
            .x(function (d) { return x(new Date(d.key)); })
            .y(function (d) { return y(d.value); });
    let cline = svg.append("path")
        .datum(cases_data)
        .attr("class", 'casepath')
        .attr("fill", "none")
        .attr("stroke", "#FFC300")
        .attr("stroke-width", '1.5')
        .attr("d", lineValue(cases_data));

        // deaths line
    let dline = svg.append("path")
        .datum(deaths_data)
        .attr("class", 'deathpath')
        .attr("fill", "none")
        .attr("stroke", "#C70039")
        .attr("stroke-width", '1.5')
        .attr("d", lineValue(deaths_data));

        // cases dots
    svg.selectAll("dot")
        .data(cases_data)
        .enter().append("circle")
        .attr("class", 'casedot')
        .attr('fill', '#FFC300')
        .attr("r", 2)
        .attr("cx", d => x(new Date(d.key)))
        .attr("cy", d => y(d.value));

        //deaths dots
    svg.selectAll("dot")
        .data(deaths_data)
        .enter().append("circle")
        .attr("class", 'deathdot')
        .attr('fill', '#C70039')
        .attr("r", 2)
        .attr("cx", d => x(new Date(d.key)))
        .attr("cy", d => y(d.value));

    // create select option
    countries = casesData.map(item => item.Country);
    let searchbox = d3
      .select("#button")
      .append("input")
      .attr("type", "text")
      .attr("list", "country-list")
      .on("focus", function () {
        this.value = "";
      })
      .on("mouseenter", function(){
        this.value = "";
      })
      .on("change", function () {
        selectedCountry = this.value != "" ? this.value : "Taiwan*";
        // selectedCountry = country;
        updateCountry(selectedCountry);
      });

    let dlist = d3.select('#button')
        .append('datalist')
        .attr('id', 'country-list');

    dlist.selectAll('option')
        .data(countries)
        .enter()
        .append('option')
        .attr('id', (d, i) => `op${i}`)
        .text(d => d);   
    
    //slidebar
    
    const slidebar = d3
      .select("#button")
      .append("input")
      .attr("type", "range")
      .attr("class", "slidebar")
      .attr("id", "slidebar")
      .data(casesData)
      .attr("value", function (d, i) {
        // console.log(d, i);
      })
      .attr("min", 1)
      .attr("max", (d) => Object.keys(d).length - 1)
      .attr("value", (d) => Object.keys(d).length - 1)
      
    //   .attr("oninput", "dateOutput.value = slidebar.value")
    //   .attr("oninput", function (d) {
    //     //   console.log(this.value)
    //     // let date = d[Object.keys(d)[this.value]];
    //     return "dateOutput.value = propertime(new Date(d[Object.keys(d)[this.value]]))";
    //   })
      .on("change", function (d) {
        // console.log(this.value);
        startIdx = this.value;
        updateDate(startIdx);
      });

    const slideAxis = d3
      .select("#button")
      .append("line")
      .attr("stroke", "gray")
      .attr("y1", 500)
      .attr("y2", 500)
      .attr("x1", 500)
      .attr("x2", 1000)
      .attr("stroke-width", "1.5")
      .style("opacity", 1);


    function updateCountry(country) {
        cases_data = getCountryData(country).cases_data;
        deaths_data = getCountryData(country).deaths_data;

        // let { y, yAxis } = scaleyAxis(cases_data);
        y = scaleyAxis(cases_data).y;
        yAxis = scaleyAxis(cases_data).yAxis;
        // console.log(cases_data)
        d3.select(".yaxis")
            .transition()
            .duration(750)
            .call(yAxis);
        d3.select(".grid")
            .style("stroke-dasharray", ("3,3"))
            .transition()
            .duration(750)
            .call(d3.axisLeft(y).ticks(5)
                .tickSize(-width)
                .tickFormat("")
            )

        cline.datum(cases_data)
            .transition()
            .duration(750)
            .attr("fill", "none")
            .attr("stroke", "#FFC300")
            .attr("stroke-width", '1.5')
            .attr("d", d3.line()
                .x(function (d) { return x(new Date(d.key)); })
                .y(function (d) { return y(d.value); }));

        dline.datum(deaths_data)
            .transition()
            .duration(750)
            .attr("fill", "none")
            .attr("stroke", "#C70039")
            .attr("stroke-width", '1.5')
            .attr("d", d3.line()
                .x(function (d) { return x(new Date(d.key)); })
                .y(function (d) { return y(d.value); }));

        d3.selectAll(".casedot")
            .data(cases_data)
            .transition()
            .duration(750)
            // .attr('fill', function(d){console.log(d)})
            .attr("r", 2)
            .attr("cx", d => x(new Date(d.key)))
            .attr("cy", d => y(d.value));
        d3.selectAll(".deathdot")
            .data(deaths_data)
            .attr('fill', '#C70039')
            .attr("r", 2)
            .transition()
            .duration(750)
            .attr("cx", d => x(new Date(d.key)))
            .attr("cy", d => y(d.value));
        d3.select(".seCountry").text(country);
    }

    function updateDate(startDateIdx) {
        x = scalexAxis(startDateIdx).x;
        xAxis = scalexAxis(startDateIdx).xAxis;

        d3.select(".xaxis").transition().duration(750).call(xAxis);

        cases_data = getCountryData(selectedCountry).cases_data;
        deaths_data = getCountryData(selectedCountry).deaths_data;

        cline
          .datum(cases_data)
          .transition()
          .duration(750)
          .attr("fill", "none")
          .attr("stroke", "#FFC300")
          .attr("stroke-width", "1.5")
          .attr(
            "d",
            d3
              .line()
              .x(function (d) {
                return x(new Date(d.key));
              })
              .y(function (d) {
                return y(d.value);
              })
          );

        dline
          .datum(deaths_data)
          .transition()
          .duration(750)
          .attr("fill", "none")
          .attr("stroke", "#C70039")
          .attr("stroke-width", "1.5")
          .attr(
            "d",
            d3
              .line()
              .x(function (d) {
                return x(new Date(d.key));
              })
              .y(function (d) {
                return y(d.value);
              })
          );

        d3.selectAll(".casedot")
          .data(cases_data)
          .enter()
          .append()
          .transition()
          .duration(750)
          // .attr('fill', function(d){console.log(d)})
          .attr("r", 2)
          .attr("cx", (d) => x(new Date(d.key)))
          .attr("cy", (d) => y(d.value));

          d3.selectAll(".casedot")
            .data(cases_data)
            .exit()
            .remove()
            .transition()
            .duration(750)
            // .attr('fill', function(d){console.log(d)})
            .attr("r", 2)
            .attr("cx", (d) => x(new Date(d.key)))
            .attr("cy", (d) => y(d.value));
        
        d3.selectAll(".deathdot")
          .data(deaths_data)
          .enter()
          .attr("fill", "#C70039")
          .attr("r", 2)
          .transition()
          .duration(750)
          .attr("cx", (d) => x(new Date(d.key)))
          .attr("cy", (d) => y(d.value))
          .append();
        
        d3.selectAll(".deathdot")
            .data(deaths_data)
            .exit()
            .attr("fill", "#C70039")
            .attr("r", 2)
            .transition()
            .duration(750)
            .attr("cx", (d) => x(new Date(d.key)))
            .attr("cy", (d) => y(d.value))
            .remove();
    }
    // tooltip
    const tooltipLine = svg.append('line');
    const deathDot = svg.append('circle');
    const caseDot = svg.append('circle');
    const tooltip = d3.select('#linechart').append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('display', 'none');

    const tipBox = svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("opacity", 0)
      .on("mousemove", drawTooltip)
      .on("mouseout", removeTooltip);

    function drawTooltip() {
        let mouse = d3.mouse(this)
        let Ymd = d3.timeFormat("%-m/%-d/%y");
        var xDate = x.invert(mouse[0])

        // find selected cases & death
        var selectedDeath = deaths_data.find(obj => {
            return obj.key == Ymd(xDate);
        });
        var selectedCase = cases_data.find(obj => {
            return obj.key == Ymd(xDate);
        })

        tooltipLine.attr('stroke', 'gray')
            .attr('x1', x(new Date(selectedDeath.key)))
            .attr('x2', x(new Date(selectedDeath.key)))
            .attr("stroke-width", '1.5')
            .style("opacity", 0.3)
            .attr('y1', 0)
            .attr('y2', height);

        deathDot.attr('fill', '#C70039')
            .attr("r", 4)
            .style('opacity', 1)
            .attr("transform", `translate(${x(new Date(selectedDeath.key))}, ${y(selectedDeath.value)})`);

        caseDot.attr('fill', '#FFC300')
            .attr("r", 4)
            .style('opacity', 1)
            .attr("transform", `translate(${x(new Date(selectedCase.key))}, ${y(selectedCase.value)})`);
        
        propertime = d3.timeFormat("%b %d, %Y");

        tooltip
          .html(
            `<div style="font-family:Courier New"><span>${propertime(
              new Date(selectedCase.key)
            )}</span><br>
            <span style="color:#FFC300;font-size:20px; opacity:1">●</span><span>Confirmed Cases: ${
              selectedCase.value
            }</span><br>
            <span style="color:#C70039;font-size:20px; opacity:1">●</span><span>Deaths: ${
              selectedDeath.value
            }</span><br></div>
          `
          )
          .style("left", d3.event.pageX + 20 + "px")
          .style("top", height / 2 + "px")
          .style("box-shadow", "2px 2px 5px gray")
          .style("display", "block")
          .style("background", "white")
          .style("opacity", 0.8);
    }

    function removeTooltip() {
        if (tooltipLine) tooltipLine.style('opacity', 0);
        if (deathDot) deathDot.style('opacity', 0);
        if (caseDot) caseDot.style('opacity', 0);
        if (tooltip) tooltip.style("opacity", 0);
    }

});


// d3.csv("country_conf.csv",
//     function(conf) {
//         console.log(conf)
//         const x = d3.scaleTime()
//             .domain(d3.extent(d3.keys(conf).slice(1), d => new Date(d) ))
//             .range([0, width])
//             .nice();

//         const y = d3.scaleLinear()
//             .domain([0, 700000])
//             .range([height, 0]);

//         const xAxis = d3.axisBottom(x)
//             .tickFormat(d3.timeFormat("%b %d"));

//         const yAxis = d3.axisLeft(y)
//             .ticks(5);  // numbers of ticks

//         svg.append("g").call(xAxis)
//             .attr("transform", `translate(0, ${height})`);
//         svg.append("g").call(yAxis);

//         // console.log(d3.map(conf).entries())
//         new_data = d3.map(conf).entries().slice(1);
//         // console.log(new_data);
//         // die()
//         svg.append("path")
//             .datum(new_data)
//             .attr("fill", "none")
//             .attr("stroke", "steelblue")
//             .attr("stroke-width", '1.5')
//             // .attr("stroke-width", function (d) { console.log(conf, d)})
//             .attr("d", d3.line()
//                 .x(function (d) { return x (new Date(d.key));  })
//                 .y(function (d) { return y(d.value); })
//             )

//     }
// )


