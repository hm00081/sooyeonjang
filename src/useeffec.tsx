// import { useEffect } from 'react';
// import * as d3 from 'd3';

// interface Syj {
//     nodes: { name: number; group: number }[];//array
//     links: { source: string; target: string; value: number }[];//array
// }
// interface NodeCycle {
//     x: number;
//     y: number;
//     z: number;
//     nodeIndex: number;
// }

// const syj: Syj = require('./data/0508.json');
// const cc: number[][] = require('./data/double_array.json'); //2차원배열

// export default function useeffec() {

// useEffect(() => {
//     // useEffecct 함수가 mounted 코드 역할을 하는 것 같습니다.
//     // 여기에 initialize, remove, updateData, initDraw, updateDraw를 순서대로 불러 줍니다.
//     // 하단 코드들을 보니 1번 ~ 4번 코드가 어느 정도 섞인 상황인 것 같아, 기능 별로 함수로 빼두고 여기서 불러 오는 형식으로 진행하시면 될 것 같습니다.
//     let selectVariable: string = '';
//     var margin = { top: 250, right: 200, bottom: 10, left: 50 },
//         width = 3000,
//         height = 3000;

//     const x = d3 // node modules에서 d3 import
//         .scaleBand<number>() //x축
//         .range([0, width])
//         .domain(d3.range(syj.nodes.length));

//     // var x = d3.scaleOrdinal().rangeBands([0, width]),
//     // const z = d3.scaleLinear().domain([0, 300]).clamp(true); // y축
//     //@ts-ignore
//     // const c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10)); //color 조정group에 의해 색조절이 된다

//     const svg = d3
//         .select('body')
//         .append('svg')
//         .attr('width', width + margin.left + margin.right)
//         .attr('height', height + margin.top + margin.bottom)
//         .style('margin-left', margin.left + 'px')
//         .call(
//             //@ts-ignore
//             d3.zoom().on('zoom', (event) => {
//                 svg.attr('transform', () => event.transform);
//             })
//         ) //zoomevent
//         .append('g')
//         .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
//     const matrix: NodeCycle[][] = [];

//     const nodes = syj.nodes;
//     const n = nodes.length;
//     // Compute index per node.
//     //@ts-ignore
//     nodes.forEach(function (node, i) {
//         //@ts-ignore
//         node.index = i;
//         //@ts-ignore
//         node.count = 0;
//         matrix[i] = d3.range(n).map(function (j) {
//             //map은 return문을 통해 새로운 배열을 생성하여 호출
//             return { x: j, y: i, z: 0, nodeIndex: j };
//         });
//     });

//     // Convert links to matrix; count character occurrences.
//     //@ts-ignore
//     syj.links.forEach(function (link) {
//         //@ts-ignore
//         matrix[link.source][link.target].z += link.value;
//         //@ts-ignore
//         matrix[link.target][link.source].z += link.value;
//         //@ts-ignore
//         matrix[link.source][link.source].z += link.value;
//         //@ts-ignore
//         matrix[link.target][link.target].z += link.value;
//         //@ts-ignore
//         nodes[link.source].count += link.value;
//         //@ts-ignore
//         nodes[link.target].count += link.value;
//     });

//     // Precompute the orders.
//     const orders = {
//         name: d3.range(n).sort(function (a, b) {
//             return d3.ascending(nodes[a].name, nodes[b].name); //1~440까지 ascending
//         }),

//         // count: d3.range(n).sort(function (a, b) {
//         //   //@ts-ignore
//         //   return nodes[b].count - nodes[a].count;
//         // }),
//         group: d3.range(n).sort(function (a, b) {
//             return nodes[b].group - nodes[a].group;
//         }),
//     };

// };

export {};
