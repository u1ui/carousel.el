// todo add privet fields
/* element */
class u1Carousel extends HTMLElement {
		constructor() {
        super();

        let shadowRoot = this.attachShadow({mode:'open'});

		var svg = '<svg viewBox="0 0 9 18" width="9" height="18"><path d="M1 1l7 8-7 8"/></svg>';

        shadowRoot.innerHTML = `
        <style>
			:host {
				position:relative;
				contain: layout;
			}
			:host .-arrow {
				position: absolute;
				padding:1rem;
				top: 0;
				bottom: 0;
				display:flex;
				cursor: pointer;
				border:none;
				background:none;
				user-select: none;
				width:auto;
				z-index: 1;
				align-items: center;
				flex:0 0 auto; /* grow if controls are static */
				stroke-linejoin:round;
				stroke-linecap:round;
				stroke-width:.1rem;
				box-sizing:content-box;
				contain:layout;
			}
			:host .-prev { left: 0; }
			:host .-next { right: 0; }

			:host > .-arrow svg {
				fill:none;
				flex:1 1 auto;
				height: auto;
				stroke:currentColor;
				max-height:100%;
			}
			:host > .-prev svg {
				transform:rotate(180deg);
			}
			:host([item-count="0"]) > .-arrow, :host([item-count="1"]) > .-arrow {
				display:none;
			}
			:host > slot.body {
				flex:1 1 auto; /* grow if controls are static */
			}
			::slotted([name=prev]) {
				display:block;
			}

			/* slide */
			:host([mode=slide]) {
				/*
				todo: important is too strong! what can i do to make just overwrite the css
				clip: prevent focus-scroll
				*/
				overflow:hidden !important;
				overflow:clip !important;
			}
			:host([mode=slide]) > slot.body {
				width:100%; /* needed bud why? */
				display:flex;
				transition: transform var(--u1-carousel-animation-speed, .7s) ease-out;
				will-change: transform;
				overflow: visible;
			}
			/* scroll */
			:host([mode=scroll]) {
				overflow:visible !important;
			}
			:host([mode=scroll]) > slot.body {
				display:flex;
				overflow:hidden !important;
			}
			/* fade */
			:host([mode=fade]) {
				display:flex !important;
				z-index:0;
				overflow: visible !important;
			}
			:host([mode=fade]) > slot.body {
				display:flex;
			}
			:host([mode=fade]) ::slotted(*) {
				transition:opacity var(--u1-carousel-animation-speed, .7s) ease-in-out;
				will-change: opacity;
				opacity:0;
				margin-left:-100% !important;
			}
			:host([mode=fade]) ::slotted(:first-child)  {
				margin-left:0 !important;
			}
			:host([mode=fade]) > slot > :first-child {
				margin-left:0 !important;
			}
			:host([mode=fade]) ::slotted([aria-hidden=false]) {
				opacity:1;
				z-index:1;
			}
		</style>
		<button part="control prev" class="-arrow -prev" aria-label="previous slide">
			<slot name=prev>${svg}</slot>
		</button>
        <slot class=body></slot>
		<button part="control next" class="-arrow -next" aria-label="next slide">
			<slot name=next>${svg}</slot>
		</button>
        `;

		/*
		var mode = this.getAttribute('mode');
		if (!u1Carousel.mode[mode]) {
			mode = 'slide'
			this.setAttribute('mode','slide');
		}
		this.handler = u1Carousel.mode[mode];
		this.handler.init && this.handler.init.call(this);
		this.dispatchEvent(new CustomEvent('u1-carousel.init',{bubbles:true}));
		*/

		setTimeout(()=>{ !this.active && this.next(); }); // this way i can add eventlistener that reacts to the change
		this._nextDelayed = this._nextDelayed.bind(this);


		this.slider = this.shadowRoot.querySelector('slot.body');

		this.mode = this.getAttribute('mode');


		var prev = this.shadowRoot.querySelector('.-prev');
		var next = this.shadowRoot.querySelector('.-next');
		next.addEventListener('click',()=>this.next());
		prev.addEventListener('click',()=>this.prev());

    }
	static get observedAttributes() {
		return ['play', 'mode', 'tabindex'];
	}
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'play') {
			let play = this.hasAttribute('play');
			this[play?'play':'stop']();
		}
		if (name === 'mode') {
			this.mode = newValue;
		}
	}
	set mode(mode){
		if (!u1Carousel.mode[mode]) mode = 'slide';
		this.setAttribute('mode', mode);
		this.handler = u1Carousel.mode[mode];
		this.handler.init && this.handler.init.call(this);
	}
	get mode(){
		return this.getAttribute('mode')
	}
	_items(){
		return this.slider.assignedElements({flatten:true});
	}
	activeIndex(){
		return Array.prototype.indexOf.call(this._items(), this.active);
//		return Array.prototype.indexOf.call(this.children, this.active); // todo: use assignedElements ?
	}
    slideTo(target){
//		if (typeof target === 'number') target = this.children[target]; // by index
		if (typeof target === 'number') target = this._items()[target]; // by index

//		if (Array.from(this.children).indexOf(target) === -1) {
		if (Array.from(this._items()).indexOf(target) === -1) {
			console.error('target not a child of this slider!')
		}


		if (this.active !== target) { // just trigger if not active
//			for (let child of this.children) {
			for (let child of this._items()) {
				child.setAttribute('aria-hidden', target !== child);
			}
			this.active = target;

			target.dispatchEvent(new CustomEvent('u1-carousel.slide',{
				bubbles:true,
				detail:{
					slide:target,
					index:Array.prototype.indexOf.call(this._items(), target),
//					index:Array.prototype.indexOf.call(this.children, target),
					slider:this,
				}
			}));
		}
        this.handler.slideTo && this.handler.slideTo.call(this, target);
    }
    next(){ this.slideTo(this._sibling('next')); }
    prev(){ this.slideTo(this._sibling('prev')); }

    _sibling(direction){
		const items = this._items();
//        var sibling = this.active || this.lastElementChild;
        var sibling = this.active || items.at(-1);
		const index = this.activeIndex();
		if (!sibling) return; // no slide
        while (1) {
            var sibling = direction === 'prev'
//				? sibling.previousElementSibling || this.lastElementChild
//				: sibling.nextElementSibling     || this.firstElementChild;
				? items[index-1] || items.at(-1)
                : items[index+1] || items.at(0);
			break; // also hidden
            // if (sibling.offsetParent) break; // next visible // can cause infinite loops!!
            if (sibling === this.active) break; // only one
        }
        return sibling;
    }
    // auto play
    play(){
		this.addEventListener('u1-carousel.slide', this._nextDelayed);
        this._nextDelayed();
    }
    stop(){
		this.removeEventListener('u1-carousel.slide', this._nextDelayed)
        clearTimeout(this._nextDelayedTimeout);
    }
    _nextDelayed(){
        clearTimeout(this._nextDelayedTimeout);

		let speed = this.customProperty('slideshow-speed');
		if (speed==='') speed = '6000';
		var unit = speed.match(/[^0-9]*$/)[0];
		speed = parseFloat(speed);
		if (unit === 's') speed *= 1000;

		this._nextDelayedTimeout = setTimeout(()=>{
			if (this.contains(document.activeElement)) return;
            this.next();
		},speed);
	}
	customProperty(property){
		return getComputedStyle(this).getPropertyValue('--u1-carousel-'+property);
	}
	connectedCallback() {
		this.hasAttribute('play') && this.play();
//		this.setAttribute('item-count', this.children.length); // todo, dynamic react on dynamic added slides, mutation observer?
		this.setAttribute('item-count', this._items().length); // todo, dynamic react on dynamic added slides, mutation observer?
    }
}


