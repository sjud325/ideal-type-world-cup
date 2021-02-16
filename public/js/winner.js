import '../scss/winner-common.scss';
import '../scss/winner-desktop.scss';
import '../scss/winner-mobile.scss';
import json_fireworks from '../anim/fireworks.json';

class Winner {
	constructor() {
		this.$name = document.querySelector('p.name');
		this.$guide = document.querySelector('p.guide');
		this.$total = document.querySelector('p.total');
		this.$tournament = document.querySelector('div#tournament');
		this.$desc = document.querySelector('p.desc');
		this.$again = document.querySelector('button#again');
	}

	setEventListener() {
		let timer;
		window.addEventListener('resize', (e) => {
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(() => {
				if (e.target.innerWidth < 1280) {
					this.$desc.innerText = '월드컵 대진표는 1280px 이상의 데스크탑 또는 태블릿에서 볼 수 있습니다.';
					return;
				} else {
					this.$desc.innerText = '월드컵 대진표는 16강부터 표시됩니다.';
				}
				const node = this.generateTree(this.d3Data);
				for (const child of this.$tournament.children) {
					child.remove();
				}
				this.$tournament.appendChild(node);
				this.refineTree();
			}, 500);
		});
		this.$again.addEventListener('click', (e) => (window.location = '.'));
	}

	loadAnimations() {
		this.anim = {
			fireworks1: lottie.loadAnimation({
				container: document.querySelector('div#fireworks1'),
				renderer: 'svg',
				animationData: json_fireworks,
				autoplay: false, // play below
				loop: true
			}),
			fireworks2: lottie.loadAnimation({
				container: document.querySelector('div#fireworks2'),
				renderer: 'svg',
				animationData: json_fireworks,
				autoplay: false, // play below
				loop: true
			})
		};
		// delay for rotate3d transform
		setTimeout(() => {
			this.anim.fireworks1.play();
			this.anim.fireworks2.play();
		}, 500);
	}

	load() {
		this.$name.innerText = member.name;
		this.$guide.innerText = member.gender === 'male' ? '남자 연예인' : '여자 연예인';
		this.$total.innerHTML = [
			`다른 <span>${member.likes - 1}</span>명도 <span>${member.name}</span>`,
			`${this.getPostCharacter(member.name, '을', '를')} `,
			`선택했어요!`
		].join('');
		if (window.innerWidth < 1280) {
			this.$desc.innerText = '월드컵 대진표는 1280px 이상의 데스크탑 또는 태블릿에서 볼 수 있습니다.';
		} else {
			this.$desc.innerText = '월드컵 대진표는 16강부터 표시됩니다.';
		}
		results.reverse(); // reverse the array for easy handling
		if (results.length !== 15) {
			results = results.slice(0, 15); // tree only supports 16 rounds
		}
		this.d3Data = { name: member.name };
		// recursive function call for generating tree structure
		this.setChildren(this.d3Data, 0);
		setTimeout(() => {
			const node = this.generateTree(this.d3Data);
			this.$tournament.appendChild(node);
			this.refineTree();
		}, 500);
	}

	getPostCharacter(name, value1, value2) {
		const last = name.charCodeAt(name.length - 1);
		if (last < 44032 || last > 55203) {
			return ''; // if the last character is not belong to korean unicode range ('가' ~ '힣')
		}
		return (last - 44032) % 28 > 0 ? value1 : value2;
	}

	setChildren(data, index) {
		for (let i = index; i < results.length; i++) {
			if (data.name === results[i].winner.name) {
				data.children = [{}, {}];
				data.children[0].name = results[i].winner.name;
				data.children[1].name = results[i].loser.name;
				// find their children from the next index
				this.setChildren(data.children[0], i + 1);
				this.setChildren(data.children[1], i + 1);
				break;
			}
		}
	}

	// generate svg like tree using d3 library
	generateTree(data) {
		const root = d3.hierarchy(data);
		root.dx = this.$tournament.clientWidth / 2; // x coordinate of root node
		root.dy = 48; // y coordinate of root node
		// node size means width and height per node in tree element
		const tree = d3.tree().nodeSize([this.$tournament.clientWidth / 25, this.$tournament.clientHeight / 5])(root);
		const svg = d3.create('svg').attr('viewBox', [0, 0, this.$tournament.clientWidth, this.$tournament.clientHeight]);
		const g = svg.append('g').attr('class', 'node').attr('transform', `translate(${tree.dx},${tree.dy})`); // sams as root.dx, root.dy
		// create edge element between one node and next node
		const line = d3.line().curve(d3.curveStepBefore);
		g.append('g')
			.selectAll('path')
			.data(tree.links())
			.join('path')
			.attr('d', (d) =>
				line([
					[d.source.x, d.source.y],
					[d.target.x, d.target.y]
				])
			);
		// create node element, node means parent of rectangles and text
		const node = g
			.append('g')
			.selectAll('g')
			.data(tree.descendants())
			.join('g')
			.attr('transform', (d) => `translate(${d.x},${d.y})`);
		// add the rectangle to node
		node.append('rect')
			.attr('rx', 4)
			.attr('ry', 4)
			.attr('width', 68)
			.attr('height', 40)
			.attr('y', -20)
			.attr('x', (d) => {
				if (d.depth === 4) {
					if (d.data.name === d.parent.data.name) {
						return -46; // depth 4 and left child
					} else {
						return -22; // depth 4 and right child
					}
				} else {
					return -34; // depth 0, 1, 2, 3
				}
			})
			.attr('class', (d) => {
				if (d.parent === null || d.data.name === d.parent.data.name) {
					return 'winner'; // add class to change color
				}
			});
		// create text element to show the name of members
		const text = node.append('text').attr('class', (d) => {
			if (d.parent === null || d.data.name === d.parent.data.name) {
				return 'winner'; // add class to change color
			}
		});
		const tspan = text.append('tspan').text((d) => d.data.name.split(' ')[0]);
		// select text elements which have space in the name
		node.selectAll('text')
			.filter((d) => d.data.name.includes(' '))
			.append('tspan')
			.text((d) => d.data.name.split(' ')[1]);
		return svg.node(); // export to html element
	}

	// after rendering, refine the tree based on the width of tspan
	refineTree() {
		d3.selectAll('div#tournament > svg tspan')
			.attr('x', (d, i, arr) => {
				const { width } = arr[i].getBBox();
				if (d.depth === 4) {
					if (d.data.name === d.parent.data.name) {
						return -(width / 2) - 12; // depth 4 and left child
					} else {
						return -(width / 2) + 12; // depth 4 and right child
					}
				} else {
					return -(width / 2); // depth 0, 1, 2, 3
				}
			})
			.attr('y', (d, i, arr) => {
				if (arr[i].parentNode.children.length === 1) {
					return 4;
				} /* 2 */ else {
					if (arr[i] === arr[i].parentNode.children[0]) {
						return -5; // upper tspan
					} else {
						return 13; // below tspan
					}
				}
			});
	}
}

(() => {
	const winner = new Winner();
	winner.setEventListener();
	winner.loadAnimations();
	winner.load();
})();
