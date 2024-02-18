let globalData = null;
let selectedMin = 1960;
let selectedMax = 2021;
let countries = ["BRA", "USA"];
let countriesFullName = {
	BRA: "Brazil",
	USA: "United States"
}
const w = 800;
const h = 500;

d3.csv('https://gist.githubusercontent.com/lorenzo-lipp/223a502f85be842034fe4ec16141b0ce/raw/EUA-Brasil-GDP.csv')
	.then(data => {
		globalData = {}
		data.forEach((_, i) => {
			globalData[data[i]["Country Code"]] = Object.entries(data[i])
				.filter(v => !isNaN(+v[0]) && v[0])
				.map(([year, value]) => [+year, Math.round((+value / 1000000000000) * 100) / 100]);
		});
		renderData(globalData);
	});

function renderData(data) {
	const padding = 60;
	const yLabelOffset = 20;
	const totalYears = 2021 - 1960 + 1;
	const totalSelectedYears = selectedMax - selectedMin + 1;
	const radius = Math.min(275 * 0.8 / data[Object.keys(data)[0]].length, 5);
	const maxX = selectedMax;
	const minX = selectedMin;

	const xScale = d3.scaleLinear()
		.domain([minX, maxX])
		.range([padding, w - padding]);

	const yScale = d3.scaleLinear()
		.domain([0, Math.max(...Object.keys(data).map(country => d3.max(data[country], (d) => d[1])))])
		.range([h - padding, padding])
		.nice();

	d3.select('#graph')
		.append('div')
		.attr('class', 'slider-background')
		.append('div')
		.attr('class', 'slider-progress')
		.style('width', `${(700 * totalSelectedYears / totalYears) - 10}px`)
		.style('left', `${((selectedMin - 1960) / totalYears) * 100}%`);

	d3.select('#graph')
		.append('input')
		.attr('class', 'slider')
		.attr('value', selectedMin)
		.attr('min', 1960)
		.attr('max', 2021)
		.attr('type', 'range')
		.on('pointerup', (e) => {
			const value = +e.target.value;

			if (value < selectedMax - 1) {
				selectedMin = value;
				filterData();
			} else {
				selectedMin = selectedMax - 2;
				e.target.value = selectedMin;
				filterData();
			}
		})
		.on('input', (e) => {
			if (e.target.value >= selectedMax - 1) return e.target.value = selectedMax - 2;
	
			d3.select("#slider-min")
				.style('left', `calc(50% + ${((e.target.value - 1960) / totalYears) * 690}px - 350px)`)
				.text(e.target.value);
	
			d3.select('.slider-progress')
				.style('width', `${(700 * (1 + selectedMax - e.target.value) / totalYears) - 10}px`)
				.style('left', `${((e.target.value - 1960) / totalYears) * 100}%`);
		});

	d3.select('#graph')
		.append('input')
		.attr('class', 'slider')
		.attr('value', selectedMax)
		.attr('min', 1960)
		.attr('max', 2021)
		.attr('type', 'range')
		.on('pointerup', (e) => {
			const value = +e.target.value;

			if (value > selectedMin + 1) {
				selectedMax = value;
				filterData();
			} else {
				selectedMax = selectedMin + 2;
				e.target.value = selectedMax;
				filterData();
			}
		})
		.on('input', (e) => {
			if (e.target.value <= selectedMin + 1) return e.target.value = selectedMin + 2;
	
			d3.select("#slider-max")
				.style('left', `calc(50% + ${((e.target.value - 1960) / totalYears) * 690}px - 350px)`)
				.text(e.target.value);
	
			d3.select('.slider-progress')
				.style('width', `${(700 * (e.target.value - selectedMin + 1) / totalYears) - 10}px`);
		});

	d3.select('#graph')
		.append('div')
		.attr('id', 'slider-min')
		.attr('class', 'slider-text')
		.style('left', `calc(50% + ${((selectedMin - 1960) / totalYears) * 690}px - 350px)`)
		.text(selectedMin);

	d3.select('#graph')
		.append('div')
		.attr('id', 'slider-max')
		.attr('class', 'slider-text')
		.style('left', `calc(50% + ${((selectedMax - 1960) / totalYears) * 690}px - 350px)`)
		.text(selectedMax);

	const tooltip = d3.select('#graph')
		.append('div')
		.attr('id', 'tooltip');

	d3.select('svg')
		.append('text')
		.attr('id', 'title')
		.attr('x', '50%')
		.attr('y', 40)
		.attr('text-anchor', 'middle')
		.text('Brazil and United States GDP in trillion dollars');

	d3.select('svg')
		.append('text')
		.attr('id', 'y-label')
		.attr('x', w / 2)
		.attr('y', h - yLabelOffset)
		.attr('text-anchor', 'middle')
		.text('Year');

	d3.select('svg')
		.append('text')
		.attr('id', 'x-label')
		.attr('x', 0)
		.attr('y', h / 2)
		.attr('text-anchor', 'middle')
		.text('GDP');

	const mouseover = () => tooltip.style('display', 'flex');
	const mouseleave = () => tooltip.style('display', 'none');
	const mousemove = (event) => {
		const target = d3.select(event.target);

		tooltip.html(`${target.attr('data-date')}<br>${target.attr('data-gdp')} trillion USD`)
			.style("top", `${event.pageY + 20}px`);

		const tooltipWidth = tooltip.node().getBoundingClientRect().width;
		tooltip.style("left", `${event.pageX - tooltipWidth / 2}px`);
	}


	Object.keys(data).forEach(country => {
		d3.select('svg')
			.append('path')
			.datum(data[country])
			.attr('class', `line-${country}`)
			.attr('d', d3.line()
				.x((d) => xScale(d[0]))
				.y((d) => yScale(d[1]))
			);

		d3.select('svg')
			.selectAll('g')
			.data(data[country])
			.enter()
			.append('circle')
			.attr('r', radius)
			.attr('cx', (v) => xScale(v[0]))
			.attr('cy', (v) => yScale(v[1]))
			.attr('class', `point-${country}`)
			.attr('data-date', (d) => d[0])
			.attr('data-gdp', (d) => d[1])
			.on('mouseover', mouseover)
			.on('mousemove', mousemove)
			.on('mouseleave', mouseleave);
	});

	d3.select('svg')
		.append('rect')
		.attr('class', 'legend-background')
		.attr('x', 80)
		.attr('y', 65);

	Object.keys(globalData).forEach((country, i) => {
		const group = d3.select('svg').append('g').attr('class', 'legend');

		group.append('rect')
			.attr('class', `legend-rect-${country}`)
			.attr('x', 100)
			.attr('y', 85 + i * 35);

		group.append('text')
			.attr('x', 120)
			.attr('y', 97 + i * 35)
			.text(countriesFullName[country]);

		group.append('line')
			.attr('class', 'legend-line')
			.attr('x1', 95)
			.attr('y1', 91 + i * 35)
			.attr('x2', i == 0 && 170 || 210)
			.attr('y2', 91 + i * 35)
			.style('opacity', Number(!countries.includes(country)));

		group.on('click', () => toggleCountry(country))
	});

	const yAxis = d3.axisLeft(yScale);
	const xAxis = d3.axisBottom(xScale).tickFormat(v => v);

	d3.select('svg')
		.append('g')
		.attr('id', 'y-axis')
		.attr('transform', 'translate(' + padding + ", 0)")
		.call(yAxis);

	d3.select('svg')
		.append('g')
		.attr('id', 'x-axis')
		.attr('transform', 'translate(0, ' + (h - padding) + ")")
		.call(xAxis);
}

function filterData() {
	const isInsideInterval = (value) => value >= selectedMin && value <= selectedMax;
	const newData = {};

	Object.keys(globalData).forEach(country => {
		if (countries.includes(country)) newData[country] = globalData[country].filter(v => isInsideInterval(v[0]));
	});

	clear();
	renderData(newData);
}

function toggleCountry(country) {
	const countryIsRendered = countries.includes(country);
	const len = countries.length

	if (countryIsRendered && countries.length > 1) countries = countries.filter(v => v !== country);
	else if (!countryIsRendered) countries.push(country);

	if (len !== countries.length) filterData();
}

function clear() {
	d3.select('#graph').html('<svg width="800" height="500" viewBox="0 0 800 480"></svg>');
}

window.addEventListener('resize', () => {
	if (window.innerWidth < w) document.querySelector('main').style.transform = `scale(${(window.innerWidth - 20) / w})`;
	else document.querySelector('main').style.transform = '';
});

window.addEventListener('load', () => window.dispatchEvent(new Event('resize')));