import { useEffect } from 'react';
import logo from './logo.svg';
import './style/App.css';
import * as d3 from 'd3';
import { Button, DatePicker, version } from 'antd';
import { D3ZoomEvent } from 'd3';

interface Syj {
    nodes: { name: number; group: number }[]; //array
    links: { source: string; target: string; value: number }[]; //array
}
interface NodeCycle {
    x: number;
    y: number;
    z: number;
    nodeIndex: number;
}

const syj: Syj = require('./data/0508.json');
const cc: number[][] = require('./data/double_array.json'); //2차원배열

function App() {
    /*
   함수를 크게 5가지를 만들면 좋을 것 같습니다.
   1. initialize: 데이터와 관련 없이 초기에 한 번 설정하면 되는 변수들을 초기화. ex> margin, width, height,
   2. remove: 경우에 따라 없어도 될 것 같습니다.
   3. updateData: 데이터를 업데이트 합니다. const x와 x2 등을 보니, syj2 등의 데이터에 영향을 받는 상황입니다.
   따라서, 1) 현재 선택된 오더 순서 (ex> order by Time, ...) 대로 syj 데이터를 만들고,
   2) 만들어진 syj를 바탕으로 nodes나 links, matrix 등의 값을 만듭니다.
   - const orders는, 데이터 값과 관련 없는 정렬에 대한 함수인 것 같은데, 맞다면 밖으로 아예 빼서 함수로 만들면 좋을 것 같습니다.
   4. initDraw
   - const svg 와 같이 정렬 순서 등과 관련 없이 한 번만 부르면 되는 함수를 초기화하는 함수입니다.
   5. updateDraw
    */

    // process 시작할 때 작동하는 javascript 코드, (vue에서 mounted()와 같음)
    useEffect(() => {
        // useEffecct 함수가 mounted 코드 역할을 하는 것 같습니다.
        // 여기에 initialize, remove, updateData, initDraw, updateDraw를 순서대로 불러 줍니다.
        // 하단 코드들을 보니 1번 ~ 4번 코드가 어느 정도 섞인 상황인 것 같아, 기능 별로 함수로 빼두고 여기서 불러 오는 형식으로 진행하시면 될 것 같습니다.
        let selectVariable: string = '';
        var margin = { top: 250, right: 200, bottom: 10, left: 50 },
            width = 3000,
            height = 3000;

        const x = d3 // node modules에서 d3 import
            .scaleBand<number>() //x축
            .range([0, width])
            .domain(d3.range(syj.nodes.length));

        // var x = d3.scaleOrdinal().rangeBands([0, width]),
        const z = d3.scaleLinear().domain([0, 300]).clamp(true); // y축
        //@ts-ignore
        const c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10)); //color 조정group에 의해 색조절이 된다

        const svg = d3
            .select('body')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .style('margin-left', margin.left + 'px')
            .call(
                //@ts-ignore
                d3.zoom().on('zoom', (event) => {
                    svg.attr('transform', () => event.transform);
                })
            ) //zoomevent
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        const matrix: NodeCycle[][] = [];

        const nodes = syj.nodes;
        const n = nodes.length;
        // Compute index per node.
        //@ts-ignore
        nodes.forEach(function (node, i) {
            //@ts-ignore
            node.index = i;
            //@ts-ignore
            node.count = 0;
            matrix[i] = d3.range(n).map(function (j) {
                //map은 return문을 통해 새로운 배열을 생성하여 호출
                return { x: j, y: i, z: 0, nodeIndex: j };
            });
        });

        // Convert links to matrix; count character occurrences.
        //@ts-ignore
        syj.links.forEach(function (link) {
            //@ts-ignore
            matrix[link.source][link.target].z += link.value;
            //@ts-ignore
            matrix[link.target][link.source].z += link.value;
            //@ts-ignore
            matrix[link.source][link.source].z += link.value;
            //@ts-ignore
            matrix[link.target][link.target].z += link.value;
            //@ts-ignore
            nodes[link.source].count += link.value;
            //@ts-ignore
            nodes[link.target].count += link.value;
        });

        // Precompute the orders.
        const orders = {
            name: d3.range(n).sort(function (a, b) {
                return d3.ascending(nodes[a].name, nodes[b].name); //1~440까지 ascending
            }),

            // count: d3.range(n).sort(function (a, b) {
            //   //@ts-ignore
            //   return nodes[b].count - nodes[a].count;
            // }),
            group: d3.range(n).sort(function (a, b) {
                return nodes[b].group - nodes[a].group;
            }),
        };

        // The default sort order.
        x.domain(orders.name);
        //initiate()??
        svg.join(
            (enter: any) => enter.append('rect').attr('class', 'background').attr('width', width).attr('height', height),
            (update: any) => update,
            (exit: any) => exit.call((exit: any) => exit.remove())
        );

        const rowgSelection = svg.selectAll('.row').data(matrix).enter().append('g').attr('class', 'row');

        // .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })

        rowgSelection.each(rowFunction); // d3.each = (js,ts).forEach 같은 반복문

        // original 가로줄
        // rowgSelection.append("line").attr("x2", width);

        rowgSelection.each(function (d, i) {
            // d3.select(this)
            svg.append('line').attr('x1', 0).attr('y1', x(d[0].y)!).attr('x2', width).attr('y2', x(d[0].y)!);
        });

        const rowTextSelection = rowgSelection
            .append('text')
            .attr('x', -2)
            .attr('y', (d, i) => x(d[0].y)! + x.bandwidth() * 0.75)
            // .attr("dx", ".02em")
            .attr('font-size', '20%')
            .attr('text-anchor', 'end')
            .text(function (d, i) {
                return nodes[i].name;
            });

        const column = svg
            .selectAll('.column')
            .data(matrix)
            .enter()
            .append('g')
            .attr('class', 'column')
            .attr('transform', function (d, i) {
                //@ts-ignore
                return 'translate(' + x(i) + ') rotate(-90)';
            });

        // 세로줄
        column.append('line').attr('x1', -width);

        const columnTextSelection = column
            .append('text')
            .attr('x', 2)
            .attr('y', x.bandwidth() * 0.75)
            // .attr("dy", ".02em")
            .attr('font-size', '20%')
            .attr('text-anchor', 'start')
            .text(function (d, i) {
                return nodes[i].name;
            });

        // row: d3.Selection<SVGGElement, Matrix, SVGGElement, unknown>
        //@ts-ignore
        function rowFunction(row: NodeCycle[], rowIndex: number) {
            const Selection = d3

                // @ts-ignore
                .select(this)
                .selectAll('.cell')
                // .append("rect")
                // .attr("class", "background")
                // .attr("width", width)
                // .attr("height", height)
                .data(
                    row.filter((d) => {
                        return d.z;
                    })
                )
                // .data(row)
                .join('g')
                .attr('class', 'cell')
                .on('mouseover', mouseover)
                .on('mouseout', mouseout);

            Selection.each(function (nodeCycle) {
                // [cycleNumber, cycleNumber, ...]
                const cycles: number[] = [];
                for (let cycle = 0; cycle < cc[0].length; cycle++) {
                    if (cc[rowIndex][cycle] === 0 && cc[nodeCycle.nodeIndex][cycle] === 0) {
                        // fill(none)
                    } else if (cc[rowIndex][cycle] === 0 && cc[nodeCycle.nodeIndex][cycle] === 1) {
                        // fill(none)
                    } else if (cc[rowIndex][cycle] === 1 && cc[nodeCycle.nodeIndex][cycle] === 0) {
                        // fill(none)
                    } else if (cc[rowIndex][cycle] === 1 && cc[nodeCycle.nodeIndex][cycle] === 1) {
                        if (
                            selectVariable === '0' ||
                            selectVariable === '1' ||
                            selectVariable === '2' ||
                            selectVariable === '3' ||
                            selectVariable === '4' ||
                            selectVariable === '5' ||
                            selectVariable === '6' ||
                            selectVariable === '7'
                        ) {
                            //각 사이클
                            if (cycle === Number(selectVariable)) {
                                // selectVariable: d3.range(n).sort(function (a,))

                                cycles.push(cycle);
                            }
                        } else {
                            //name, group
                            cycles.push(cycle);
                        }
                    }
                }
                //initDraw()?
                d3.select(this)
                    .selectAll('path')
                    .data(cycles)
                    .join('path')
                    .transition()
                    .duration(2500)
                    .attr('d', (d, i) => {
                        let attribute: string = '';
                        if (cycles.length === 1) {
                            attribute = `M ${x(nodeCycle.x)} ${x(nodeCycle.y)} H ${x(nodeCycle.x)! + x.bandwidth()} V ${x(nodeCycle.y)! + x.bandwidth()} H${x(nodeCycle.x)} L${x(nodeCycle.x)} ${x(
                                nodeCycle.y
                            )}`;
                        }
                        if (cycles.length === 2) {
                            if (i === 0) {
                                // first path
                                attribute = `M ${x(nodeCycle.x)! + x.bandwidth()} ${x(nodeCycle.y)} L ${x(nodeCycle.x)} ${x(nodeCycle.y)! + x.bandwidth()} L${x(nodeCycle.x)! + x.bandwidth()} ${
                                    x(nodeCycle.y)! + x.bandwidth()
                                } Z`;
                            } else if (i === 1) {
                                // second path
                                attribute = `M${x(nodeCycle.x)} ${x(nodeCycle.y)} L ${x(nodeCycle.x)} ${x(nodeCycle.y)! + x.bandwidth()} L${x(nodeCycle.x)! + x.bandwidth()} ${x(nodeCycle.y)} Z`;
                            }
                        } else if (cycles.length === 3) {
                            if (i === 0) {
                                // first path
                                attribute = `M${x(nodeCycle.x)} ${x(nodeCycle.y)! + x.bandwidth()} H ${x(nodeCycle.x)! + x.bandwidth()} V ${x(nodeCycle.y)! + (x.bandwidth() * 2) / 3} H ${x(
                                    nodeCycle.x
                                )}Z`;
                            } else if (i === 1) {
                                // second path
                                attribute = `M${x(nodeCycle.x)} ${x(nodeCycle.y)! + (x.bandwidth() * 2) / 3} H ${x(nodeCycle.x)! + x.bandwidth()} V ${x(nodeCycle.y)! + x.bandwidth() / 3} H ${x(
                                    nodeCycle.x
                                )}Z`;
                            } else if (i === 2) {
                                // third path
                                attribute = `M${x(nodeCycle.x)} ${x(nodeCycle.y)! + x.bandwidth() / 3} H ${x(nodeCycle.x)! + x.bandwidth()} V ${x(nodeCycle.y)} H ${x(nodeCycle.x)} Z`;
                            }
                        } else if (cycles.length === 4) {
                            if (i === 0) {
                                // first path
                                attribute = `M${x(nodeCycle.x)} ${x(nodeCycle.y)} L${x(nodeCycle.x)! + x.bandwidth() / 2} ${x(nodeCycle.y)! + x.bandwidth()}L${x(nodeCycle.x)! + x.bandwidth()} ${x(
                                    nodeCycle.y
                                )}Z`;
                            } else if (i === 1) {
                                // second path
                                attribute = `M${x(nodeCycle.x)! + x.bandwidth()} ${x(nodeCycle.y)! + x.bandwidth()}L${x(nodeCycle.x)! + x.bandwidth() / 2} ${x(nodeCycle.y)! + x.bandwidth() / 2} L${
                                    x(nodeCycle.x)! + x.bandwidth()
                                } ${x(nodeCycle.y)}Z`;
                            } else if (i === 2) {
                                // third path
                                attribute = `M${x(nodeCycle.x)! + x.bandwidth() / 2} ${x(nodeCycle.y)! + x.bandwidth() / 2}L${x(nodeCycle.x)}  ${x(nodeCycle.y)! + x.bandwidth()}L${
                                    x(nodeCycle.x)! + x.bandwidth()
                                } ${x(nodeCycle.y)! + x.bandwidth()} Z`;
                            } else if (i === 3) {
                                // fourth path
                                attribute = `M${x(nodeCycle.x)} ${x(nodeCycle.y)} L${x(nodeCycle.x)} ${x(nodeCycle.y)! + x.bandwidth()} L${x(nodeCycle.x)! + x.bandwidth() / 2} ${
                                    x(nodeCycle.y)! + x.bandwidth() / 2
                                }Z`;
                            }
                        }

                        return attribute;
                    })

                    .attr('fill', (d, i) => {
                        //b,y,r
                        // const cycle1Color = "#3366cc";
                        // const cycle2Color = "#6d8695";
                        // const cycle3Color = "#a8a75e";
                        // const cycle4Color = "#e2c727";
                        // const cycle5Color = "#ffb80a";
                        // const cycle6Color = "#ff7b07";
                        // const cycle7Color = "#ff3d03";
                        // const cycle8Color = "#ff0000";
                        //현재 적용된 칼라
                        // const cycle1Color = "#dc452a";
                        // const cycle2Color = "#e79324";
                        // const cycle3Color = "#efc62a";
                        // const cycle4Color = "#8dc63f";
                        // const cycle5Color = "#01aa83";
                        // const cycle6Color = "#00b1f0";
                        // const cycle7Color = "#056baf";
                        // const cycle8Color = "#56346e";
                        //yellow
                        // const cycle1Color = "#ffff00";
                        // const cycle2Color = "#d9e13c";
                        // const cycle3Color = "#b7c351";
                        // const cycle4Color = "#99a55e";
                        // const cycle5Color = "#7f8766";
                        // const cycle6Color = "#6c676a";
                        // const cycle7Color = "#62446a";
                        // const cycle8Color = "#660066";
                        //rainbow
                        // const cycle1Color = "#cb2026";
                        // const cycle2Color = "#f8991d";
                        // const cycle3Color = "#f6eb14";
                        // const cycle4Color = "#40b549";
                        // const cycle5Color = "#35c0ca";
                        // const cycle6Color = "#3b2f8e";
                        // const cycle7Color = "#7f469b";
                        // const cycle8Color = "#000000";
                        // //방새연
                        // const cycle1Color = "#3288bd";
                        // const cycle2Color = "#6fa6b6";
                        // const cycle3Color = "#9cc5b3";
                        // const cycle4Color = "#cae4b4";
                        // const cycle5Color = "#ffd593";
                        // const cycle6Color = "#faa974";
                        // const cycle7Color = "#ef7c61";
                        // const cycle8Color = "#e14958";
                        // //이진혁
                        // const cycle1Color = "#ffbf63";
                        // const cycle2Color = "#e4c168";
                        // const cycle3Color = "#c4c26d";
                        // const cycle4Color = "#9dc374";
                        // const cycle5Color = "#5ebaa5";
                        // const cycle6Color = "#5aa5b5";
                        // const cycle7Color = "#558ec6";
                        // const cycle8Color = "#5075d8";
                        // //송채연
                        // const cycle1Color = "#926591";
                        // const cycle2Color = "#8691bd";
                        // const cycle3Color = "#85b7db";
                        // const cycle4Color = "#9edcd8";
                        // const cycle5Color = "#c6dab3";
                        // const cycle6Color = "#d7ab7c";
                        // const cycle7Color = "#e0764c";
                        // const cycle8Color = "#e22a20";
                        //김소민
                        const cycle1Color = '#d53e4f';
                        const cycle2Color = '#f46d43';
                        const cycle3Color = '#fdae61';
                        const cycle4Color = '#fee08b';
                        const cycle5Color = '#e6f598';
                        const cycle6Color = '#abdda4';
                        const cycle7Color = '#66c2a5';
                        const cycle8Color = '#3288bd';
                        let color = '#000000';

                        switch (d) {
                            case 0:
                                color = cycle1Color;
                                break;
                            case 1:
                                color = cycle2Color;
                                break;
                            case 2:
                                color = cycle3Color;
                                break;
                            case 3:
                                color = cycle4Color;
                                break;
                            case 4:
                                color = cycle5Color;
                                break;
                            case 5:
                                color = cycle6Color;
                                break;
                            case 6:
                                color = cycle7Color;
                                break;
                            case 7:
                                color = cycle8Color;
                                break;
                        }

                        return color;
                    });
            });
        }

        function mouseover(mouseEvent: MouseEvent, p: NodeCycle) {
            console.log('mouseover');
            d3.selectAll('.row text').classed('active', function (d, i) {
                return i === p.y;
            });
            d3.selectAll('.column text').classed('active', function (d, i) {
                return i === p.x;
            });
            // d3.selectAll(".row text").text("active", function (d, i) {
            //   return i + "";
            // });
        }

        function mouseout() {
            d3.selectAll('text').classed('active', false);
        }

        // // Add a group per neighborhood.
        // var group = svg.selectAll(".group")
        //   .data(layout.groups)
        //   .enter().append("g")
        //   .attr("class", "group")
        //   .on("mouseover", mouseover);

        // // Add a mouseover title.
        // group.append("title").text(function (d, i) {
        //   return node[i].name + ": " + formatPercent(d.value / 1163) + " of origins";
        // });

        //updateData()
        d3.select('#order').on('change', function () {
            // clearTimeout(timeout);
            //@ts-ignore
            if (this.value === 'name' || this.value === 'group') {
                selectVariable = '';
                //@ts-ignore
                order(this.value);
            } else {
                //@ts-ignore
                selectVariable = this.value;
                // selectvariable draw
                rowgSelection.each(rowFunction);
                console.log(d3.ascending(Number(selectVariable), 5));
            }
            //@ts-ignore
            //로직 추가 여기서 json을 불러와야 한다.
            // TODO, change, this.value가 뭐냐에 따라 cycle이 달라짐. 새로운 사이클 변수를 생성(저장).
            //변수를 만들어야함
        });

        function order(value: string) {
            //@ts-ignore
            x.domain(orders[value]);
            rowgSelection.each(rowFunction);

            rowTextSelection
                .transition()
                .duration(2500)
                .attr('x', -2)
                .attr('y', (d, i) => x(d[0].y)! + x.bandwidth() * 0.75)
                // .attr("dx", ".02em")
                .attr('font-size', '20%')
                .attr('text-anchor', 'end')
                .text(function (d, i) {
                    return nodes[i].name;
                });

            svg.selectAll('.column')
                .transition()
                .duration(2500)
                .attr('transform', function (d, i) {
                    return 'translate(' + x(i) + ')rotate(-90)';
                });
        }
    }, []);

    // 아래 return()은 html을 다루는 영역
    return (
        <div className="App">
            {/* <header>
        April 13, 2021
      </header> */}
            <h1>Sooyeonjang Counting Cycle</h1>
            <h2>{/* May 11, 2021 */}</h2>

            <aside style={{ marginTop: 0, marginRight: -200 }}>
                <div>
                    Order:{' '}
                    <select id="order">
                        <option value="name">by Time</option>
                        <option value="group">by Frequency</option>
                        <option value="0">by Cycle1</option>
                        <option value="1">by Cycle2</option>
                        <option value="2">by Cycle3</option>
                        <option value="3">by Cycle4</option>
                        <option value="4">by Cycle5</option>
                        <option value="5">by Cycle6</option>
                        <option value="6">by Cycle7</option>
                        <option value="7">by Cycle8</option>
                    </select>
                </div>

                <div>
                    Built with <a href="https://d3js.org/">d3.js</a>.
                </div>

                <p>
                    <b>Cycle Legend</b>
                </p>

                {/* <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100}}> */}

                {/* const cycle1Color = "#7dbbff";
            const cycle2Color = "#adc5a7";
            const cycle3Color = "#c4ca7a";
            const cycle4Color = "#dccf4e";
            const cycle5Color = "#f3d422";
            const cycle6Color = "#ff9c09";
            const cycle7Color = "#ff4e04";
            const cycle8Color = "#ff0000"; */}

                <div style={{ display: 'flex' }}>
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#dc452a', paddingRight: '10em' }}></rect>
                    </svg>
                    <div>Cycle 1</div>

                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#e79324', paddingRight: '10em' }}></rect>
                    </svg>
                    <div>Cycle 2</div>

                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#efc62a', paddingRight: '10em' }}></rect>
                    </svg>
                    <div>Cycle 3</div>

                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#8dc63f', paddingRight: '10em' }}></rect>
                    </svg>
                    <div>Cycle 4</div>
                </div>

                <div>
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#01aa83', paddingRight: '10em' }}></rect>
                    </svg>
                    Cycle 5
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#00b1f0', paddingRight: '10em' }}></rect>
                    </svg>
                    Cycle 6
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#056baf', paddingRight: '10em' }}></rect>
                    </svg>
                    Cycle 7
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect width="13" height="13" style={{ fill: '#56346e', paddingRight: '10em' }}></rect>
                    </svg>
                    Cycle 8
                </div>

                <div id="hi">
                    <b>Counting Cycle</b>
                </div>

                <div>
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <rect
                            width="13"
                            height="13"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></rect>
                    </svg>
                    1 Cycle
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <path
                            d="M13 0 L0 13 L13 13 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                        <path
                            d="M0 0 L0 13 L13 0 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                    </svg>
                    2 Cycles
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <path
                            d="M0 13 H 13 V 8.666 H 0 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                        <path
                            d="M0 8.66 H 13 V 4.333 H 0 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                        <path
                            d="M0 4.33 H 13 V 0 H 0 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                    </svg>
                    3 Cycles
                    <svg width="13" height="13" style={{ marginLeft: 7 }}>
                        <path
                            d="M0 0 L6.5 6.5 L13 0 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                        <path
                            d="M13 13 L6.5 6.5 L13 0 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                        <path
                            d="M6.5 6.5 L0 13 L13 13 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                        <path
                            d="M0 0 L0 13 L6.5 6.5 Z"
                            style={{
                                fill: 'none',
                                stroke: 'black',
                                strokeWidth: '1',
                                paddingRight: '10em',
                            }}
                        ></path>
                    </svg>
                    4 Cycles
                </div>
            </aside>
        </div>
    );
}

export default App;