u1Carousel.mode = {};
// scroll
u1Carousel.mode.scroll = {
    slideTo:function(target){
		//target.scrollIntoView({behavior:'smooth', inline:'center', block: 'nearest'}); /* -safari, scrolls not only the carousel-viewport */
		let left = target.offsetLeft - this.slider.offsetLeft;
		/* todo?
		let sliderCenter = this.slider.offsetWidth / 2;
		let targetCenter = target.offsetWidth / 2;
		let left = target.offsetLeft - (sliderCenter - targetCenter) - this.slider.offsetLeft;
		*/
		this.slider.scroll({ // todo: better calculation of offset
			top: target.offsetTop,
			left: left,
			behavior: 'smooth'
		});
	},
	init:function(){
		this.slider.style.transform = ''; // if changed from mode=slide
	}
}
// slide
u1Carousel.mode.slide = {
	init:function(){
		//this.addSwipe();
	},
	slideTo:function(target){
		//requestAnimationFrame(()=>{
			this.slider.style.transform = 'translateX(-'+(100*this.activeIndex())+'%)';
			//this.scrollLeft = 0; // prevent "focus-scroll"?
		//});
	},
}
// fade (entirely done by css)
u1Carousel.mode.fade = {
	init:function(){
		this.slider.style.transform = ''; // if changed from mode=slide
	}
}


customElements.define('u1-carousel', u1Carousel)


// slide on target
function hashchange(){
	if (!location.hash) return;
	var el = document.getElementById(location.hash.substr(1));
	if (!el) return;
	var slide = el.closest('u1-carousel > *');
	if (!slide) return;
	var sliderEl = slide.parentElement;
	sliderEl.slideTo(slide);
}
addEventListener('DOMContentLoaded', hashchange);
addEventListener('hashchange', hashchange);
// slide on focus
addEventListener('focusin', e=>{
	let el = document.activeElement;
	//if (!el) return;
	var slide = el.closest('u1-carousel > *');
	if (!slide) return;
	var sliderEl = slide.parentElement;
	sliderEl.slideTo(slide);
});
// keyboard nav
addEventListener('keydown', ({target,code})=>{
	if (target.tagName !== 'U1-CAROUSEL') return;
	if (code === 'ArrowRight') target.next();
	if (code === 'ArrowLeft')  target.prev();
});




/*
u1Carousel.prototype.addSwipe = function(){
	c1.c1Use('pointerObserver',function(){
		var pO = this.pointerObserver = new c1.pointerObserver(this);
		var startX = 0;
		pO.onstart = function(e){
			//e.preventDefault(); // enable drag image, can not select text
			startX = getComputedTranslate(this).x;
			this.style.transform = 'translateX('+startX+'px)';
			this.style.transition = 'none';
		}
		pO.onmove = function(){
			var to = (this.startDiff().x*1) + startX;
			this.style.transform = 'translateX('+to+'px)';
		}
		pO.onstop = function(){
			var x = -getComputedTranslate(this).x;
			var add = this.lastDiff().x * 50;
			add = Math.max(-this.offsetWidth, Math.min(add, this.offsetWidth));
			x -= add;
			var next = Math.round(x / this.offsetWidth);
			next = Math.max(0, Math.min(next, this.children.length-1));
			next = this.children[next];
			if (!next) next = this.active;
			this.style.transition = '';
			this.slideTo(next);
		}
	});
}
function getComputedTranslate(el) {
	var style = getComputedStyle(el);
	var matrix = new (window.WebKitCSSMatrix || window.MSCSSMatrix)(style.transform);
	return {
		x:matrix.m41,
		y:matrix.m42,
	}
}
*/
