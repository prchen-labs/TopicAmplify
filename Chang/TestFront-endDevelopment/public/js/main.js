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
});
//應該是篩選器
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

// window.onload = function() {
//     // 取得登入和登出的按鈕元素
//     const loginBtn = document.getElementById('login');
//     const logoutBtn = document.getElementById('logout');
//     // 初始化按鈕顯示狀態
//     loginBtn.style.display = 'block';
//     logoutBtn.style.display = 'none';

//     // 登入事件
//     loginBtn.addEventListener('click', () => {
//         const xhr = new XMLHttpRequest();
//         xhr.open('POST', '/login');
//         xhr.setRequestHeader('Content-Type', 'application/json');
//         xhr.onload = function() {
//             if (xhr.status === 200) {
//                 // 登入成功，隱藏登入按鈕，顯示登出按鈕
//                 loginBtn.style.display = 'none';
//                 logoutBtn.style.display = 'block';
//             } else {
//                 alert("登入失敗，請重新輸入使用者名稱和密碼。");
//             }
//         };
//         const data = {
//             username: usernameInput.value,
//             password: passwordInput.value
//         };
//         xhr.send(JSON.stringify(data));
//     });

//     // 登出事件
//     logoutBtn.addEventListener('click', () => {
//         const xhr = new XMLHttpRequest();
//         xhr.open('POST', '/logout');
//         xhr.onload = function() {
//             if (xhr.status === 200) {
//                 // 登出成功，隱藏登出按鈕，顯示登入按鈕
//                 loginBtn.style.display = 'block';
//                 logoutBtn.style.display = 'none';
//             } else {
//                 alert("登出失敗，請重試。");
//             }
//         };
//         xhr.send();
//     });
// }