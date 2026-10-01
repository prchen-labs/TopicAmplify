var h, w;
var prevWidth;
var $grid;
var WindowsSize = function() {
	h = $(window).height();
    prevWidth = w; // Save the previous width
	w = $(window).width();
};
var itemsToShow;
function SearchBox_show() {
	$(".left-content").animate({
		opacity: 'hide',
	});
	$(".right-content").animate({
		opacity: 'hide',
	});
	$(".center-content").animate({
		width: '100%',
		opacity: '100',
	});
	$("#search-box").animate({
		width: '90%',
		opacity: '100',
	});
	$("#back").show();
}

function SearchBox_hide() {
	//hide
	$(".left-content, .right-content").stop().show("fade");
	$(".center-content, #search-box").css({
		width: '',
		opacity: ''
	});
	$("#back").hide();
}
$(document).ready(function() {
	WindowsSize();
	$("#back").hide();
	$("#back").click(function() {
		SearchBox_hide();
	});
	//$("#search-button").click(function(){
	document.querySelector('#search-button').addEventListener('click', function() {
		if ($("#search-box").val() == "") {
			if (w < 768) SearchBox_show();
		} else {
			//alert("search");
			$.ajax({
				type: 'POST',
				data: {
					search: document.querySelector('#search-box').value.toString()
				},
				url: '/search',
				success: function(result) {
					if (result != "") {
						document.open();
						document.write(result);
						document.close();
						console.log("a");
					}
				},
				error: function(error) {
					console.log(error);
				}
			});
		}
	});
	//瀑布流布局
	$grid = $('.grid').imagesLoaded(function() {
		$grid.masonry({
			itemSelector: '.grid-item',
			columnWidth: '.grid-item',
			percentPosition: true,
//             gutter: 15
		});
	});
	let initialItemsToShow = 9; // 初始顯示的項目數量 //"./views/activity.ejs"的initialItemsToShow must be also change, if changed
	let itemsPerLoad = 18; // 每次滾動到底時要顯示的項目數量
	$(window).on('scroll', function() {
		if (isScrolledToBottom()) {
			let $hiddenItems = $('.grid-item.hidden-item');
			itemsToShow = $hiddenItems.slice(0, itemsPerLoad);
			itemsToShow.removeClass('hidden-item');
			// 更新 Masonry 佈局
            reloadGridItems();
// 			$grid.masonry('appended', itemsToShow);
		}
	});
});
// $(window).resize(WindowsSize);
$(window).resize(function() {
    WindowsSize();
//     $grid.masonry('layout');
    reloadGridItems();

});
document.addEventListener("DOMContentLoaded", function() {
	const menuBtn = document.getElementById("side_menu");
	const filter = document.getElementById("filter");
	const filterItems = document.querySelectorAll(".filter-item");
	const toplinks = document.querySelectorAll(".toplink");
	menuBtn.addEventListener("click", function() {
		filter.classList.toggle("hidden");
	});
	filterItems.forEach(function(filterItem) {
		filterItem.addEventListener("click", function() {
			const filterValue = filterItem.getAttribute("data-filter");
			toplinks.forEach(function(toplink) {
				if (toplink.textContent.trim() === filterValue) {
					toplink.classList.toggle("hidden");
				}
			});
		});
	});
});

function reloadGridItems() {
        console.log("windows changed!!!");
//         console.log(`windows prewidth: ${prevWidth}`);
//         console.log(`Now windows width: ${w}, windows height: ${h}`);
//         $grid.masonry('reloadItems');
        $grid.imagesLoaded().progress(function() {
//              $grid.masonry('appended', itemsToShow);
            $grid.masonry('layout');
            
        });
}

function isScrolledToBottom() {
	return ($(window).scrollTop() + $(window).height() >= $(document).height() - 100);
}