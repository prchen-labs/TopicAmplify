var h, w;
var prevWidth;
var $grid;
var WindowsSize = function() {
	h = $(window).height();
	prevWidth = w; // Save the previous width
	w = $(window).width();
};
var itemsToShow;

$(document).ready(function() {
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
                  
$(window).resize(function() {
	WindowsSize();
	//     $grid.masonry('layout');
	reloadGridItems();

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