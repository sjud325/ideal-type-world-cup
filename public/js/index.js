import '../scss/index.scss';

class Index {
	constructor() {
		this.$gender = document.querySelector('div#gender');
		this.$gender0 = document.querySelector('p#gender0');
		this.$gender1 = document.querySelector('p#gender1');
		this.$round16 = document.querySelector('button#round16');
		this.$round32 = document.querySelector('button#round32');
		this.$round64 = document.querySelector('button#round64');
		this.$manage = document.querySelector('button#manage');
	}

	setInitialGender() {
		const random = Math.floor(Math.random() * 2);
		if (random === 0) {
			this.$gender0.style.top = '0px';
			this.$gender1.style.top = '48px';
			this.$gender.setAttribute('data-value', 'male');
		} /* 1 */ else {
			this.$gender0.style.top = '-48px';
			this.$gender1.style.top = '0px';
			this.$gender.setAttribute('data-value', 'female');
		}
		this.$gender0.style.transition = 'all 0.5s ease-in-out';
		this.$gender1.style.transition = 'all 0.5s ease-in-out';
	}

	setEventListener() {
		this.$gender.addEventListener('click', (e) => {
			const value = this.$gender.getAttribute('data-value');
			if (value === 'male') {
				this.$gender0.style.top = '-48px';
				this.$gender1.style.top = '0px';
				this.$gender.setAttribute('data-value', 'female');
			} /* 'female' */ else {
				this.$gender0.style.top = '0px';
				this.$gender1.style.top = '48px';
				this.$gender.setAttribute('data-value', 'male');
			}
			this.setDisabledState();
		});
		this.$round16.addEventListener('click', (e) => {
			const gender = this.$gender.getAttribute('data-value');
			window.location = 'choice?' + this.getParams({ gender, round: 16 });
		});
		this.$round32.addEventListener('click', (e) => {
			const gender = this.$gender.getAttribute('data-value');
			window.location = 'choice?' + this.getParams({ gender, round: 32 });
		});
		this.$round64.addEventListener('click', (e) => {
			const gender = this.$gender.getAttribute('data-value');
			window.location = 'choice?' + this.getParams({ gender, round: 64 });
		});
		this.$manage.addEventListener('click', (e) => {
			const gender = this.$gender.getAttribute('data-value');
			window.location = 'member?' + this.getParams({ gender });
		});
	}

	async setDisabledState() {
		try {
			const count = await this.getCounts();
			if (count < 64) {
				this.$round64.setAttribute('disabled', true);
			} else {
				this.$round64.removeAttribute('disabled');
			}
			if (count < 32) {
				this.$round32.setAttribute('disabled', true);
			} else {
				this.$round32.removeAttribute('disabled');
			}
			if (count < 16) {
				this.$round16.setAttribute('disabled', true);
			} else {
				this.$round16.removeAttribute('disabled');
			}
		} catch (error) {
			alert(`${error.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
		}
	}

	getCounts() {
		return new Promise(async (resolve, reject) => {
			const gender = this.$gender.getAttribute('data-value');
			const response = await fetch('member/count?' + this.getParams({ gender }));
			if (response.ok) {
				const json = await response.json();
				resolve(json.count);
			} else {
				reject(response);
			}
		});
	}

	getParams(obj) {
		const params = new URLSearchParams();
		for (const key of Object.keys(obj)) {
			params.append(key, obj[key]);
		}
		return params.toString();
	}
}

(() => {
	const index = new Index();
	index.setInitialGender();
	index.setEventListener();
	index.setDisabledState();
})();
