import '../scss/choice-common.scss';
import '../scss/choice-desktop.scss';
import '../scss/choice-mobile.scss';
import json_loading from '../anim/loading.json';
import json_refresh from '../anim/refresh.json';
import json_star from '../anim/star.json';

class Choice {
	constructor() {
		this.$round = document.querySelector('p.round');
		this.$name1 = document.querySelector('p#name1');
		this.$name2 = document.querySelector('p#name2');
		this.$star1 = document.querySelector('div#star1');
		this.$star2 = document.querySelector('div#star2');
		this.$wrapper1 = document.querySelector('div#wrapper1');
		this.$wrapper2 = document.querySelector('div#wrapper2');
		this.$img1 = document.querySelectorAll('div#wrapper1 > img');
		this.$img2 = document.querySelectorAll('div#wrapper2 > img');
		this.$heart1 = document.querySelector('button#heart1');
		this.$heart2 = document.querySelector('button#heart2');
		this.$refresh = document.querySelector('div#refresh');
		this.$refreshBack = document.querySelector('div.refresh-back');
		this.$loading = document.querySelector('div.loading');
		this.$twinkle = document.querySelector('div#twinkle');
		this.$transitions = document.querySelectorAll('div.transition');
		this.$modal = document.querySelector('div.modal');
		this.$modalImage = document.querySelector('div.modal > img');
	}

