var user = null; // 初始值為 null
// 獲取 user 變數的值，並在取得後執行以下程式碼
getUser(function(result) {
window.onload = function() {
    user = result;
    // 獲取登入/登出按鈕    
    var loginLogoutBtn = document.getElementById("login-logout");
    // 判斷使用者是否登入
    if (user) {
      // 使用者已登入，顯示登出按鈕，隱藏登入按鈕
      loginLogoutBtn.innerHTML = "登出";
      loginLogoutBtn.style.display = "block";
      loginLogoutBtn.addEventListener("click", function() {
        // 點擊登出按鈕時，執行登出操作
        logout();
      });
    } else {
      // 使用者未登入，顯示登入按鈕，隱藏登出按鈕
      loginLogoutBtn.innerHTML = "登入";
      loginLogoutBtn.style.display = "block";
      loginLogoutBtn.addEventListener("click", function() {
        // 點擊登入按鈕時，跳轉到登入頁面
        window.location.href = "/login";
      });
    }
}
