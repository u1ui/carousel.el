
/* element */
class u1Carousel extends HTMLElement {
		constructor() {
        super();

        let shadowRoot = this.attachShadow({ mode: 'open' });

		var svg = '<svg viewBox="0 0 9 18" width="9" height="18"><path d="M1 1l7 8-7 8"/></svg>';

        shadowRoot.innerHTML = `
        <style>
			:host { position:relative; }
			:host > button {
				xposition:absolute;
				xtop:0;
				xbottom:0;
				xleft:0;
				xwidth:2rem;
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
			}
			:host .-prev { left: 0; }
			:host .-next { right: 0; }

			:host > .-arrow svg {
				fill:none;
				stroke:currentColor;
				stroke-linejoin:round;
				stroke-linecap:round;
				stroke-width:.1rem;
			}
			:host > .-prev svg {
				transform:rotate(180deg);
			}
			:host([item-count="0"]) > .-arrow, :host([item-count="1"]) > .-arrow {
				display:none;
			}

			/* slide */
			:host([mode=slide]) {
				overflow:hidden !important; /* todo: important is too strong! what can i do to make just overwrite the css */
			}
			:host([mode=slide]) > slot {
				width:100%; /* needed bud why? */
				display:flex;
				will-change: transform;
				transition: transform var(--u1-carousel-animation-speed, 1s) ease-out;
				overflow: visible;
			}
			/* scroll */
			:host([mode=scroll]) {
				overflow:visible !important;
			}
			:host([mode=scroll]) > slot {
				display:flex;
				overflow:hidden !important;
			}
			/* fade */
			:host([mode=fade]) {
				display:flex !important;
				z-index:0;
				overflow: visible !important;
			}
			:host([mode=fade]) ::slotted(*) {
				transition:opacity var(--u1-carousel-animation-speed, 1s) ease-in-out;
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
		<button class="-arrow -prev -ctrl" aria-label="previous slide" aria-controls="'+ss.slider.c1Id()+'">${svg}</button>
        <slot></slot>
		<button class="-arrow -next -ctrl" aria-label="next slide"     aria-controls="'+ss.slider.c1Id()+'">${svg}</button>
        `;

		this.options = {animation_duration:1, play_interval:5};

		var mode = this.getAttribute('mode');
		if (!u1Carousel.mode[mode]) {
			mode = 'slide'
			this.setAttribute('mode','slide');
		}
		this.handler = u1Carousel.mode[mode];
		this.handler.init && this.handler.init.call(this);

		this.dispatchEvent(new CustomEvent('u1-carousel.init',{
			bubbles:true,
			detail:{slider:this}
		}));
		setTimeout(()=>{ !this.active && this.next(); }); // this way i can add eventlistener that reacts to the change
		this._nextDelayed = this._nextDelayed.bind(this);

		this.slider = this.shadowRoot.querySelector('slot');

		var prev = this.shadowRoot.querySelector('.-prev');
		var next = this.shadowRoot.querySelector('.-next');
		next.addEventListener('click',()=>this.next());
		prev.addEventListener('click',()=>this.prev());

    }
	static get observedAttributes() {
		return ['play', 'mode'];
	}
	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'play') {
			let play = this.hasAttribute('play');
			this[play?'play':'stop']();
		}
	}
	activeIndex(){
		return Array.prototype.indexOf.call(this.children, this.active);
	}
    slideTo(target){
		if (typeof target === 'number') target = this.children[target]; // by index

		if (this.active !== target) { // just trigger if not active
			this.active && this.active.setAttribute('aria-hidden',true)
			this.active = target;
			this.active.setAttribute('aria-hidden',false)

			target.dispatchEvent(new CustomEvent('u1-carousel.slide',{
				bubbles:true,
				detail:{
					//old:old,
					slide:target,
					index:Array.prototype.indexOf.call(this.children, target),
					slider:this,
				}
			}));
		}
        this.handler.slideTo && this.handler.slideTo.call(this, target);
    }
    next(){
       this.slideTo(this._sibling('next'));
    }
    prev(){
        this.slideTo(this._sibling('prev'));
    }
    _sibling(direction){
        var sibling = this.active || this.lastElementChild;
		if (!sibling) return; // no slide
        while (1) {
            var sibling = direction === 'prev'
                ? sibling.previousElementSibling || this.lastElementChild
                : sibling.nextElementSibling     || this.firstElementChild;
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

		var speed = this.customProperty('slideshow-speed');
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
		this.setAttribute('item-count', this.children.length); // todo, dynamic react on dynamic added slides, mutation observer?
    }
}


u1Carousel.mode = {};
// scroll
u1Carousel.mode.scroll = {
    slideTo:function(target){
        //target.scrollIntoView({behavior:'smooth', zzzblock:'end'});
		this.slider.scroll({ // todo: test: items-padding
			top: target.offsetTop,
			left: target.offsetLeft,
			behavior: 'smooth'
		});
    }
}
// slide
u1Carousel.mode.slide = {
	init:function(){
		//this.addSwipe();
	},
	slideTo:function(target){
		requestAnimationFrame(()=>{
			//this.style.overflow = 'hidden';
			//this.slider.style.display = 'flex';
			this.slider.style.transform = 'translateX(-'+(100*this.activeIndex())+'%)';
		});
	},
}
// fade (entirely done by css)
u1Carousel.mode.fade = {}



customElements.define('u1-carousel', u1Carousel)



function hashchange(){
	if (!location.hash) return;
	var el = document.getElementById(location.hash.substr(1));
	if (!el) return;
	var sliderEl = el.closest('u1-carousel');
	if (!sliderEl) return;
	var slide = el.closest('u1-carousel > *');
	sliderEl.slideTo(slide);
}
addEventListener('DOMContentLoaded', hashchange);
addEventListener('hashchange', hashchange);






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
