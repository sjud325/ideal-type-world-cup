import '../scss/member.scss';

class Member {
	constructor() {
		this.$title = document.querySelector('div.header > p');
		this.$count = document.querySelector('p#count');
		this.$guide = document.querySelector('p.guide');
		this.$members = document.querySelector('div.members');
		this.$addBtn = document.querySelector('div#append');
	}

	setEventListener() {
		document.body.addEventListener('keyup', (e) => {
			if (e.keyCode === 13 && e.target === document.body) {
				this.$addBtn.click();
			}
		});
		this.$addBtn.addEventListener('click', (e) => {
			const wrap = document.createElement('div');
			wrap.classList.add('wrap');
			wrap.classList.add('name');
			const input = document.createElement('input');
			input.setAttribute('type', 'text');
			wrap.appendChild(input);
			const div = document.createElement('div');
			div.classList.add('icon');
			div.classList.add('remove');
			wrap.appendChild(div);
			this.$members.insertBefore(wrap, this.$addBtn);
			input.focus(); // request focus for convenient UX
			input.addEventListener('keyup', async (e) => {
				// if the user press enter key and there is valid value
				if (e.keyCode === 13 && input.value.trim().length > 0) {
					try {
						const { name, all } = await this.append(input, wrap);
						this.$guide.innerText = `'${name}'이(가) 추가되었습니다.`;
						this.load(all);
					} catch (error) {
						if (error.status === 400) {
							alert('공백은 2개 이상 넣을 수 없습니다.');
						} else if (error.status === 403) {
							alert('동일한 이름이 등록되어 있습니다.');
						} else {
							alert(`${error.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
						}
					}
				}
			});
			wrap.addEventListener('click', async (e) => {
				// if the user click input element
				if (e.target === input) {
					return; // cancel this event
				}
				// if the user does not input anything, but click this element
				if (wrap.getAttribute('data-id') === null) {
					wrap.remove(); // just remove this element without calling api
					return;
				}
				try {
					const { name, all } = await this.remove(wrap);
					this.$guide.innerText = `'${name}'이(가) 제거되었습니다.`;
					this.load(all);
				} catch (error) {
					alert(`${error.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
				}
			});
		});
	}

	load(members) {
		if (members === undefined) {
			members = results;
		}
		const children = this.$members.querySelectorAll('div.name');
		for (const child of children) {
			child.remove(); // remove all members first
		}
		this.$title.innerText = gender === 'male' ? '남자 연예인 명단' : '여자 연예인 명단';
		this.$count.innerHTML = `현재 등록된 인원 <span>${members.length}</span>명`;
		for (const member of members) {
			const wrap = document.createElement('div');
			wrap.classList.add('wrap');
			wrap.classList.add('name');
			// remember results in data attributes
			wrap.setAttribute('data-id', member._id);
			wrap.setAttribute('data-name', member.name);
			const p = document.createElement('p');
			p.innerText = member.name;
			wrap.appendChild(p);
			const div = document.createElement('div');
			div.classList.add('icon');
			div.classList.add('remove');
			wrap.appendChild(div);
			wrap.addEventListener('click', async (e) => {
				try {
					const { name, all } = await this.remove(wrap);
					this.$guide.innerText = `'${name}'이(가) 제거되었습니다.`;
					this.load(all);
				} catch (error) {
					alert(`${error.status} 오류가 발생했습니다.\n관리자에게 문의해주세요.`);
				}
			});
			this.$members.insertBefore(wrap, this.$addBtn);
		}
	}

	append(target, parent) {
		return new Promise(async (resolve, reject) => {
			const body = { name: target.value.trim(), gender };
			const response = await fetch('member', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
				body: JSON.stringify(body)
			});
			if (response.ok) {
				const json = await response.json();
				resolve({ name: json.results.name, all: json.all });
			} else {
				reject(response);
			}
		});
	}

	remove(target) {
		return new Promise(async (resolve, reject) => {
			const body = { _id: target.getAttribute('data-id'), gender };
			const response = await fetch('member', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
				body: JSON.stringify(body)
			});
			if (response.ok) {
				const json = await response.json();
				const name = target.getAttribute('data-name');
				resolve({ name, all: json.all });
			} else {
				reject(response);
			}
		});
	}
}

(() => {
	const member = new Member();
	member.setEventListener();
	member.load();
})();
