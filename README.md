# carousel.el

# Features

- css only fallback
- keyboard navigation
- play / stop
- stops playing if focus is inside
- slide on focus (eg. inputs inside)
- 3 Modes (slide, scroll, fade)

# Ussage

<link rel=stylesheet href="../carousel.css">
<script src="../carousel.js" type=module></script>

<u1-carousel mode=slide play style="--u1-carousel-slideshow-speed:2s" tabindex="0">
    <div>
        <h2 slot="title">My cute cats</h2>
    </div>
    <img src="myCat.jpg">
    <img src="myCat2.jpg">
</u1-carousel>
