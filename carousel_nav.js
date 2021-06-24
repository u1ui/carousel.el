console.warn('not used for now');

var style = document.createElement('style');
style.innerHTML =
	'u1-carousel-nav {display:flex;} '+
	'u1-carousel-nav > button {width:2rem; height:2rem; padding:0; margin:.4rem; border-radius:50%; border:1px solid #fff; } '+
	'u1-carousel-nav > button:not(.-active) {background:transparent; } ';
document.head.prepend(style);



function refSlideshows(el) {
	var grp = el.getAttribute('sync-group');
	if (grp) {
		var slides = [];
		document.body.c1FindAll('u1-carousel[sync-group="'+grp+'"]').forEach(function(ssEl){
			slides.push(ssEl);
		});
		return slides;
	} else {
		return [el.closest('u1-carousel')];
	}
}


c1.onElement('u1-carousel-nav',{immediate:function(el){
	var firstSS = refSlideshows(el)[0];
	var items = firstSS.c1Find('>u1-carousel > .-slider').children;

	if (items.length < 2) el.style.display = 'none';

	Array.from(items).forEach(function(item, index){
		var button = document.createElement('button');
		button.addEventListener('click',function(){
			firstSS.slider.slideTo(index)
		});
		el.append(button);
	});
	firstSS.addEventListener('u1-carousel.slide',function(e){
		Array.from(el.children).forEach(function(button, index){
			button.classList.toggle('-active', e.detail.index === index);
		});
	});
}});