	setEventListener() {
		// handle image load, error, and click event
		this.$img1.forEach((img) => img.addEventListener('load', (e) => this.handleImageLoad(e.target)));
		this.$img2.forEach((img) => img.addEventListener('load', (e) => this.handleImageLoad(e.target)));
		this.$img1.forEach((img) => img.addEventListener('error', (e) => this.handleImageError(e.target)));
		this.$img2.forEach((img) => img.addEventListener('error', (e) => this.handleImageError(e.target)));
		this.$img1.forEach((img) => img.addEventListener('click', (e) => this.handleImageClick(e.target)));
		this.$img2.forEach((img) => img.addEventListener('click', (e) => this.handleImageClick(e.target)));

		// click the round text to renew the tournament
		this.$round.addEventListener('click', async (e) => {
			if (confirm('처음부터 다시 시작하시겠습니까?')) {
				const response = await fetch('choice/match', { method: 'DELETE' });
				if (response.ok) {
					window.location.reload();
				} else {
					alert(`${response.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
				}
			}
		});

		// handle click event of heart buttons to choose one
		this.$heart1.addEventListener('click', (e) =>
			this.handleHeartClick(e.target, this.res1._id, this.$star1, this.anim.star1)
		);
		this.$heart2.addEventListener('click', (e) =>
			this.handleHeartClick(e.target, this.res2._id, this.$star2, this.anim.star2)
		);

		// handle mouse in and out event of refresh button
		if (window.innerWidth >= 1280) {
			this.$refresh.addEventListener('mouseover', (e) => (this.$refreshBack.style.transform = 'scale(1.5)'));
			this.$refresh.addEventListener('mouseout', (e) => (this.$refreshBack.style.transform = 'scale(1.0)'));
		}

		// handle click event of refresh button to refresh images
		this.$refresh.addEventListener('click', async (e) => {
			if (this.progressing) {
				return;
			}
			this.progressing = true;
			this.loadedImages = 0;
			this.isFullRefresh = false;
			this.anim.loading.play();
			this.$loading.style.display = 'block';
			this.$loading.style.transition = 'all ease-in-out 400ms';
			await new Promise((resolve) => setTimeout(resolve, 10)); // wait for changing style
			await this.animate(this.$loading, 'idle'); // wait for transition
			this.res1.indices = this.setRandomImages(this.res1.images, this.$img1, this.timeout['1']);
			this.res2.indices = this.setRandomImages(this.res2.images, this.$img2, this.timeout['2']);
			this.progressing = false;
		});

		// handle click event of modal to hide
		this.$modal.addEventListener('click', async (e) => {
			await this.animate(this.$modal, 'show'); // wait for transition
			this.$modal.style.display = 'none';
		});
	}

	loadAnimations() {
		this.anim = {
			// top left animation when the user choose left one
			star1: lottie.loadAnimation({
				container: document.querySelector('div#star1'),
				renderer: 'svg',
				animationData: json_star,
				autoplay: false,
				loop: false
			}),
			// top right animation when the user choose right one
			star2: lottie.loadAnimation({
				container: document.querySelector('div#star2'),
				renderer: 'svg',
				animationData: json_star,
				autoplay: false,
				loop: false
			}),
			// center animation button for changing current images
			refresh: lottie.loadAnimation({
				container: document.querySelector('div#refresh'),
				renderer: 'svg',
				animationData: json_refresh,
				autoplay: true,
				loop: true
			}),
			// loading animation used in refresh moments
			loading: lottie.loadAnimation({
				container: document.querySelector('div#twinkle'),
				renderer: 'svg',
				animationData: json_loading,
				autoplay: true,
				loop: true
			})
		};
		// initialize frame to 0 when the animation is completed
		this.anim.star1.addEventListener('complete', () => this.anim.star1.goToAndStop(0, true));
		this.anim.star2.addEventListener('complete', () => this.anim.star2.goToAndStop(0, true));
	}

	async loadImages() {
		const response = await fetch('choice/match', { cache: 'no-cache' }); // get two random members images
		if (response.ok) {
			const json = await response.json();
			this.timeout = { 1: [0, 0, 0, 0], 2: [0, 0, 0, 0] }; // image loading timeout handler
			this.loadedImages = 0; // to check all images are ready to show
			this.isFullRefresh = true;
			this.res1 = json.results[0]; // _id, name, images
			this.res2 = json.results[1]; // _id, name, images
			this.res1.indices = this.setRandomImages(this.res1.images, this.$img1, this.timeout['1']);
			this.res2.indices = this.setRandomImages(this.res2.images, this.$img2, this.timeout['2']);
			this.$round.innerText = json.round;
		} else {
			if (response.status === 403) {
				return (window.location = '.');
			}
			alert(`${response.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
		}
	}

	// wait for the transition is ended and resolve
	animate(element, transit) {
		return new Promise(async (resolve) => {
			// declare the event listener to use recursively
			const listener = (e) => {
				if (element === e.target) {
					element.removeEventListener('transitionend', listener); // remove this listener
					resolve();
				}
			};
			element.addEventListener('transitionend', listener); // add event listener first
			await new Promise((resolve) => setTimeout(resolve, 10)); // wait for event added
			element.classList.toggle(transit); // transition code here
		});
	}

	// random select four images in the server images list without overlap
	setRandomImages(images, elements, timeout) {
		const set = new Set(); // for avoiding overlap
		while (set.size < 4) {
			set.add(Math.floor(Math.random() * images.length));
		}
		const arr = Array.from(set); // convert to array
		elements.forEach((element, i) => {
			element.setAttribute('index', arr[i]); // random selected number
			element.setAttribute('src', images[arr[i]]); // image address
			// set image load timeout
			timeout[i] = setTimeout(() => this.handleImageError(element), 2000);
		});
		return arr;
	}

	async handleImageClick(target) {
		const src = target.getAttribute('src');
		this.$modalImage.setAttribute('src', src);
		this.$modal.style.display = 'block';
		await new Promise((resolve) => setTimeout(resolve, 10)); // wait for changing style
		this.$modal.classList.add('show');
	}

	async handleHeartClick(target, _id, container, animation) {
		if (this.progressing) {
			return;
		}
		this.progressing = true;
		animation.play(); // play the star animation
		container.style.opacity = 1; // show the star animation container
		await this.animate(target, 'selected'); // wait for transition
		target.style.display = 'none';
		target.classList.remove('selected');
		await new Promise((resolve) => setTimeout(resolve, 10)); // wait for changing style
		// call the member selection api
		const body = { _id };
		const response = await fetch('choice/match', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify(body)
		});
		if (response.ok) {
			const json = await response.json();
			if (json.game === 'continue') {
				// this is not last match so ready to show the next images
				this.anim.loading.play();
				this.$loading.style.display = 'block';
				this.$loading.style.transition = 'all ease-in-out 400ms';
				await new Promise((resolve) => setTimeout(resolve, 10)); // wait for changing style
				container.style.opacity = 0; // hide the star animation container
				this.$name1.classList.remove('show');
				this.$name2.classList.remove('show');
				await this.animate(this.$loading, 'idle'); // wait for transition
				this.$loading.style.transition = 'all ease-in-out 400ms 1000ms';
				target.style.display = 'block';
				this.loadImages(); // start next round
			} else {
				// this is last match so redirect to result page
				window.location = 'winner';
			}
		} else {
			alert(`${response.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
		}
		this.progressing = false;
	}

	// onload event occurred in img tag
	async handleImageLoad(target) {
		// clear image load timeout
		const side = target.getAttribute('side');
		const i = Number(target.getAttribute('i'));
		if (this.timeout[side][i] !== 0) {
			clearTimeout(this.timeout[side][i]);
			this.timeout[side][i] = 0;
		}
		// all images are successfully loaded
		if (++this.loadedImages === 8) {
			this.anim.loading.stop();
			if (this.isFullRefresh) {
				// if the user clicked heart button
				this.$twinkle.classList.add('play');
				for (const transition of this.$transitions) {
					transition.classList.add('play');
				}
				// declare the event listener to use recursively
				const startListener = (e) => {
					if (this.$loading === e.target) {
						this.$loading.removeEventListener('transitionstart', startListener); // remove this listener
						this.$name1.innerText = this.res1.name;
						this.$name2.innerText = this.res2.name;
						this.$name1.classList.add('show');
						this.$name2.classList.add('show');
					}
				};
				// declare the event listener to use recursively
				const endListener = (e) => {
					if (this.$loading === e.target) {
						this.$loading.removeEventListener('transitionend', endListener); // remove this listener
						this.$twinkle.classList.remove('play');
						for (const transition of this.$transitions) {
							transition.classList.remove('play');
						}
						this.$loading.style.display = 'none';
						this.$loading.classList.replace('play', 'idle');
					}
				};
				this.$loading.addEventListener('transitionstart', startListener); // add transitionstart event listener first
				this.$loading.addEventListener('transitionend', endListener); // add transitionend event listener first
				this.$loading.classList.add('play'); // start transition
			} else {
				// if the user clicked refresh button
				await this.animate(this.$loading, 'play'); // wait for transition
				this.$loading.style.display = 'none';
				this.$loading.classList.replace('play', 'idle');
			}
		}
	}

	// onerror event occurred in img tag
	handleImageError(target) {
		// remove the error image in server images list and random select new image
		const handle = (target, images, indices, side) => {
			const index = Number(target.getAttribute('index'));
			images.splice(index, 1); // delete error image url
			const temp = indices.indexOf(index);
			indices.splice(temp, 1);
			indices = indices.map((i) => (i < index ? i : i - 1));
			let random = Math.floor(Math.random() * images.length);
			while (indices.includes(random)) {
				random = Math.floor(Math.random() * images.length);
			}
			target.setAttribute('index', random); // random selected number
			target.setAttribute('src', images[random]); // image address
			// set image load timeout
			const i = Number(target.getAttribute('i'));
			if (this.timeout[side][i] !== 0) {
				clearTimeout(this.timeout[side][i]);
			}
			this.timeout[side][i] = setTimeout(() => this.handleImageError(target), 2000);
			// add random index to indices and return
			indices.splice(temp, 0, random);
			return indices;
		};
		// handle the current target using the function above
		const side = target.getAttribute('side');
		switch (side) {
			case '1':
				this.res1.indices = handle(target, this.res1.images, this.res1.indices, side);
				break;
			case '2':
				this.res2.indices = handle(target, this.res2.images, this.res2.indices, side);
				break;
		}
	}
}

(() => {
	const choice = new Choice();
	choice.setEventListener();
	choice.loadAnimations();
	choice.loadImages();
})();
